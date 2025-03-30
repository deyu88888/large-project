from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db.models import Q, Manager
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
import json
import traceback

from api.models import (
    BroadcastMessage, User, Society, Event, SocietyNews, 
    NewsComment, NewsPublicationRequest, Notification
)
from api.serializers import (
    BroadcastSerializer, SocietyNewsSerializer, 
    NewsCommentSerializer, NewsPublicationRequestSerializer
)
from api.views_files.view_utility import has_society_management_permission


#######################
# Permission Classes
#######################

class IsAdminOrPresident(BasePermission):
    """Defines a permission check for if a user is an admin or president"""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        is_admin = hasattr(request.user, 'is_admin') and callable(getattr(request.user, 'is_admin')) and request.user.is_admin()
            
        is_president = False
        if hasattr(request.user, 'student'):
            if hasattr(request.user.student, 'is_president'):
                is_president = request.user.student.is_president
                
        return is_admin or is_president


#######################
# Utility Functions
#######################

def is_society_member(user, society_id):
    """
    Check if a user is a member of a society with thorough verification.
    Returns True if the user is a member, False otherwise.
    """
    if not hasattr(user, 'student'):
        return False
        
    student = user.student
    
    # Check direct membership
    try:
        if student.societies.filter(id=society_id).exists():
            return True
    except Exception:
        pass
    
    # Check societies_belongs_to
    try:
        if student.societies_belongs_to.filter(id=society_id).exists():
            return True
    except Exception:
        pass
        
    # Check presidency
    try:
        if hasattr(student, 'president_of') and student.president_of and student.president_of.id == society_id:
            return True
    except Exception:
        pass
        
    # Check vice presidency
    try:
        vp_society = getattr(student, 'vice_president_of_society', None)
        if vp_society and vp_society.id == society_id:
            return True
    except Exception:
        pass
        
    # Check officer/management permissions
    try:
        society = Society.objects.get(id=society_id)
        if has_society_management_permission(student, society):
            return True
    except Exception:
        pass
        
    return False

def standard_error_response(message, code=status.HTTP_400_BAD_REQUEST):
    """Standard format for error responses"""
    return Response({"error": message}, status=code)

def parse_json_field(data, field_name):
    """Safely parse a JSON string from request data"""
    if field_name in data and isinstance(data[field_name], str):
        try:
            return json.loads(data[field_name])
        except json.JSONDecodeError:
            return data[field_name]
    return data.get(field_name)

def mark_previous_requests_superseded(news_post):
    """Mark any previous requests as superseded to maintain history"""
    NewsPublicationRequest.objects.filter(
        news_post=news_post,
        status="Approved"
    ).update(status="Superseded_Approved")
    
    NewsPublicationRequest.objects.filter(
        news_post=news_post,
        status="Rejected"
    ).update(status="Superseded_Rejected")

def cancel_pending_requests(news_post):
    """Cancel any pending publication requests"""
    NewsPublicationRequest.objects.filter(
        news_post=news_post,
        status="Pending"
    ).update(status="Cancelled")


#######################
# Broadcast Views 
#######################

class NewsView(APIView):
    """View to create BroadcastMessages"""
    permission_classes = [IsAuthenticated, IsAdminOrPresident]

    def post(self, request):
        """Allows creation of a global or localised message"""
        user = request.user
        data = request.data
        societies = list(map(int, data.get("societies", [])))
        events = list(map(int, data.get("events", [])))
        message = data.get("message", "")
        recipients = set()

        if not message:
            return standard_error_response("Message content is required.")

        if 'all' in data.get('target', []):
            recipients.update(User.objects.all())
        else:
            if societies:
                society_members = User.objects.filter(
                    student__isnull=False,
                    student__societies__in=Society.objects.filter(id__in=societies)
                ).distinct()
                recipients.update(society_members)

            if events:
                event_attendees = User.objects.filter(
                    student__isnull=False,
                    student__attended_events__in=Event.objects.filter(id__in=events)
                ).distinct()
                recipients.update(event_attendees)

        broadcast = BroadcastMessage.objects.create(sender=user, message=message)

        if societies:
            broadcast.societies.set(Society.objects.filter(id__in=societies))
        if events:
            broadcast.events.set(Event.objects.filter(id__in=events))
        if recipients:
            broadcast.recipients.set(list(recipients))
        broadcast.save()

        return Response(BroadcastSerializer(broadcast).data, status=status.HTTP_201_CREATED)


class BroadcastListAPIView(APIView):
    """View to list BroadcastMessages"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Gets all broadcast messages for a user"""
        user = request.user

        query = Q(recipients=user)

        if hasattr(user, 'student'):
            student = user.student
            query |= (Q(societies__in=student.societies.all())
                  | Q(events__in=student.attended_events.all()))

        broadcasts = BroadcastMessage.objects.filter(query).distinct()

        serializer = BroadcastSerializer(broadcasts, many=True)
        return Response(serializer.data)


#######################
# News Management Views
#######################

class SocietyNewsListView(APIView):
    """API view for handling society news list operations, including viewing and creating news posts."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, society_id):
        try:
            society = get_object_or_404(Society, id=society_id)
            
            # Check if user is a member of the society
            if not is_society_member(request.user, society_id):
                return standard_error_response(
                    "You must be a member of this society to view its news.",
                    status.HTTP_403_FORBIDDEN
                )

            # Determine which posts to show based on permissions
            try:
                if has_society_management_permission(request.user.student, society):
                    news_posts = SocietyNews.objects.filter(society=society)
                else:
                    news_posts = SocietyNews.objects.filter(society=society, status="Published")

                news_posts = news_posts.order_by('-is_pinned', '-created_at')
                serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
                
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Exception:
                traceback.print_exc()
                return standard_error_response(
                    "An error occurred processing news posts.",
                    status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        except Exception:
            traceback.print_exc()
            return standard_error_response(
                "An unexpected error occurred.",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, society_id):
        request_data = request.data.copy()

        try:
            society = get_object_or_404(Society, id=society_id)
            
            # Verify user is a student
            if not hasattr(request.user, 'student'):
                return standard_error_response(
                    "Only society presidents and vice presidents can create news posts.",
                    status.HTTP_403_FORBIDDEN
                )

            # Verify user has management permissions
            if not has_society_management_permission(request.user.student, society):
                return standard_error_response(
                    "Only society presidents and vice presidents can create news posts.",
                    status.HTTP_403_FORBIDDEN
                )

            # Prepare data for serialization
            data = request_data.copy()
            data._mutable = True
            data['society'] = society.id

            # Ensure posts start as Draft
            if 'status' in data and data['status'] == 'Published':
                data['status'] = 'Draft'

            # Convert boolean strings to actual booleans
            for field in ['is_pinned', 'is_featured']:
                if field in data:
                    data[field] = data[field].lower() == 'true'

            # Parse JSON fields
            if 'tags' in data and isinstance(data['tags'], str):
                data['tags'] = parse_json_field(data, 'tags')

            data._mutable = False
            
            # Create the news post
            serializer = SocietyNewsSerializer(data=data, context={'request': request})
            if serializer.is_valid():
                news_post = serializer.save(author=request.user.student)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            return standard_error_response(str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)


class SocietyNewsDetailView(APIView):
    """API view for retrieving, updating, and deleting individual society news posts."""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society

        # Admins can view all posts
        if request.user.is_admin():
            pass
        else:
            # Check if user is a member
            if not is_society_member(request.user, society.id):
                return standard_error_response(
                    "You must be a member of this society to view its news.",
                    status.HTTP_403_FORBIDDEN
                )

            # Only managers can view unpublished posts
            if news_post.status != "Published":
                if not hasattr(request.user, 'student') or not has_society_management_permission(request.user.student, society):
                    return standard_error_response(
                        "This news post is not published.",
                        status.HTTP_403_FORBIDDEN
                    )

        # Track view count
        news_post.increment_view_count()

        serializer = SocietyNewsSerializer(news_post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        # Check permissions
        if not hasattr(request.user, 'student') or not has_society_management_permission(request.user.student, society):
            return standard_error_response(
                "Only society presidents and vice presidents can update news posts.",
                status.HTTP_403_FORBIDDEN
            )
        
        # Process request data
        data = {}
        files_present = False
        
        # Check both FILES and DATA
        print("Request FILES:", request.FILES)
        print("Request DATA keys:", request.data.keys())
        
        # Process both regular data and file data
        for key in request.data:
            # Check if this is a file field
            if hasattr(request.data[key], 'read'):
                data[key] = request.data[key]
                files_present = True
                print(f"File field detected: {key}")
            else:
                data[key] = request.data[key]
                # Check if we're clearing a file field
                if key in ['image', 'attachment'] and data[key] == '':
                    print(f"Clearing file field: {key}")
                    files_present = True
        
        # Check if there are files in request.FILES that weren't caught
        for key in request.FILES:
            if key not in data:
                data[key] = request.FILES[key]
                files_present = True
                print(f"File from request.FILES: {key}")
        
        current_status = news_post.status
        
        # Handle status transitions for published/rejected posts
        if current_status == "Published" or current_status == "Rejected":
            # Check for content changes
            content_changed = 'content' in data and data['content'] != news_post.content
            
            # If content has changed or any files are present, we need approval
            if content_changed or files_present:
                print(f"Content changed: {content_changed}, Files present: {files_present}")
                print("Setting status to PendingApproval")
                
                # Set the status to PendingApproval
                data['status'] = "PendingApproval"
                
                serializer = SocietyNewsSerializer(news_post, data=data, partial=True, context={'request': request})
                if serializer.is_valid():
                    updated_post = serializer.save()
                    
                    # Update request statuses
                    cancel_pending_requests(news_post)
                    mark_previous_requests_superseded(news_post)
                    
                    # Get latest superseded request for reference
                    latest_approved = NewsPublicationRequest.objects.filter(
                        news_post=news_post,
                        status="Superseded_Approved"
                    ).order_by('-reviewed_at').first()
                    
                    latest_rejected = NewsPublicationRequest.objects.filter(
                        news_post=news_post,
                        status="Superseded_Rejected"
                    ).order_by('-reviewed_at').first()
                    
                    # Prepare request data
                    request_data = {
                        'news_post': updated_post,
                        'status': "Pending",
                        'requested_by': request.user.student
                    }
                    
                    # Use the most recent request between approved and rejected
                    if latest_approved and latest_rejected:
                        if latest_approved.reviewed_at > latest_rejected.reviewed_at:
                            request_data['admin_notes'] = f"Revision of previously approved content (approved on {latest_approved.reviewed_at.strftime('%Y-%m-%d %H:%M')})"
                        else:
                            request_data['admin_notes'] = f"Revision of previously rejected content (rejected on {latest_rejected.reviewed_at.strftime('%Y-%m-%d %H:%M')})"
                    elif latest_approved:
                        request_data['admin_notes'] = f"Revision of previously approved content (approved on {latest_approved.reviewed_at.strftime('%Y-%m-%d %H:%M')})"
                    elif latest_rejected:
                        request_data['admin_notes'] = f"Revision of previously rejected content (rejected on {latest_rejected.reviewed_at.strftime('%Y-%m-%d %H:%M')})"
                    
                    # Create the new publication request
                    publication_request = NewsPublicationRequest.objects.create(**request_data)
                    print(f"Created new publication request: {publication_request.id} for news post: {news_post.id}")
                    
                    return Response(serializer.data, status=status.HTTP_200_OK)
                else:
                    print(f"Serializer errors: {serializer.errors}")
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Handle other status transitions
        elif 'status' in data:
            if request.user.is_admin():
                pass
            
            # Prevent direct publishing - must use publication request
            elif current_status == "Draft" and data['status'] == "Published":
                data['status'] = "Draft"
                return Response({
                    "error": "Cannot directly publish posts. Please use the 'Submit for Approval' feature.",
                    "code": "use_publication_request"
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Handle cancellation of pending approval
            elif current_status == "PendingApproval" and data['status'] == "Draft":
                cancel_pending_requests(news_post)
        
        # Parse JSON fields
        if 'tags' in data and isinstance(data['tags'], str):
            data['tags'] = parse_json_field(data, 'tags')
        
        # Save the changes
        serializer = SocietyNewsSerializer(news_post, data=data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            print(f"Serializer errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        if not hasattr(request.user, 'student') or not has_society_management_permission(request.user.student, society):
            return standard_error_response(
                "Only society presidents and vice presidents can delete news posts.",
                status.HTTP_403_FORBIDDEN
            )
        
        news_post.delete()
        return Response({"message": "News post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


#######################
# Publication Workflow Views
#######################

class NewsPublicationRequestView(APIView):
    """
    API view for managing news publication requests.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Create a new publication request for a news post, ensuring it shows as pending
        on the admin side, regardless of previous status.
        """
        user = request.user
        if not hasattr(user, "student"):
            return standard_error_response(
                "Only students can submit publication requests",
                status.HTTP_403_FORBIDDEN
            )

        news_post_id = request.data.get('news_post')
        if not news_post_id:
            return standard_error_response(
                "News post ID is required",
                status.HTTP_400_BAD_REQUEST
            )

        try:
            news_post = SocietyNews.objects.get(id=news_post_id)
        except SocietyNews.DoesNotExist:
            return standard_error_response(
                "News post not found",
                status.HTTP_404_NOT_FOUND
            )

        society = news_post.society
        is_author = (news_post.author and news_post.author.id == user.student.id)
        has_permission = is_author or has_society_management_permission(user.student, society)

        if not has_permission:
            return standard_error_response(
                "You do not have permission to publish this news post",
                status.HTTP_403_FORBIDDEN
            )

        existing_request = NewsPublicationRequest.objects.filter(
            news_post=news_post,
            status="Pending"
        ).exists()

        if existing_request:
            return standard_error_response(
                "A publication request for this news post is already pending",
                status.HTTP_400_BAD_REQUEST
            )

        # IMPORTANT: Mark all previous requests as superseded
        # This ensures no requests remain in Approved/Rejected status
        mark_previous_requests_superseded(news_post)
        
        # Cancel any existing pending requests (although we already checked)
        cancel_pending_requests(news_post)
        
        # CRITICAL STEP: Always update the news post status to PendingApproval
        # This ensures it will appear in the pending section for admins
        news_post.status = "PendingApproval"
        news_post.save()

        # Create a new pending publication request
        publication_request = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=user.student,
            status="Pending"
        )

        serializer = NewsPublicationRequestSerializer(publication_request)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def get(self, request):
        """List publication requests for the current user"""
        user = request.user
        all_statuses = request.query_params.get('all_statuses') == 'true'

        if hasattr(user, "student"):
            # For students, filter out superseded requests by default
            requests = NewsPublicationRequest.objects.filter(
                requested_by=user.student
            ).exclude(
                status__in=["Superseded_Approved", "Superseded_Rejected"]
            ).order_by('-requested_at')
        elif user.is_admin():
            if all_statuses:
                # If the admin specifically wants all, include everything
                requests = NewsPublicationRequest.objects.all().order_by('-requested_at')
            else:
                # By default, only show pending requests to admins
                requests = NewsPublicationRequest.objects.filter(
                    status="Pending"
                ).order_by('-requested_at')
        else:
            return standard_error_response("Unauthorized", status.HTTP_403_FORBIDDEN)

        serializer = NewsPublicationRequestSerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminNewsApprovalView(APIView):
    """
    API view for admins to approve or reject news publication requests.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all pending news publication requests (admins only)"""
        if not request.user.is_admin():
            return standard_error_response(
                "Only admins can view pending publication requests",
                status.HTTP_403_FORBIDDEN
            )
        
        # Get ALL pending requests without filtering by news post status
        requests_qs = NewsPublicationRequest.objects.filter(
            status="Pending"
        ).order_by('-requested_at')
        
        # Log details for debugging
        print(f"Found {requests_qs.count()} pending publication requests")
        for req in requests_qs:
            news_post = req.news_post
            print(f"Request ID: {req.id}, News ID: {news_post.id}, News Title: {news_post.title}, News Status: {news_post.status}")
        
        # Fix any status mismatches - ensure news posts have PendingApproval status
        for req in requests_qs:
            if req.news_post.status != "PendingApproval":
                print(f"Status mismatch for news post {req.news_post.id}: {req.news_post.status} -> PendingApproval")
                req.news_post.status = "PendingApproval"
                req.news_post.save()
        
        serializer = NewsPublicationRequestSerializer(requests_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, request_id):
        """Approve or reject a news publication request"""
        if not request.user.is_admin():
            return standard_error_response(
                "Only admins can approve or reject publication requests",
                status.HTTP_403_FORBIDDEN
            )
        
        try:
            publication_request = NewsPublicationRequest.objects.get(id=request_id)
        except NewsPublicationRequest.DoesNotExist:
            return standard_error_response(
                "Publication request not found",
                status.HTTP_404_NOT_FOUND
            )
        
        action = request.data.get('status')
        if action not in ['Approved', 'Rejected']:
            return standard_error_response(
                "Invalid action. Must be 'Approved' or 'Rejected'",
                status.HTTP_400_BAD_REQUEST
            )
        
        # Update publication request
        publication_request.status = action
        publication_request.reviewed_by = request.user
        publication_request.reviewed_at = timezone.now()
        publication_request.admin_notes = request.data.get('admin_notes', '')
        
        # Update news post status
        news_post = publication_request.news_post
        if action == "Approved":
            news_post.status = "Published"
            news_post.published_at = timezone.now()
        else:
            news_post.status = "Rejected"
        
        news_post.save()
        publication_request.save()
        
        # Create notification for requester
        notification_header = f"News Publication {action}"
        notification_body = f"Your news publication request for '{news_post.title}' has been {action.lower()}."
        
        if action == "Rejected" and publication_request.admin_notes:
            notification_body += f" Admin notes: {publication_request.admin_notes}"
        
        Notification.objects.create(
            header=notification_header,
            body=notification_body,
            for_user=publication_request.requested_by,
            is_important=True
        )
        
        serializer = NewsPublicationRequestSerializer(publication_request)
        return Response(serializer.data, status=status.HTTP_200_OK)


#######################
# News Comment Views
#######################

class NewsCommentView(APIView):
    """
    API view for listing and creating comments on society news posts.
    Handles both top-level comments and replies, with appropriate permission checks
    to ensure only society members can view and create comments.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        # Check if user is a member
        if not is_society_member(request.user, society.id):
            return standard_error_response(
                "You must be a member of this society to view comments.",
                status.HTTP_403_FORBIDDEN
            )
            
        comments = NewsComment.objects.filter(news_post=news_post, parent_comment=None).order_by('created_at')
        serializer = NewsCommentSerializer(comments, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
        # Check if user is a student
        if not hasattr(request.user, 'student'):
            return standard_error_response(
                "Only students can comment.",
                status.HTTP_403_FORBIDDEN
            )
            
        student = request.user.student
        
        # Check if user is a member or officer
        is_member = student.societies.filter(id=society.id).exists() or \
                    student.societies_belongs_to.filter(id=society.id).exists()
        is_officer = has_society_management_permission(student, society)
        
        if not (is_member or is_officer):
            return standard_error_response(
                "You must be a member or officer of this society to comment.",
                status.HTTP_403_FORBIDDEN
            )
            
        # Process comment data
        parent_comment_id = request.data.get('parent_comment')
        data = {
            'content': request.data.get('content'),
            'parent_comment': parent_comment_id
        }
        
        serializer = NewsCommentSerializer(data=data, context={'request': request})
        if serializer.is_valid():
            # Check parent comment if replying
            if parent_comment_id:
                try:
                    parent_comment = NewsComment.objects.get(id=parent_comment_id)
                    if parent_comment.news_post.id != int(news_id):
                        return standard_error_response(
                            "Parent comment does not belong to this news post.",
                            status.HTTP_400_BAD_REQUEST
                        )
                except NewsComment.DoesNotExist:
                    return standard_error_response(
                        "Parent comment does not exist.",
                        status.HTTP_400_BAD_REQUEST
                    )
                    
            # Create the comment
            comment = serializer.save(news_post=news_post, user=request.user, parent_comment_id=parent_comment_id)
            return Response(
                NewsCommentSerializer(comment, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NewsCommentDetailView(APIView):
    """
    API view for managing individual news comments, providing update and delete operations
    with appropriate permission checks. Authors can edit their own comments, while both 
    authors and society officers can delete comments.
    """
    permission_classes = [IsAuthenticated]
    
    def put(self, request, comment_id):
        """
        Edit a comment (author only).
        """
        comment = get_object_or_404(NewsComment, id=comment_id)
        
        # Only comment author can edit
        if comment.user.id != request.user.id:
            return standard_error_response(
                "You can only edit your own comments.",
                status.HTTP_403_FORBIDDEN
            )
        
        serializer = NewsCommentSerializer(comment, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self, request, comment_id):
        """
        Delete a comment (author or officer).
        """
        comment = get_object_or_404(NewsComment, id=comment_id)
        news_post = comment.news_post
        society = news_post.society
        
        # Check if user is author or has management permissions
        is_author = (comment.user.id == request.user.id)
        is_officer = False
        if hasattr(request.user, 'student'):
            is_officer = has_society_management_permission(request.user.student, society)

        if not is_author and not is_officer:
            return standard_error_response(
                "You can only delete your own comments or moderate as a society officer.",
                status.HTTP_403_FORBIDDEN
            )
        
        comment.delete()
        return Response({"message": "Comment deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


class NewsCommentLikeView(APIView):
    """API view for handling likes on news comments with appropriate permission checks."""
    permission_classes = [IsAuthenticated]

    def post(self, request, comment_id):
        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
            news_post = comment.news_post
            society = news_post.society
            
            # Check if user is a member
            if not is_society_member(request.user, society.id):
                return standard_error_response(
                    "You must be a member of this society to like comments.",
                    status.HTTP_403_FORBIDDEN
                )

            # Toggle like status
            if comment.dislikes.filter(id=request.user.id).exists():
                comment.dislikes.remove(request.user)

            if comment.likes.filter(id=request.user.id).exists():
                comment.likes.remove(request.user)
                action = "unliked"
            else:
                comment.likes.add(request.user)
                action = "liked"

            return Response({
                "status": action,
                "likes_count": comment.likes.count(),
                "dislikes_count": comment.dislikes.count()
            }, status=status.HTTP_200_OK)
            
        except Exception:
            return standard_error_response("Comment not found.", status.HTTP_404_NOT_FOUND)


class NewsCommentDislikeView(APIView):
    """API view for handling dislikes on news comments with appropriate permission checks."""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, comment_id):
        try:
            comment = get_object_or_404(NewsComment, id=comment_id)
            news_post = comment.news_post
            society = news_post.society
            
            # Check if user is a member
            if not is_society_member(request.user, society.id):
                return standard_error_response(
                    "You must be a member of this society to dislike comments.",
                    status.HTTP_403_FORBIDDEN
                )
                
            # Toggle dislike status
            if comment.likes.filter(id=request.user.id).exists():
                comment.likes.remove(request.user)
                
            if comment.dislikes.filter(id=request.user.id).exists():
                comment.dislikes.remove(request.user)
                action = "undisliked"
            else:
                comment.dislikes.add(request.user)
                action = "disliked"
                
            return Response({
                "status": action,
                "likes_count": comment.likes.count(),
                "dislikes_count": comment.dislikes.count()
            }, status=status.HTTP_200_OK)
        except Exception:
            return standard_error_response("Comment not found.", status.HTTP_404_NOT_FOUND)


class MemberNewsView(APIView):
    """
    API view for retrieving published news posts from all societies that a student is a
    member of.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            if not hasattr(request.user, 'student'):
                return standard_error_response(
                    "Only students can access this view.",
                    status.HTTP_403_FORBIDDEN
                )
            
            student = request.user.student
            
            # Get all societies the student is a member of
            student_societies = student.societies.all()
            
            if not student_societies.exists():
                student_societies = student.societies_belongs_to.all()
                
            if not student_societies.exists():
                return Response([], status=status.HTTP_200_OK)
                
            # Get published news posts from these societies
            news_posts = SocietyNews.objects.filter(
                society__in=student_societies,
                status="Published"
            ).order_by('-is_pinned', '-created_at')
            
            serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception:
            return standard_error_response("An error occurred fetching news posts.", status.HTTP_500_INTERNAL_SERVER_ERROR)


