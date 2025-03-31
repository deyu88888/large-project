from django.utils import timezone
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView


from api.models import (
    BroadcastMessage, User, Society, Event, SocietyNews, 
    NewsPublicationRequest, Notification
)
from api.serializers import (
    BroadcastSerializer, NewsPublicationRequestSerializer
)
from api.views_files.view_utility import (
    get_admin_if_user_is_admin, get_object_by_id_or_name, has_society_management_permission, standard_error_response,
    mark_previous_requests_superseded, cancel_pending_requests
    )


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

        news_post = get_object_by_id_or_name(SocietyNews, news_post_id)
        if not news_post:
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

        mark_previous_requests_superseded(news_post)
        
        cancel_pending_requests(news_post)
        
        news_post.status = "PendingApproval"
        news_post.save()

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
        admin, error = get_admin_if_user_is_admin(request.user, "approve or reject publication requests")
        if error:
            return error
        
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
        admin, error = get_admin_if_user_is_admin(request.user, "approve or reject publication requests")
        if error:
            return error
        
        publication_request = get_object_by_id_or_name(NewsPublicationRequest, request_id)
        if not publication_request:
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