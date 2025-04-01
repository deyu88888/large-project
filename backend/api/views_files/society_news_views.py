from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
import traceback

from api.models import (
    Society, SocietyNews, NewsPublicationRequest
)
from api.serializers import SocietyNewsSerializer

from api.views_files.view_utility import (
    has_society_management_permission, is_society_member, standard_error_response,
    parse_json_field, mark_previous_requests_superseded, cancel_pending_requests
)


class SocietyMemberOrOfficerPermission(BasePermission):
    """Permission class that checks if a user is a member or officer of a society"""
    
    def has_permission(self, request, view):
        society_id = view.kwargs.get('society_id')
        if not society_id:
            return False
            
        # Check if user is admin
        if hasattr(request.user, 'is_admin') and callable(getattr(request.user, 'is_admin')) and request.user.is_admin():
            return True
            
        # First check if user has management permission
        try:
            society = Society.objects.get(id=society_id)
            if hasattr(request.user, 'student'):
                if has_society_management_permission(request.user.student, society):
                    return True
        except Society.DoesNotExist:
            return False
            
        # Then check regular membership
        return is_society_member(request.user, society_id)


class SocietyNewsListView(APIView):
    """API view for handling society news list operations, including viewing and creating news posts."""
    permission_classes = [IsAuthenticated, SocietyMemberOrOfficerPermission]
    
    def get(self, request, society_id):
        society = get_object_or_404(Society, id=society_id)
        
        try:
            # Determine which posts to show based on permissions
            has_management = False
            if hasattr(request.user, 'student'):
                has_management = has_society_management_permission(request.user.student, society)
            
            is_admin = hasattr(request.user, 'is_admin') and callable(getattr(request.user, 'is_admin')) and request.user.is_admin()
            
            if has_management or is_admin:
                news_posts = SocietyNews.objects.filter(society=society)
            else:
                news_posts = SocietyNews.objects.filter(society=society, status="Published")

            news_posts = news_posts.order_by('-is_pinned', '-created_at')
            serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
            
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            traceback.print_exc()
            return standard_error_response(
                f"An error occurred processing news posts: {str(e)}",
                status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def post(self, request, society_id):
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

        try:
            request_data = request.data.copy()
            data = request_data.copy()
            data._mutable = True
            data['society'] = society.id

            # Ensure posts start as Draft
            if 'status' in data and data['status'] == 'Published':
                data['status'] = 'Draft'

            for field in ['is_pinned', 'is_featured']:
                if field in data:
                    data[field] = data[field].lower() == 'true'

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
            traceback.print_exc()
            return standard_error_response(str(e), status.HTTP_500_INTERNAL_SERVER_ERROR)


class NewsDetailPermission(BasePermission):
    """Permission class for news detail view"""
    
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
            
        if hasattr(request.user, 'is_admin') and callable(getattr(request.user, 'is_admin')) and request.user.is_admin():
            return True
            
        news_id = view.kwargs.get('news_id')
        if not news_id:
            return False
            
        try:
            news_post = SocietyNews.objects.get(id=news_id)
            society = news_post.society
            
            if request.method == 'GET':
                if is_society_member(request.user, society.id):
                    if news_post.status != "Published":
                        return (hasattr(request.user, 'student') and 
                                has_society_management_permission(request.user.student, society))
                    return True
                return False
                
            if hasattr(request.user, 'student'):
                return has_society_management_permission(request.user.student, society)
                
            return False
        except SocietyNews.DoesNotExist:
            return False


class SocietyNewsDetailView(APIView):
    """API view for retrieving, updating, and deleting individual society news posts."""
    permission_classes = [IsAuthenticated, NewsDetailPermission]
    
    def get(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        news_post.increment_view_count()
        serializer = SocietyNewsSerializer(news_post, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def put(self, request, news_id):
        news_post = get_object_or_404(SocietyNews, id=news_id)
        society = news_post.society
        
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
            
            # Check if explicitly requesting resubmission for a rejected post
            resubmit_rejected = current_status == "Rejected" and data.get('resubmit', 'false').lower() == 'true'
            
            # If content has changed or any files are present or explicitly resubmitting rejected, we need approval
            if content_changed or files_present or resubmit_rejected:
                print(f"Content changed: {content_changed}, Files present: {files_present}, Resubmit: {resubmit_rejected}")
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
        news_post.delete()
        return Response({"message": "News post deleted successfully."}, status=status.HTTP_204_NO_CONTENT)


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