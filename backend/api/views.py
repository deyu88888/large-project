import logging
import json
from django.utils import timezone
from datetime import datetime, date, timedelta, time
from django.db.models.fields.files import ImageFieldFile
from django.db.models import ForeignKey, ManyToManyField
from django.forms.models import model_to_dict
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import authenticate
from django.db.models import Count, Sum
from django.utils.timezone import now, make_aware
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.views.static import serve
from rest_framework import generics, status
import traceback
import sys
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.models import AdminReportRequest, Event, Notification, Society, Student, User, Award, AwardStudent, \
    UserRequest, DescriptionRequest, AdminReportRequest, Comment, ActivityLog, ReportReply, SocietyRequest, \
    NewsPublicationRequest, BroadcastMessage, SocietyNews
from api.serializers import (
    AdminReportRequestSerializer,
    BroadcastSerializer,
    DashboardNotificationSerializer,
    DashboardStatisticSerializer,
    EventCalendarSerializer,
    EventRequestSerializer,
    EventSerializer,
    JoinSocietySerializer,
    LeaveSocietySerializer,
    NotificationSerializer,
    RecentActivitySerializer,
    RSVPEventSerializer,
    SocietyRequestSerializer,
    SocietySerializer,
    StartSocietyRequestSerializer,
    StudentSerializer,
    UserSerializer,
    AwardSerializer,
    AwardStudentSerializer,
    PendingMemberSerializer,
    DescriptionRequestSerializer, 
    CommentSerializer,
    ActivityLogSerializer,
    ReportReplySerializer,
    NewsPublicationRequestSerializer,
)
from api.utils import *
from django.db.models import Q


class CreateUserView(generics.CreateAPIView):
    """
    View for creating a new user. This view allows only POST requests for creating a user instance.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "This email is already registered."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = StudentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response({"message": "Student registered successfully"}, status=status.HTTP_201_CREATED)


class CurrentUserView(APIView):
    """
    View for retrieving and updating the currently authenticated user.
    """

    def get(self, request):
        try:
            jwt_authenticator = JWTAuthentication()
            decoded_auth = jwt_authenticator.authenticate(request)

            if decoded_auth is None:
                return Response({
                    "error": "Invalid or expired token. Please log in again."
                }, status=status.HTTP_401_UNAUTHORIZED)

            user, _ = decoded_auth
            
            try:
                student_user = Student.objects.get(pk=user.pk)
                serializer = StudentSerializer(student_user)
            except Student.DoesNotExist:
                serializer = UserSerializer(user)

            if not serializer.data:
                return Response(
                    {"error": "User data could not be retrieved. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {"error": "Server error fetching user data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        """
        Update user details
        """
        try:
            jwt_authenticator = JWTAuthentication()
            decoded_auth = jwt_authenticator.authenticate(request)

            if decoded_auth is None:
                return Response({
                    "error": "Invalid or expired token. Please log in again."
                }, status=status.HTTP_401_UNAUTHORIZED)

            user, _ = decoded_auth
            serializer = UserSerializer(user, data=request.data, partial=True)
            
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {"error": "Server error updating user data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class JoinedSocietiesView(APIView):
    """
    API View for managing societies that a student has joined.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, "student"):
            return Response({"error": "Only students can manage societies."}, status=status.HTTP_403_FORBIDDEN)

        societies = user.student.societies_belongs_to.all()
        serializer = SocietySerializer(societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, society_id):
        """
        Handle DELETE request to leave a society.
        """
        user = request.user

        # Ensure the user is a student
        if not hasattr(user, "student"):
            return Response({"error": "Only students can leave societies."}, status=status.HTTP_403_FORBIDDEN)

        # Check if the society exists
        try:
            society = Society.objects.get(id=society_id)
        except Society.DoesNotExist:
            return Response({"error": "Society does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Check if the user is actually a member of the society
        if not user.student.societies_belongs_to.filter(id=society_id).exists():
            return Response({"error": "You are not a member of this society."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the user is in a leadership position (president, vice president, or event manager)
        student = user.student
        
        # Check for president role
        if society.president == student:
            return Response(
                {"error": "As the president, you cannot leave the society. Please transfer presidency first."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check for vice president role
        if society.vice_president == student:
            return Response(
                {"error": "As the vice president, you cannot leave the society. Please resign from your position first."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check for event manager role
        if society.event_manager == student:
            return Response(
                {"error": "As the event manager, you cannot leave the society. Please resign from your position first."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Remove the student from the society
        user.student.societies_belongs_to.remove(society)

        return Response({"message": f"Successfully left society '{society.name}'."}, status=status.HTTP_200_OK)


class RequestJoinSocietyView(APIView):
    """
    API View for managing the joining of new societies by a student.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not hasattr(user, "student"):
            return Response({"error": "Only students can join societies."}, status=status.HTTP_403_FORBIDDEN)
        joined_societies = user.student.societies_belongs_to.all()
        available_societies = Society.objects.exclude(id__in=joined_societies)
        serializer = SocietySerializer(available_societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request, society_id=None):
        user = request.user
        if not hasattr(user, "student"):
            return Response({"error": "Only students can join societies."}, status=status.HTTP_403_FORBIDDEN)

        if not society_id:
            return Response({"error": "Society ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            society = Society.objects.get(id=society_id)
        except Society.DoesNotExist:
            return Response({"error": "Society does not exist."}, status=status.HTTP_404_NOT_FOUND)

        # Check if the student is already a member
        if society.members.filter(id=user.student.id).exists():
            return Response({"error": "You are already a member of this society."}, status=status.HTTP_400_BAD_REQUEST)

        # Check for existing pending request
        existing_request = SocietyRequest.objects.filter(
            from_student=user.student,
            society=society,
            intent="JoinSoc",
            approved=False
        ).first()

        if existing_request:
            return Response({
                "message": f"You already have a pending request to join {society.name}.",
                "request_id": existing_request.id
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create new society request
        society_request = SocietyRequest.objects.create(
            intent="JoinSoc",
            from_student=user.student,
            society=society,
            approved=False
        )

        return Response({
            "message": f"Request to join society '{society.name}' has been submitted for approval.",
            "request_id": society_request.id
        }, status=status.HTTP_201_CREATED)
        
class PendingJoinRequestsView(APIView):
    """API View to retrieve all pending requests for the current user."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        if not hasattr(user, "student"):
            return Response({"error": "Only students can view their requests."},
                            status=status.HTTP_403_FORBIDDEN)
        
        # Get all pending requests for this student
        pending_requests = SocietyRequest.objects.filter(
            from_student=user.student,
            approved=False
        )
        
        serializer = SocietyRequestSerializer(pending_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RSVPEventView(APIView):
    """ API View for RSVPing to events. """

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        List events the student is eligible to RSVP for.
        """
        student = request.user.student
        events = Event.objects.filter(
            date__gte=now().date(),  # Future events only
        ).exclude(
            current_attendees=student  # Exclude already RSVP’d events
        ).filter(
            # Hosted by societies the student belongs to
            hosted_by__in=student.societies.all()
        )
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        RSVP for an event.
        """
        event_id = request.data.get('event_id')
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RSVPEventSerializer(instance=event, data={}, context={
                                         'request': request, 'action': 'RSVP'})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": f"RSVP'd for event '{event.title}'."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request):
        """
        Cancel RSVP for an event.
        """
        event_id = request.data.get('event_id')
        try:
            event = Event.objects.get(id=event_id)
        except Event.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = RSVPEventSerializer(instance=event, data={}, context={
                                         'request': request, 'action': 'CANCEL'})
        if serializer.is_valid():
            serializer.save()
            return Response({"message": f"Successfully canceled RSVP for event '{event.title}'."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventHistoryView(APIView):
    """
    API View for viewing a student's event history.

    - **GET**: Retrieve a list of past events the student attended.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        student = request.user.student
        # attended_events = student.attended_events.filter(
        #     date__lt=timezone.now().date())
        attended_events = student.attended_events.all()
        serializer = EventSerializer(attended_events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentNotificationsView(APIView):
    """
    View to retrieve and update notifications for a student.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Get notifications for societies the student has joined
        user = request.user
        notifications = Notification.objects.filter(for_user=user)
        notifications = [n for n in notifications if n.is_sent()]

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can mark notifications as read."}, status=status.HTTP_403_FORBIDDEN)

        try:
            notification = Notification.objects.get(id=pk, for_user=request.user.student)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True  # Manually update is_read field
        notification.save()  # Save the notification explicitly

        return Response({"message": "Notification marked as read.", "id": pk}, status=status.HTTP_200_OK)


class AdminManageStudentDetailsView(APIView):
    """
    API View for admins to manage any student's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, student_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        
        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = StudentSerializer(student)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, student_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can update student details."}, status=status.HTTP_403_FORBIDDEN)

        student = Student.objects.filter(id=student_id).first()
        if not student:
            return Response({"error": "Student not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = StudentSerializer(student, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Student details updated successfully.", "data": serializer.data}, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentInboxView(StudentNotificationsView):
    """
    View to retrieve, update, and delete important notifications for a student.
    """
    def get(self, request):
        user = request.user
        notifications = Notification.objects.filter(for_user=user, is_important=True)
        notifications = [n for n in notifications if n.is_sent()]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def delete(self, request, notification_id):
        try:
            user = request.user
            notification = Notification.objects.get(id=notification_id, for_user=user)
            notification.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)


class StartSocietyRequestView(APIView):
    """View to handle society creation requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Ensure the user is a student
        if not hasattr(user, "student"):
            return Response({"error": "Only students can request a new society."}, status=status.HTTP_403_FORBIDDEN)
        
        student = user.student
        
        # Check if student is already a president of a society
        if hasattr(student, 'president_of') and student.president_of:
            return Response(
                {"error": "As a society president, you cannot start another society."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if student is already a vice president of a society
        if hasattr(student, 'vice_president_of_society') and student.vice_president_of_society:
            return Response(
                {"error": "As a society vice president, you cannot start another society."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # Check if student is already an event manager of a society
        if hasattr(student, 'event_manager_of_society') and student.event_manager_of_society:
            return Response(
                {"error": "As a society event manager, you cannot start another society."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate and save the data
        serializer = StartSocietyRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(requested_by=user.student)
            return Response(
                {"message": "Your request has been submitted for review."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminSocietyRequestView(APIView):
    permission_classes = [IsAdminUser]
    """
    GET request to get all the society requests that are pending in status for admins.
    """
    def get(self, request, society_status):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response(
                {"error": "Only admins can view society requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch the society requests
        # TODO: add sort by time, by adding a new field in the model
        society_status = society_status.capitalize()
        pending_societies = Society.objects.filter(status=society_status)
        serializer = SocietySerializer(pending_societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, society_id):
        """
        PUT request to update the status of the society request from pending to approved or rejected for admins.
        """
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response(
                {"error": "Only admins can approve or reject society requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch the society request using manual lookup
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response(
                {"error": "Society request not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Update the society request status
        serializer = SocietySerializer(society, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

            # # Notify WebSocket clients about the update
            channel_layer = get_channel_layer()

            # If society was approved, notify the society view WebSocket clients
            society_status = serializer.validated_data.get("status")
            action_type_map = {
                "Approved": "Approve",
                "Rejected": "Reject",
                "Pending": "Update",
            }
            action_type = action_type_map.get(society_status, "Update")

            ActivityLog.objects.create(
                action_type=action_type,
                target_type="Society",
                target_id=society.id,
                target_name=society.name,
                performed_by=user,
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
            )
            ActivityLog.delete_expired_logs()

            if society_status in ["Approved", "Rejected", "Pending"]:
                async_to_sync(channel_layer.group_send)(
                    "society_updates",
                    {
                        "type": "society_list_update",
                        "message": f"A new society has been {society_status}.",
                        "data": serializer.data,
                        "status": society_status,
                    }
                )

            return Response(
                {"message": "Society request updated successfully.", "data": serializer.data},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def has_society_management_permission(student, society, for_events_only=False):
    """
    Check if a student has management permissions for a society.
    This includes being either the president, vice president, or event manager (for event operations).
    """
    is_president = student.is_president and hasattr(society, 'president') and society.president and society.president.id == student.id
    is_vice_president = hasattr(society, 'vice_president') and society.vice_president and society.vice_president.id == student.id
    is_event_manager = False
    if for_events_only:
        is_event_manager = (hasattr(society, 'event_manager') and 
                           society.event_manager and 
                           society.event_manager.id == student.id)
    
    return is_president or is_vice_president or is_event_manager

class ManageSocietyDetailsView(APIView):
    """
    API View for society presidents and vice presidents to manage their societies.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        user = request.user
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "Only society presidents and vice presidents can manage their societies."}, 
                           status=status.HTTP_403_FORBIDDEN)
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
        if not has_society_management_permission(student, society):
            return Response({"error": "Only the society president or vice president can manage this society."}, 
                           status=status.HTTP_403_FORBIDDEN)
        serializer = SocietySerializer(society)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, society_id):
        user = request.user
        
        if not user.is_student():
            return Response(
                {"error": "Only society presidents and vice presidents can manage their societies."},
                status=status.HTTP_403_FORBIDDEN
            )
            
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response(
                {"error": "Society not found."},
                status=status.HTTP_404_NOT_FOUND
            )
            
        if not has_society_management_permission(user.student, society):
            return Response(
                {"error": "Only the society president or vice president can manage this society."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = SocietyRequestSerializer(data=request.data, context={"request": request}, partial=True)
        if serializer.is_valid():
            society_request = serializer.save(society=society)
            return Response(
                {
                    "message": "Society update request submitted. Await admin approval.",
                    "request_id": society_request.id,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminManageSocietyDetailsView(APIView):
    """
    API View for admins to manage any society's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = SocietySerializer(society)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, society_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can update society details."}, status=status.HTTP_403_FORBIDDEN)

        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # IMPORTANT: Store the original data BEFORE making any changes
        original_data = {}
        
        # Handle regular fields first
        for field in society._meta.fields:
            field_name = field.name
            if field_name not in ['id', 'user_ptr']:  # Skip certain fields
                value = getattr(society, field_name)
                
                # Handle date/time objects
                if isinstance(value, (date, datetime)):
                    original_data[field_name] = value.isoformat()
                # Handle foreign keys - store the ID instead of the object
                elif hasattr(value, 'id') and not isinstance(value, (list, dict)):
                    original_data[field_name] = value.id
                # Handle ImageField and FileField objects
                elif hasattr(value, 'url') and hasattr(value, 'name'):
                    # Store the filename or URL path instead of the file object
                    original_data[field_name] = value.name if value.name else None
                else:
                    original_data[field_name] = value
        
        # Handle many-to-many fields separately
        for field in society._meta.many_to_many:
            field_name = field.name
            # Get IDs of related objects instead of objects themselves
            related_ids = [item.id for item in getattr(society, field_name).all()]
            original_data[field_name] = related_ids
        
        # Store the original data as JSON
        try:
            original_data_json = json.dumps(original_data)
        except TypeError as e:
            # Debug info if serialization fails
            problematic_fields = {}
            for key, value in original_data.items():
                try:
                    json.dumps({key: value})
                except TypeError:
                    problematic_fields[key] = str(type(value))
            
            return Response({
                "error": f"JSON serialization error: {str(e)}",
                "problematic_fields": problematic_fields
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Process the update
        serializer = SocietySerializer(society, data=request.data, partial=True)
        if serializer.is_valid():
            # Create log entry with original data
            log_entry = ActivityLog.objects.create(
                action_type="Update",
                target_type="Society",
                target_id=society.id,
                target_name=society.name,
                performed_by=user,
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
                original_data=original_data_json  # Store original data here
            )
            
            # Now save the changes
            serializer.save()
            ActivityLog.delete_expired_logs()
            
            return Response({
                "message": "Society details updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminManageEventDetailsView(APIView):
    """
    API View for admins to manage any event's details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, event_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)
        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
        serializer = EventSerializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, event_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can update event details."}, status=status.HTTP_403_FORBIDDEN)
        
        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
        
        # IMPORTANT: Store the original data BEFORE making any changes
        original_data = {}
        
        # Handle regular fields first
        for field in event._meta.fields:
            field_name = field.name
            if field_name not in ['id', 'user_ptr']:  # Skip certain fields
                value = getattr(event, field_name)
                
                # Handle datetime objects
                if isinstance(value, datetime):
                    original_data[field_name] = value.isoformat()
                # Handle date objects
                elif isinstance(value, date) and not isinstance(value, datetime):
                    original_data[field_name] = value.isoformat()
                # Handle time objects
                elif isinstance(value, time):
                    original_data[field_name] = value.strftime('%H:%M:%S')
                # Handle timedelta objects
                elif isinstance(value, timedelta):
                    original_data[field_name] = value.total_seconds()
                # Handle foreign keys - store the ID instead of the object
                elif hasattr(value, 'id') and not isinstance(value, (list, dict)):
                    original_data[field_name] = value.id
                # Handle ImageField and FileField objects
                elif hasattr(value, 'url') and hasattr(value, 'name'):
                    # Store the filename or URL path instead of the file object
                    original_data[field_name] = value.name if value.name else None
                else:
                    original_data[field_name] = value
        
        # Handle many-to-many fields separately
        for field in event._meta.many_to_many:
            field_name = field.name
            # Get IDs of related objects instead of objects themselves
            related_ids = [item.id for item in getattr(event, field_name).all()]
            original_data[field_name] = related_ids
        
        # Store the original data as JSON
        try:
            original_data_json = json.dumps(original_data)
        except TypeError as e:
            # Debug info if serialization fails
            problematic_fields = {}
            for key, value in original_data.items():
                try:
                    json.dumps({key: value})
                except TypeError:
                    problematic_fields[key] = str(type(value))
            
            return Response({
                "error": f"JSON serialization error: {str(e)}",
                "problematic_fields": problematic_fields
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Process the update
        data = request.data.copy()
        current_attendees_data = data.pop("current_attendees", None)
        serializer = EventSerializer(event, data=data, partial=True)
        
        if serializer.is_valid():
            # Create log entry with original data
            log_entry = ActivityLog.objects.create(
                action_type="Update",
                target_type="Event",
                target_id=event.id,
                target_name=event.title,
                performed_by=user,
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
                original_data=original_data_json  # Store original data here
            )
            
            # Now save the changes
            serializer.save()
            
            # Handle current_attendees separately if provided
            if current_attendees_data is not None:
                event.current_attendees.set(current_attendees_data)
            
            ActivityLog.delete_expired_logs()
            
            return Response({
                "message": "Event details updated successfully.",
                "data": serializer.data
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminDeleteView(APIView):
    """
    View for admins to delete students, societies, and events
    """
    permission_classes = [IsAuthenticated]

    model_mapping = {
        "Student": Student,
        "Society": Society,
        "Event": Event,
    }

    def delete(self, request, target_type, target_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can delete resources."}, status=status.HTTP_403_FORBIDDEN)

        model = self.model_mapping.get(target_type)
        if not model:
            return Response({"error": "Invalid target type."}, status=status.HTTP_400_BAD_REQUEST)

        target = model.objects.filter(id=target_id).first()
        if not target:
            return Response({"error": f"{target_type} not found."}, status=status.HTTP_404_NOT_FOUND)

        original_data = model_to_dict(target)

        reason = request.data.get('reason', None)  # Extract the reason (it might be optional)
        if not reason:
            return Response({"error": "Reason for deletion is required."}, status=status.HTTP_400_BAD_REQUEST)

        
        serializable_data = {}
        for key, value in original_data.items():
            if value is None:
                serializable_data[key] = None
            elif isinstance(value, (datetime, date)):
                serializable_data[key] = value.isoformat()
            elif isinstance(value, time):
                serializable_data[key] = value.strftime("%H:%M:%S")
            elif isinstance(value, timedelta):
                serializable_data[key] = str(value)
            elif isinstance(value, ImageFieldFile):
                serializable_data[key] = value.url if value else None
            elif isinstance(value, (list, tuple)) and value and hasattr(value[0], 'email'):
                serializable_data[key] = [item.email if hasattr(item, 'email') else str(item) for item in value]
            elif hasattr(value, 'email'):
                serializable_data[key] = value.email
            elif hasattr(value, 'all'):
                related_items = list(value.all())
                if related_items and hasattr(related_items[0], 'email'):
                    serializable_data[key] = [item.email for item in related_items]
                else:
                    serializable_data[key] = [str(item) for item in related_items]
            elif hasattr(value, 'pk'):
                serializable_data[key] = str(value)
            else:
                serializable_data[key] = value
        
        try:
            original_data_json = json.dumps(serializable_data)
        except TypeError as e:
            return Response({
                "error": f"Serialization error: {str(e)}",
                "details": "Cannot serialize data for activity log"
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        ActivityLog.objects.create(
            action_type="Delete",
            target_type=target_type,
            target_id=target_id,
            target_name=str(target),
            performed_by=user,
            timestamp=timezone.now(),
            reason=reason,
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=original_data_json,
        )
        target.delete()
        ActivityLog.delete_expired_logs()

        return Response({"message": f"Deleted {target_type.lower()} moved to Activity Log."}, status=status.HTTP_200_OK)

    def post(self, request, log_id):
        """
        Handle undo requests for various actions (Delete, Approve, Reject, Update)
        """
        try:
            log_entry = ActivityLog.objects.get(id=log_id)

            # Check if the action type is supported
            supported_actions = ["Delete", "Approve", "Reject", "Update"]
            if log_entry.action_type not in supported_actions:
                return Response({"error": "Invalid action type."}, status=status.HTTP_400_BAD_REQUEST)

            target_type = log_entry.target_type
            
            # For Delete and Update actions, we need original data
            if log_entry.action_type in ["Delete", "Update"]:
                original_data_json = log_entry.original_data  # Get JSON string

                if not original_data_json:
                    return Response({"error": "No original data found for restoration."}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    original_data = json.loads(original_data_json)  # Convert back to dict
                except json.JSONDecodeError:
                    return Response({"error": "Error decoding original data."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                # For Approve/Reject, we don't necessarily need original data
                original_data = {}
                if log_entry.original_data:
                    try:
                        original_data = json.loads(log_entry.original_data)
                    except json.JSONDecodeError:
                        pass  # Just use empty dict if we can't parse it

            model = self.model_mapping.get(target_type)

            if not model:
                return Response({"error": "Unsupported target type."}, status=status.HTTP_400_BAD_REQUEST)

            # Process restoration based on action type and target type
            if log_entry.action_type == "Delete":
                # Handle delete undos
                if target_type == "Student":
                    return self._restore_student(original_data, log_entry)
                elif target_type == "Society":
                    return self._restore_society(original_data, log_entry)
                elif target_type == "Event":
                    return self._restore_event(original_data, log_entry)
                else:
                    return Response({"error": "Unsupported target type."}, status=status.HTTP_400_BAD_REQUEST)
            elif log_entry.action_type == "Update":
                # Handle update undos
                if target_type == "Society":
                    return self._undo_society_update(original_data, log_entry)
                elif target_type == "Event":
                    return self._undo_event_update(original_data, log_entry)
                else:
                    return Response({"error": "Unsupported target type for this action."}, status=status.HTTP_400_BAD_REQUEST)
            elif log_entry.action_type in ["Approve", "Reject"]:
                # Handle approve/reject undos
                if target_type == "Society":
                    return self._undo_society_status_change(original_data, log_entry)
                elif target_type == "Event":
                    return self._undo_event_status_change(original_data, log_entry)
                else:
                    return Response({"error": "Unsupported target type for this action."}, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({"error": "Unsupported action type."}, status=status.HTTP_400_BAD_REQUEST)
                
        except ActivityLog.DoesNotExist:
            return Response({"error": "Log entry not found."}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _undo_society_update(self, original_data, log_entry):
        """Handle undoing society detail updates with comprehensive relationship handling"""
        try:
            # Find the society
            society_id = log_entry.target_id
            society = Society.objects.filter(id=society_id).first()
            
            if not society:
                society_name = log_entry.target_name
                society = Society.objects.filter(name=society_name).first()
                
            if not society:
                return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Define all special fields that need specialized treatment
            many_to_many_fields = ['society_members', 'tags', 'showreel_images']
            foreign_key_fields = ['leader', 'vice_president', 'event_manager', 'treasurer', 'approved_by']
            complex_json_fields = ['social_media_links']
            
            # Create a working copy of the original data
            data = original_data.copy()
            
            # First, apply simple fields that don't involve relationships
            for key, value in data.items():
                if (key not in many_to_many_fields and 
                    key not in foreign_key_fields and 
                    key not in complex_json_fields):
                    if hasattr(society, key) and value is not None:
                        setattr(society, key, value)
            
            # Handle complex JSON fields
            if 'social_media_links' in data and isinstance(data['social_media_links'], dict):
                society.social_media_links = data['social_media_links']
            
            # Save basic field changes
            society.save()
            
            # Handle the approved_by field specifically
            if 'approved_by' in data and data['approved_by']:
                admin_id = data['approved_by']
                try:
                    from users.models import Admin
                    admin_obj = Admin.objects.get(id=admin_id)
                    society.approved_by = admin_obj
                    society.save()
                except Exception as e:
                    print(f"Error setting approved_by: {str(e)}")
            
            # Handle student role foreign keys
            for role in ['leader', 'vice_president', 'event_manager']:
                if role in data and data[role] and isinstance(data[role], dict):
                    role_id = data[role].get('id')
                    if role_id:
                        setattr(society, f"{role}_id", role_id)
            
            # Save after setting foreign keys
            society.save()
            
            # Handle society_members (many-to-many)
            if 'society_members' in data and isinstance(data['society_members'], list):
                society.society_members.clear()
                for member_id in data['society_members']:
                    try:
                        # Assuming Student model is imported or accessible
                        from users.models import Student
                        student = Student.objects.get(id=member_id)
                        society.society_members.add(student)
                    except Exception as e:
                        print(f"Error adding member {member_id}: {str(e)}")
            
            # Handle tags (many-to-many)
            if 'tags' in data and isinstance(data['tags'], list):
                society.tags.clear()
                for tag_value in data['tags']:
                    # Tags might be complex - handle different possible formats
                    try:
                        # If it's a JSON string within the list (unusual but possible)
                        if isinstance(tag_value, str) and tag_value.startswith('['):
                            import json
                            tag_objects = json.loads(tag_value)
                            # Now handle tag_objects appropriately...
                            # This depends on your tag model structure
                        # If it's a direct tag ID
                        else:
                            society.tags.add(tag_value)
                    except Exception as e:
                        print(f"Error adding tag {tag_value}: {str(e)}")
            
            # Handle showreel_images (many-to-many or similar)
            if 'showreel_images' in data:
                # You may need specialized handling depending on exactly what showreel_images is
                try:
                    # If it's a clear/add situation:
                    society.showreel_images.clear()
                    if data['showreel_images'] and isinstance(data['showreel_images'], list):
                        for image in data['showreel_images']:
                            society.showreel_images.add(image)
                except Exception as e:
                    print(f"Error handling showreel_images: {str(e)}")
            
            # Final save after all relationships are set
            society.save()
            
            # Delete the log entry
            log_entry.delete()
            
            return Response({"message": "Society update undone successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to undo Society update: {str(e)}",
                "original_data_content": original_data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


    def _undo_society_status_change(self, original_data, log_entry):
        """Handle undoing society status changes (approve/reject)"""
        try:
            # Find the society by ID
            society_id = log_entry.target_id
            society = Society.objects.filter(id=society_id).first()
            
            if not society:
                # Try to find by name if the ID doesn't work
                society_name = log_entry.target_name
                society = Society.objects.filter(name=society_name).first()
                
            if not society:
                return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Simply set the status back to Pending regardless of original data
            society.status = "Pending"
            
            # If there was an approved_by field and we're undoing an approval, clear it
            if log_entry.action_type == "Approve" and hasattr(society, 'approved_by'):
                society.approved_by = None
            
            society.save()
            
            # Create a new activity log for this undo action
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Society",
                target_id=society.id,
                target_name=society.name,
                performed_by=log_entry.performed_by,  # Use the same user who performed the original action
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
            # Delete the original log entry
            log_entry.delete()
            
            return Response({
                "message": "Society status change undone successfully. Status set back to Pending."
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Failed to undo society status change: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _undo_event_update(self, original_data, log_entry):
        """Handle undoing event detail updates with comprehensive relationship handling"""
        try:
            # Find the event
            event_id = log_entry.target_id
            event = Event.objects.filter(id=event_id).first()
            
            if not event:
                event_name = log_entry.target_name
                event = Event.objects.filter(title=event_name).first()
                
            if not event:
                return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Define all special fields that need specialized treatment
            many_to_many_fields = ['attendees', 'tags', 'images', 'current_attendees']
            foreign_key_fields = ['society', 'organizer', 'approved_by', 'hosted_by']
            complex_json_fields = ['location_details']
            date_fields = ['date']
            time_fields = ['start_time']
            timedelta_fields = ['duration']
            
            # Create a working copy of the original data
            data = original_data.copy()
            
            # Process date fields
            for field_name in date_fields:
                if field_name in data and data[field_name]:
                    try:
                        # Convert string date back to date object
                        date_str = data[field_name]
                        date_obj = datetime.strptime(date_str, '%Y-%m-%d').date()
                        setattr(event, field_name, date_obj)
                    except Exception as e:
                        print(f"Error restoring date field {field_name}: {str(e)}")
            
            # Process time fields
            for field_name in time_fields:
                if field_name in data and data[field_name]:
                    try:
                        # Convert string time back to time object
                        time_str = data[field_name]
                        hour, minute, second = map(int, time_str.split(':'))
                        time_obj = time(hour, minute, second)
                        setattr(event, field_name, time_obj)
                    except Exception as e:
                        print(f"Error restoring time field {field_name}: {str(e)}")
            
            # Process timedelta fields
            for field_name in timedelta_fields:
                if field_name in data and data[field_name] is not None:
                    try:
                        # Convert seconds back to timedelta
                        seconds = float(data[field_name])
                        delta = timedelta(seconds=seconds)
                        setattr(event, field_name, delta)
                    except Exception as e:
                        print(f"Error restoring timedelta field {field_name}: {str(e)}")
            
            # Apply simple fields that don't involve relationships
            for key, value in data.items():
                if (key not in many_to_many_fields and 
                    key not in foreign_key_fields and 
                    key not in complex_json_fields and
                    key not in date_fields and
                    key not in time_fields and
                    key not in timedelta_fields):
                    if hasattr(event, key) and value is not None:
                        setattr(event, key, value)
            
            # Handle complex JSON fields
            if 'location_details' in data and isinstance(data['location_details'], dict):
                event.location_details = data['location_details']
            
            # Save basic field changes
            event.save()
            
            # Handle the approved_by field specifically
            if 'approved_by' in data and data['approved_by']:
                admin_id = data['approved_by']
                try:
                    from users.models import Admin
                    admin_obj = Admin.objects.get(id=admin_id)
                    event.approved_by = admin_obj
                    event.save()
                except Exception as e:
                    print(f"Error setting approved_by: {str(e)}")
            
            # Handle society foreign key
            if 'society' in data and data['society']:
                try:
                    society_id = data['society'] if isinstance(data['society'], int) else data['society'].get('id')
                    if society_id:
                        event.society_id = society_id
                except Exception as e:
                    print(f"Error setting society: {str(e)}")
            
            # Handle organizer foreign key
            if 'organizer' in data and data['organizer']:
                try:
                    organizer_id = data['organizer'] if isinstance(data['organizer'], int) else data['organizer'].get('id')
                    if organizer_id:
                        event.organizer_id = organizer_id
                except Exception as e:
                    print(f"Error setting organizer: {str(e)}")
                    
            # Handle hosted_by foreign key
            if 'hosted_by' in data and data['hosted_by']:
                try:
                    society_id = data['hosted_by'] if isinstance(data['hosted_by'], int) else data['hosted_by'].get('id')
                    if society_id:
                        event.hosted_by_id = society_id
                except Exception as e:
                    print(f"Error setting hosted_by: {str(e)}")
            
            # Save after setting foreign keys
            event.save()
            
            # Handle attendees (many-to-many)
            if 'attendees' in data and isinstance(data['attendees'], list):
                event.attendees.clear()
                for attendee_id in data['attendees']:
                    try:
                        from users.models import Student
                        student = Student.objects.get(id=attendee_id)
                        event.attendees.add(student)
                    except Exception as e:
                        print(f"Error adding attendee {attendee_id}: {str(e)}")
            
            # Handle current_attendees (many-to-many)
            if 'current_attendees' in data and isinstance(data['current_attendees'], list):
                event.current_attendees.clear()
                for attendee_id in data['current_attendees']:
                    try:
                        from users.models import Student
                        student = Student.objects.get(id=attendee_id)
                        event.current_attendees.add(student)
                    except Exception as e:
                        print(f"Error adding current attendee {attendee_id}: {str(e)}")
            
            # Handle tags (many-to-many)
            if 'tags' in data and isinstance(data['tags'], list):
                event.tags.clear()
                for tag_value in data['tags']:
                    try:
                        event.tags.add(tag_value)
                    except Exception as e:
                        print(f"Error adding tag {tag_value}: {str(e)}")
            
            # Handle images (many-to-many or similar)
            if 'images' in data:
                try:
                    event.images.clear()
                    if data['images'] and isinstance(data['images'], list):
                        for image in data['images']:
                            event.images.add(image)
                except Exception as e:
                    print(f"Error handling images: {str(e)}")
            
            # Final save after all relationships are set
            event.save()
            
            # Delete the log entry
            log_entry.delete()
            
            return Response({"message": "Event update undone successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                "error": f"Failed to undo Event update: {str(e)}",
                "original_data_content": original_data
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _undo_event_status_change(self, original_data, log_entry):
        """Handle undoing event status changes (approve/reject)"""
        try:
            # Find the event by ID
            event_id = log_entry.target_id
            event = Event.objects.filter(id=event_id).first()
            
            if not event:
                # Try to find by name if the ID doesn't work
                event_name = log_entry.target_name
                event = Event.objects.filter(name=event_name).first()
                
            if not event:
                return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
            
            # Simply set the status back to Pending regardless of original data
            event.status = "Pending"
            
            # If there was an approved_by field and we're undoing an approval, clear it
            if log_entry.action_type == "Approve" and hasattr(event, 'approved_by'):
                event.approved_by = None
            
            event.save()
            
            # Create a new activity log for this undo action
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Event",
                target_id=event.id,
                target_name=event.name,
                performed_by=log_entry.performed_by,  # Use the same user who performed the original action
                timestamp=timezone.now(),
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
            # Delete the original log entry
            log_entry.delete()
            
            return Response({
                "message": "Event status change undone successfully. Status set back to Pending."
            }, status=status.HTTP_200_OK)
        
        except Exception as e:
            return Response({"error": f"Failed to undo event status change: {str(e)}"}, 
                        status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _restore_student(self, original_data, log_entry):
        """Handle student restoration"""
        try:
            # Extract basic fields for the User model - INCLUDE ROLE HERE
            user_data = {
                'username': original_data.get('username'),
                'email': original_data.get('email'),
                'first_name': original_data.get('first_name'),
                'last_name': original_data.get('last_name'),
                'is_active': original_data.get('is_active', True),
                'role': original_data.get('role', 'student'),  # Make sure role goes in User model
            }
            
            # Try to find existing user
            user_id = original_data.get('id')
            email = user_data.get('email')
            username = user_data.get('username')
            
            user = None
            if user_id:
                try:
                    user = User.objects.filter(id=int(user_id)).first()
                except (ValueError, TypeError):
                    pass
                    
            if not user and email:
                user = User.objects.filter(email=email).first()
                
            if not user and username:
                user = User.objects.filter(username=username).first()
            
            # If user doesn't exist, create a new one
            if not user:
                # Make email unique if needed
                if email:
                    while User.objects.filter(email=email).exists():
                        timestamp = int(time.time())
                        email_parts = email.split('@')
                        if len(email_parts) == 2:
                            email = f"{email_parts[0]}+{timestamp}@{email_parts[1]}"
                        else:
                            email = f"restored_{timestamp}@example.com"
                    user_data['email'] = email
                
                # Make username unique if needed
                if username:
                    while User.objects.filter(username=username).exists():
                        timestamp = int(time.time())
                        username = f"{username}_{timestamp}"
                    user_data['username'] = username
                    
                # Create new user
                user = User.objects.create(**user_data)
            
            # Check if student already exists for this user
            student = Student.objects.filter(user_ptr=user).first()
            
            # Prepare student-specific data - EXCLUDE ROLE
            student_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'username', 'email', 'first_name', 'last_name', 'is_active',
                'password', 'last_login', 'is_superuser', 'is_staff', 'date_joined',
                'groups', 'user_permissions', 'societies', 'attended_events', 'followers',
                'following', 'president_of', 'user_ptr', 'role'  # Exclude role from student data
            ]}
            
            if not student:
                # Create new student using the proper inheritance approach
                from django.contrib.contenttypes.models import ContentType
                
                # Create student with proper User inheritance
                student = Student(user_ptr_id=user.id)
                student.__dict__.update(user.__dict__)
                
                # Apply student-specific fields
                for key, value in student_data.items():
                    if value is not None:  # Only set non-None values
                        setattr(student, key, value)
                
                # Save with raw=True to avoid problems with inheritance
                student.save_base(raw=True)
            else:
                # Update existing student with student-specific fields
                for key, value in student_data.items():
                    if value is not None:  # Only set non-None values
                        setattr(student, key, value)
                student.save()
            
            # Handle M2M relationships using .set() method
            society_ids = original_data.get('societies', [])
            if society_ids:
                try:
                    societies = []
                    for society_id in society_ids:
                        try:
                            society = Society.objects.get(id=int(society_id))
                            societies.append(society)
                        except (Society.DoesNotExist, ValueError, TypeError):
                            pass
                    student.societies.set(societies)
                except Exception:
                    pass
            
            event_ids = original_data.get('attended_events', [])
            if event_ids:
                try:
                    events = []
                    for event_id in event_ids:
                        try:
                            event = Event.objects.get(id=int(event_id))
                            events.append(event)
                        except (Event.DoesNotExist, ValueError, TypeError):
                            pass
                    student.attended_events.set(events)
                except Exception:
                    pass
            
            follower_ids = original_data.get('followers', [])
            if follower_ids:
                try:
                    followers = []
                    for follower_id in follower_ids:
                        try:
                            follower = User.objects.get(id=int(follower_id))
                            followers.append(follower)
                        except (User.DoesNotExist, ValueError, TypeError):
                            pass
                    student.followers.set(followers)
                except Exception:
                    pass
            
            # Add handling for following relationship
            following_ids = original_data.get('following', [])
            if following_ids:
                try:
                    following = []
                    for following_id in following_ids:
                        try:
                            follow_user = User.objects.get(id=int(following_id))
                            following.append(follow_user)
                        except (User.DoesNotExist, ValueError, TypeError):
                            pass
                    student.following.set(following)
                except Exception:
                    pass
            
            # Handle president_of relationship
            president_of_id = original_data.get('president_of')
            if president_of_id:
                try:
                    society = Society.objects.get(id=int(president_of_id))
                    student.president_of = society
                    student.save()
                except (Society.DoesNotExist, ValueError, TypeError):
                    pass
            
            log_entry.delete()  # Remove log after restoration
            return Response({"message": "Student restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Student: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _restore_society(self, original_data, log_entry):
        """Handle society restoration"""
        try:
            # Extract basic fields for Society
            society_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'president', 'vice_president', 'treasurer', 'event_manager', 
                'leader', 'approved_by', 'members', 'society_members', 'events'
            ]}
            
            # Create the society without relationship fields first
            society = Society.objects.create(**society_data)
            
            # Handle ForeignKey relationships
            president_id = original_data.get('president')
            if president_id:
                try:
                    president = Student.objects.get(id=int(president_id))
                    society.president = president
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            vice_president_id = original_data.get('vice_president')
            if vice_president_id:
                try:
                    vice_president = Student.objects.get(id=int(vice_president_id))
                    society.vice_president = vice_president
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            treasurer_id = original_data.get('treasurer')
            if treasurer_id:
                try:
                    treasurer = Student.objects.get(id=int(treasurer_id))
                    society.treasurer = treasurer
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            event_manager_id = original_data.get('event_manager')
            if event_manager_id:
                try:
                    event_manager = Student.objects.get(id=int(event_manager_id))
                    society.event_manager = event_manager
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            leader_id = original_data.get('leader')
            if leader_id:
                try:
                    leader = Student.objects.get(id=int(leader_id))
                    society.leader = leader
                except (Student.DoesNotExist, ValueError, TypeError):
                    pass
            
            approved_by_id = original_data.get('approved_by')
            if approved_by_id:
                try:
                    approved_by = Admin.objects.get(id=int(approved_by_id))
                    society.approved_by = approved_by
                except (Admin.DoesNotExist, ValueError, TypeError):
                    pass
            
            society.save()
            
            # Handle M2M relationships using .set() method
            member_ids = original_data.get('members', [])
            if member_ids:
                try:
                    members = []
                    for member_id in member_ids:
                        try:
                            member = Student.objects.get(id=int(member_id))
                            members.append(member)
                        except (Student.DoesNotExist, ValueError, TypeError):
                            pass
                    society.members.set(members)
                except Exception:
                    pass  # If this fails, continue with restoration
            
            # Handle society_members if it exists
            society_member_ids = original_data.get('society_members', [])
            if society_member_ids:
                try:
                    society_members = []
                    for member_id in society_member_ids:
                        try:
                            member = Student.objects.get(id=int(member_id))
                            society_members.append(member)
                        except (Student.DoesNotExist, ValueError, TypeError):
                            pass
                    society.society_members.set(society_members)
                except Exception:
                    pass  # If this fails, continue with restoration
            
            event_ids = original_data.get('events', [])
            if event_ids:
                try:
                    events = []
                    for event_id in event_ids:
                        try:
                            event = Event.objects.get(id=int(event_id))
                            events.append(event)
                        except (Event.DoesNotExist, ValueError, TypeError):
                            pass
                    society.events.set(events)
                except Exception:
                    pass  # If this fails, continue with restoration
            
            log_entry.delete()  # Remove log after restoration
            return Response({"message": "Society restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Society: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def _restore_event(self, original_data, log_entry):
        """Handle event restoration"""
        try:
            # Extract basic fields for Event - excluding relationship fields
            event_data = {k: v for k, v in original_data.items() if k not in [
                'id', 'hosted_by', 'current_attendees', 'duration'  # Exclude duration for now
            ]}
            
            for field in ['date', 'start_time', 'end_time']:
                if field in event_data:
                    if event_data[field] and isinstance(event_data[field], str):
                        if field == 'date':
                            try:
                                event_data[field] = datetime.strptime(event_data[field], '%Y-%m-%d').date()
                            except ValueError:
                                event_data[field] = None
                        else:
                            try:
                                event_data[field] = datetime.strptime(event_data[field], '%H:%M:%S').time()
                            except ValueError:
                                event_data[field] = None
            
            event = Event.objects.create(**event_data)
            duration_str = original_data.get('duration')
            if duration_str:
                try:
                    if isinstance(duration_str, str):
                        if ',' in duration_str:
                            days_part, time_part = duration_str.split(',', 1)
                            days = int(days_part.strip().split()[0])
                            hours, minutes, seconds = map(int, time_part.strip().split(':'))
                            duration = timedelta(days=days, hours=hours, minutes=minutes, seconds=seconds)
                        else:
                            time_parts = duration_str.strip().split(':')
                            if len(time_parts) == 3:
                                hours, minutes, seconds = map(int, time_parts)
                                duration = timedelta(hours=hours, minutes=minutes, seconds=seconds)
                            else:
                                duration = timedelta(hours=1)
                        
                        event.duration = duration
                        event.save()
                except Exception:
                    event.duration = timedelta(hours=1)
                    event.save()
            
            hosted_by_id = original_data.get('hosted_by')
            if hosted_by_id:
                try:
                    society = Society.objects.get(id=int(hosted_by_id))
                    event.hosted_by = society
                    event.save()
                except (Society.DoesNotExist, ValueError, TypeError):
                    pass
            
            attendee_ids = original_data.get('current_attendees', [])
            if attendee_ids:
                try:
                    attendees = []
                    for attendee_id in attendee_ids:
                        try:
                            attendee = Student.objects.get(id=int(attendee_id))
                            attendees.append(attendee)
                        except (Student.DoesNotExist, ValueError, TypeError):
                            pass
                    event.current_attendees.set(attendees)
                except Exception:
                    pass
            
            log_entry.delete()
            return Response({"message": "Event restored successfully!"}, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": f"Failed to restore Event: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateEventRequestView(APIView):
    """
    API View for society presidents and vice presidents to create events that require admin approval.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, society_id):
        """
        Create a new event request (Pending approval)
        """
        user = request.user

        if not user.is_student():
            return Response(
                {"error": "Only society presidents and vice presidents can create events."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch the society
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response(
                {"error": "Society not found."},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check for management permissions using utility function
        if not has_society_management_permission(user.student, society, for_events_only=True):
            return Response(
                {"error": "Only the society president, vice president, or event manager can create events for this society."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Validate and save the event request instead of creating an event directly
        serializer = EventRequestSerializer(data=request.data, context={"request": request})

        if serializer.is_valid():
            serializer.save(hosted_by=society, from_student=user.student, intent="CreateEve", approved=False)  # Default: Pending
            return Response(
                {"message": "Event request submitted successfully. Awaiting admin approval.", "data": serializer.data},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AllEventsView(APIView):
    """API View to list all approved events for public user"""
    permission_classes = [AllowAny]

    def get(self, request):
        events = Event.objects.filter(status="Approved").order_by("date", "start_time")
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EventDetailsView(APIView):
    """API View to get details of an event"""
    permission_classes = [AllowAny]

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, status="Approved")
        serializer = EventSerializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)


class ManageEventListView(APIView):
    """
    Lists events for the society the currently logged-in president/vice-president/event manager is managing.
    And applies a filter (upcoming, previous, pending).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filter_type = request.query_params.get("filter", "upcoming")

        if not hasattr(request.user, "student"):
            return Response({"error": "Only students can retrieve society events."}, status=403)

        societies = request.user.student.societies_belongs_to.all()
        society_ids = [s.id for s in societies]

        if not society_ids:
            return Response([], status=200)

        # Fetch events for these societies only
        events = Event.objects.filter(hosted_by__in=society_ids)

        today = now().date()
        current_time = now().time()

        if filter_type == "upcoming":
            events = (
                events.filter(date__gt=today, status="Approved") |
                events.filter(date=today, start_time__gt=current_time, status="Approved")
            )
        elif filter_type == "previous":
            events = (
                events.filter(date__lt=today, status="Approved") |
                events.filter(date=today, start_time__lt=current_time, status="Approved")
            )
        elif filter_type == "pending":
            events = events.filter(status="Pending")

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=200)


class ManageEventDetailsView(APIView):
    """
    API View for society presidents, vice presidents, and event manager to edit or delete events.
    """
    permission_classes = [IsAuthenticated]
    
    def get_event(self, event_id):
        return get_object_or_404(Event, pk=event_id)

    def is_event_editable(self, event: Event):
        """
        Determines if an event is editable.
        Editable if:
         - The event status is "Pending", or
         - The event's datetime (date + start_time) is in the future.
        """
        current_datetime = now()
        # If event is pending, allow edits regardless of date/time.
        if event.status == "Pending":
            return True

        event_datetime = datetime.combine(event.date, event.start_time)
        if current_datetime.tzinfo:
            event_datetime = make_aware(event_datetime)
        return event_datetime > current_datetime

    def get(self, request, event_id):
        event = self.get_event(event_id)
        serializer = EventSerializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def patch(self, request, event_id):
        user = request.user
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "User is not a valid student."}, status=status.HTTP_403_FORBIDDEN)
        
        event = self.get_event(event_id)
        if not self.is_event_editable(event):
            return Response({"error": "Only upcoming or pending events can be edited."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the user has management permissions for the society
        if not has_society_management_permission(student, event.hosted_by, for_events_only=True):
            return Response({"error": "Only society presidents, vice presidents, and event managers can modify events."}, 
                            status=status.HTTP_403_FORBIDDEN)

        data = request.data.copy()
        data.setdefault("title", event.title)
        data.setdefault("description", event.description)
        data.setdefault("location", event.location)
        data.setdefault("date", event.date)
        data.setdefault("start_time", event.start_time)
        data.setdefault("duration", event.duration)

        serializer = EventRequestSerializer(
            data=data,
            context={
                "request": request,
                "hosted_by": event.hosted_by,
                "event": event, 
            }
        )
        if serializer.is_valid():
            event_request = serializer.save()
            return Response(
                {
                    "message": "Event update requested. Await admin approval.",
                    "event_request_id": event_request.id,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, event_id):
        user = request.user
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "User is not a valid student."}, status=status.HTTP_403_FORBIDDEN)
        
        event = self.get_event(event_id)
        if not self.is_event_editable(event):
            return Response({"error": "Only upcoming or pending events can be deleted."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if the user has management permissions for the society
        if not has_society_management_permission(student, event.hosted_by, for_events_only=True):
            return Response({"error": "Only society presidents, vice presidents, and event managers can modify events."}, 
                            status=status.HTTP_403_FORBIDDEN)

        event.delete()
        return Response({"message": "Event deleted successfully."}, status=status.HTTP_200_OK)


class PendingMembersView(APIView):
    """
    API View for Society Presidents and Vice Presidents to manage pending membership requests.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        """
        Retrieve all pending membership requests for a specific society.
        """
        user = request.user

        if not hasattr(user, "student"):
            return Response({"error": "Only society presidents and vice presidents can manage members."}, 
                           status=status.HTTP_403_FORBIDDEN)

        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check for management permissions using utility function
        if not has_society_management_permission(user.student, society):
            return Response({"error": "Only the society president or vice president can manage members."}, 
                           status=status.HTTP_403_FORBIDDEN)

        # Get all pending membership requests
        pending_requests = UserRequest.objects.filter(
            intent="JoinSoc", approved=False, from_student__societies_belongs_to=society
        )

        serializer = PendingMemberSerializer(pending_requests, many=True)
        return Response(serializer.data)

    def post(self, request, society_id, request_id):
        """
        Approve or reject a membership request.
        """
        user = request.user

        if not hasattr(user, "student"):
            return Response({"error": "Only society presidents and vice presidents can manage members."}, 
                           status=status.HTTP_403_FORBIDDEN)

        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)

        # Check for management permissions using utility function
        if not has_society_management_permission(user.student, society):
            return Response({"error": "Only the society president or vice president can manage members."}, 
                           status=status.HTTP_403_FORBIDDEN)

        # Find the pending request
        pending_request = UserRequest.objects.filter(id=request_id, intent="JoinSoc", approved=False).first()
        if not pending_request:
            return Response({"error": "Request not found."}, status=status.HTTP_404_NOT_FOUND)

        action = request.data.get("action")

        if action == "approve":
            # Add student to society
            student = pending_request.from_student
            society.society_members.add(student)
            pending_request.approved = True
            pending_request.save()
            return Response({"message": f"{student.first_name} has been approved."}, status=status.HTTP_200_OK)

        elif action == "reject":
            # Delete the request
            pending_request.delete()
            return Response({"message": "Request has been rejected."}, status=status.HTTP_200_OK)

        return Response({"error": "Invalid action."}, status=status.HTTP_400_BAD_REQUEST)


class AdminEventView(APIView):
    """
    Event view to show upcoming approved events.
    """

    def get(self, request, event_status) -> Response:
        """
        Returns a list of upcoming approved events sorted by date and time.
        """
        event_status = event_status.capitalize()
        events = Event.objects.filter(status=event_status).order_by("date", "start_time")
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class AdminEventRequestView(APIView):
    """
    Event view to show upcoming approved events.
    """

    def put(self, request, event_id):
        """
        PUT request to update the status of the event request from pending to approved or rejected for admins
        """
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can approve or reject event requests."}, status=status.HTTP_403_FORBIDDEN)

        event = Event.objects.filter(id=event_id).first()
        if not event:
            return Response({"error": "Event request not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EventSerializer(event, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()

        channel_layer = get_channel_layer()

        if serializer.validated_data.get("status"):
            async_to_sync(channel_layer.group_send)(
                "events_updates",
                {
                    "type": "event_update",
                    "message": "A new event has been approved.",
                    "data": serializer.data,
                    "status": serializer.validated_data.get("status")
                }
            )

            return Response({"message": "Event request updated successfully.", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminListView(APIView):
    """
    admin view for admins to view all admins
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        """
        get the list of admins for the admin.
        """
        admins = User.get_admins()
        serializer = UserSerializer(admins, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        post request to create a new admin user
        """
        if not request.user.is_super_admin:
            return Response(
                {"error": "You do not have permission to create admins."},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save(role="admin", is_staff=True)   
            return Response(
                {"message": "Admin registered successfully.", "admin": UserSerializer(user).data},
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class AdminStudentListView(APIView):
    """
    Student view for admins to view all students.
    """
    permission_classes = [IsAdminUser]

    def get(self, request) -> Response:
        """
        Get the list of students for the admin.
        """
        students = Student.objects.all()
        serializer = StudentSerializer(students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    """
    View to provide aggregated statistics for the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Aggregated statistics from the database
        total_societies = Society.objects.count()
        total_events = Event.objects.count()
        pending_approvals = Society.objects.filter(status="Pending").count()
        active_members = Student.objects.aggregate(active_members=Count("id"))["active_members"]

        stats = {
            "total_societies": total_societies,
            "total_events": total_events,
            "pending_approvals": pending_approvals,
            "active_members": active_members,
        }
        serializer = DashboardStatisticSerializer(stats)
        return Response(serializer.data, status=200)


class RecentActivitiesView(APIView):
    """
    View to provide a list of recent activities for the dashboard.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        activities = [
            {"description": "John Doe joined the Chess Society", "timestamp": now()},
            {"description": "A new event was created: 'AI Workshop'", "timestamp": now()},
        ]

        serializer = RecentActivitySerializer(activities, many=True)
        return Response(serializer.data, status=200)


class NotificationsView(APIView):
    """
    View to provide notifications for the logged-in user.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != "student":
            return Response({"error": "Only students can view notifications."}, status=403)

        notifications = Notification.objects.filter(for_user=request.user).order_by("-id")
        notifications = [n for n in notifications if n.is_sent()]
        serializer = DashboardNotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=200)


class EventCalendarView(APIView):
    """
    View to provide events for the dashboard calendar.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        events = Event.objects.all()
        serializer = EventCalendarSerializer(events, many=True)
        return Response(serializer.data, status=200)


@csrf_exempt
def get_popular_societies(request):
    """
    Returns the top 5 most popular societies based on:
    - Number of members
    - Number of hosted events
    - Total event attendees
    """

    popular_societies = (
        Society.objects.annotate(
            total_members=Count("society_members"),
            total_events=Count("events"),
            total_event_attendance=Sum("events__current_attendees")
        )
        .annotate(
            popularity_score=(
                (2 * Count("society_members")) +
                (3 * Count("events")) +
                (4 * Sum("events__current_attendees"))
            )
        )
        .order_by("-popularity_score")[:5]
        .values("id", "name", "total_members", "total_events", "total_event_attendance", "popularity_score")
    )

    return JsonResponse(list(popular_societies), safe=False)

@api_view(["GET"])
@permission_classes([])
def get_sorted_events(request):
    # Get only upcoming events
    events = Event.objects.filter(status="Approved", date__gte=now()).order_by("date", "start_time")
    serializer = EventSerializer(events, many=True)
    return Response(serializer.data)


class AwardView(APIView):
    """Handles listing, creating, retrieving, updating, and deleting awards"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None) -> Response:
        """List all awards or retrieve a specific award if ID is provided"""
        if pk:
            try:
                award = Award.objects.get(pk=pk)
                serializer = AwardSerializer(award)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except Award.DoesNotExist:
                return Response({"error": "Award not found"}, status=status.HTTP_404_NOT_FOUND)
        
        # List all awards if no ID is provided
        awards = Award.objects.all()
        serializer = AwardSerializer(awards, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        """Create a new award"""
        serializer = AwardSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk: int) -> Response:
        """Update an award by ID"""
        try:
            award = Award.objects.get(pk=pk)
        except Award.DoesNotExist:
            return Response({"error": "Award not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AwardSerializer(award, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk: int) -> Response:
        """Delete an award by ID"""
        try:
            award = Award.objects.get(pk=pk)
        except Award.DoesNotExist:
            return Response({"error": "Award not found"}, status=status.HTTP_404_NOT_FOUND)

        award.delete()
        return Response({"message": "Award deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class AwardStudentView(APIView):
    """Handles listing, assigning, retrieving, updating, and deleting awards for students"""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk=None) -> Response:
        """List all award assignments or retrieve a specific one if ID is provided"""
        if pk:
            try:
                award_student = AwardStudent.objects.get(pk=pk)
                serializer = AwardStudentSerializer(award_student)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except AwardStudent.DoesNotExist:
                return Response({"error": "Award assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        # List all award assignments
        awards_students = AwardStudent.objects.filter(student=request.user)
        serializer = AwardStudentSerializer(awards_students, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request) -> Response:
        """Assign an award to a student"""
        serializer = AwardStudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request, pk: int) -> Response:
        """Update a specific award assignment"""
        try:
            award_student = AwardStudent.objects.get(pk=pk)
        except AwardStudent.DoesNotExist:
            return Response({"error": "Award assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        serializer = AwardStudentSerializer(award_student, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk: int) -> Response:
        """Delete a specific award assignment"""
        try:
            award_student = AwardStudent.objects.get(pk=pk)
        except AwardStudent.DoesNotExist:
            return Response({"error": "Award assignment not found"}, status=status.HTTP_404_NOT_FOUND)

        award_student.delete()
        return Response({"message": "Award assignment deleted successfully"}, status=status.HTTP_204_NO_CONTENT)


class ReportToAdminView(APIView):
    """
    API view for students and society presidents to submit reports to admins and admins receive reports.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = AdminReportRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(from_student=request.user.student)
            return Response({"message": "Report submitted successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, report_id=None):
        if report_id:
            try:
                report = AdminReportRequest.objects.get(id=report_id)
                serializer = AdminReportRequestSerializer(report)
                return Response(serializer.data, status=status.HTTP_200_OK)
            except AdminReportRequest.DoesNotExist:
                return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)
        
        reports = AdminReportRequest.objects.exclude(
            replies__is_admin_reply=True
        ).order_by("-requested_at")
        serializer = AdminReportRequestSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class ReportReplyView(APIView):
    """
    API view for admins and presidents to reply to reports or other replies.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = ReportReplySerializer(data=request.data)
        if serializer.is_valid():
            report_id = serializer.validated_data.get('report').id
            report = AdminReportRequest.objects.get(id=report_id)
            
            parent_reply_id = serializer.validated_data.get('parent_reply')

            user = request.user
            is_admin = user.role == "admin" or user.is_super_admin
            is_president = user.role == "president"
            
            if parent_reply_id is None and not is_admin:
                return Response(
                    {"error": "Only admins or super admins can reply to reports directly."}, 
                    status=status.HTTP_403_FORBIDDEN
                )

            if parent_reply_id:
                parent_reply = ReportReply.objects.get(id=parent_reply_id.id)
                if is_president and not parent_reply.is_admin_reply:
                    return Response({"error": "Presidents can only reply to admin replies."}, 
                                    status=status.HTTP_403_FORBIDDEN)
            
            reply = serializer.save(
                replied_by=user,
                is_admin_reply=is_admin
            )
            
            return Response(ReportReplySerializer(reply).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def get(self, request, report_id=None):
        """Get all replies or replies for a specific report"""
        if report_id:
            replies = ReportReply.objects.filter(report_id=report_id, parent_reply=None).order_by('created_at')
        else:
            replies = ReportReply.objects.all().order_by('created_at')
        
        serializer = ReportReplySerializer(replies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MyReportsView(APIView):
    """
    API view for users to view their own submitted reports.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        reports = AdminReportRequest.objects.filter(from_student=request.user.student).order_by("-requested_at")
        serializer = AdminReportRequestSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class MyReportsWithRepliesView(APIView):
    """
    API view for users to view their own submitted reports with associated replies.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        reports = AdminReportRequest.objects.filter(from_student=request.user.student).order_by("-requested_at")
        
        reports_with_replies = []
        
        for report in reports:
            replies = ReportReply.objects.filter(report=report).order_by('created_at')
            
            report_data = AdminReportRequestSerializer(report).data
            report_data['replies'] = ReportReplySerializer(replies, many=True).data
            reports_with_replies.append(report_data)
        
        return Response(reports_with_replies, status=status.HTTP_200_OK)

class AdminReportsWithRepliesView(APIView):
    """
    API view for admins to view reports they've replied to without user response.
    """
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get(self, request):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can access this endpoint."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        all_reports = AdminReportRequest.objects.all().order_by("-requested_at")
        
        reports_with_admin_replies = []
        
        for report in all_reports:
            admin_replies = ReportReply.objects.filter(
                report=report,
                is_admin_reply=True
            ).order_by('-created_at')
            
            if admin_replies.exists():
                latest_admin_reply = admin_replies.first()
                
                newer_user_replies = ReportReply.objects.filter(
                    report=report,
                    is_admin_reply=False,
                    created_at__gt=latest_admin_reply.created_at
                ).exists()
                
                if not newer_user_replies:
                    report_data = AdminReportRequestSerializer(report).data
                    all_replies = ReportReply.objects.filter(report=report).order_by('created_at')
                    report_data['replies'] = ReportReplySerializer(all_replies, many=True).data
                    reports_with_admin_replies.append(report_data)
        
        return Response(reports_with_admin_replies, status=status.HTTP_200_OK)

class AdminRepliesListView(APIView):
    """
    API view for admins to view reports where students have replied but admin hasn't responded yet.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can access this endpoint."}, 
                            status=status.HTTP_403_FORBIDDEN)
        
        all_reports = AdminReportRequest.objects.all().order_by("-requested_at")
        
        reports_needing_attention = []
        
        for report in all_reports:
            replies = ReportReply.objects.filter(report=report).order_by('created_at')
            
            if replies.exists():
                latest_reply = replies.order_by('-created_at').first()
                
                if not latest_reply.is_admin_reply:
                    report_data = AdminReportRequestSerializer(report).data
                    if report.from_student:
                        report_data['from_student_name'] = report.from_student.get_full_name() or report.from_student.username
                    else:
                        report_data['from_student_name'] = "Unknown"
                    report_data['replies'] = ReportReplySerializer(replies, many=True).data
                    report_data['latest_reply'] = {
                        'content': latest_reply.content,
                        'created_at': latest_reply.created_at,
                        'replied_by': latest_reply.replied_by.get_full_name() if latest_reply.replied_by else "Unknown"
                    }
                    reports_needing_attention.append(report_data)
        
        return Response(reports_needing_attention, status=status.HTTP_200_OK)

class ReportReplyNotificationsView(APIView):
    """
    student notifications for replies to their reports
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        student = request.user.student
        
        student_reports = AdminReportRequest.objects.filter(from_student=student)
        replies = ReportReply.objects.filter(
            report__in=student_reports
        ).filter(
            Q(replied_by__role="admin") | Q(replied_by__is_super_admin=True)
        ).exclude(
            hidden_for_students=request.user
        ).order_by('-created_at')

        notifications = []
        for reply in replies:
            replier_name = reply.replied_by.get_full_name() if reply.replied_by else "Admin"
            is_read = request.user in reply.read_by_students.all()
            notifications.append({
                'id': reply.id,
                'report_id': reply.report.id,
                'header': f"New Reply to Your Report",
                'body': f"{replier_name} replied to your report regarding {reply.report.report_type}",
                'created_at': reply.created_at,
                'is_read': is_read,
                'type': "report_reply",
                'content_preview': reply.content[:100] + "..." if len(reply.content) > 100 else reply.content
            })
        
        return Response(notifications, status=status.HTTP_200_OK)

    def patch(self, request, reply_id):
        """
        Mark a specific reply as read
        """
        try:
            student = request.user.student     
            reply = ReportReply.objects.get(
                id=reply_id,
                report__from_student=student
            )
            reply.read_by_students.add(request.user)
            
            return Response({"status": "success"}, status=status.HTTP_200_OK)
        except ReportReply.DoesNotExist:
            return Response({"error": "Reply not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, reply_id):
        """
        Delete a notification for a specific reply (remove from student's view)
        """
        try:
            student = request.user.student
            reply = ReportReply.objects.get(
                id=reply_id,
                report__from_student=student
            )
            reply.hidden_for_students.add(request.user)
            
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ReportReply.DoesNotExist:
            return Response({"error": "Reply not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)


class ReportThreadView(APIView):
    """
    API view for viewing a complete report thread with hierarchical replies.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request, report_id):
        try:
            report = AdminReportRequest.objects.get(id=report_id)
            
            user = request.user
            is_admin = hasattr(user, 'admin')
            is_creator = hasattr(user, 'student') and user.student == report.from_student
            
            is_president = False
            if hasattr(user, 'student'):
                is_president = user.student.is_president
            
            has_replied = ReportReply.objects.filter(
                report=report, 
                replied_by=user
            ).exists()
            
            if not (is_admin or is_creator or is_president or has_replied):
                return Response(
                    {"error": "You don't have permission to view this report thread."}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            top_replies = ReportReply.objects.filter(
                report=report, 
                parent_reply=None
            ).order_by('created_at')
            
            def get_nested_replies(reply):
                reply_data = ReportReplySerializer(reply).data
                child_replies = ReportReply.objects.filter(parent_reply=reply).order_by('created_at')
                if child_replies.exists():
                    reply_data['child_replies'] = [get_nested_replies(child) for child in child_replies]
                else:
                    reply_data['child_replies'] = []
                return reply_data
            
            report_data = AdminReportRequestSerializer(report).data
            report_data['replies'] = [get_nested_replies(reply) for reply in top_replies]
            
            return Response(report_data, status=status.HTTP_200_OK)
            
        except AdminReportRequest.DoesNotExist:
            return Response({"error": "Report not found"}, status=status.HTTP_404_NOT_FOUND)


class StudentSocietyDataView(APIView):
    """
    API View to inspect a specific society (accessible to anyone).
    """
    permission_classes = [AllowAny]

    def get(self, request, society_id):
        society = get_object_or_404(Society, id=society_id)
        serializer = SocietySerializer(society, context={"request": request})
        serializer_data = serializer.data

        if request.user.is_authenticated and hasattr(request.user, 'student'):
            is_member = society.society_members.filter(id=request.user.student.id).exists()
            if is_member:
                serializer_data["is_member"] = 2
            else:
                request_exists = SocietyRequest.objects.filter(
                    society=society,
                    from_student=request.user.student,
                    intent="JoinSoc"
                ).exists()
                serializer_data["is_member"] = 1 if request_exists else 0

        return Response(serializer_data, status=status.HTTP_200_OK)



def custom_media_view(request, path):
    """Used to serve media, i.e. photos to the frontend"""
    return serve(request, path, document_root=settings.MEDIA_ROOT)


class SocietyMembersListView(APIView):

    def get(self, request, society_id):

        society = get_object_or_404(Society, pk=society_id)
        members = society.society_members.all()
        serializer = StudentSerializer(members, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class EventCommentsView(APIView):
    """
    API view for create and manage event comments
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        event_id = request.query_params.get("event_id")
        if not event_id:
            return Response({"error": "event_id is required"}, status=status.HTTP_400_BAD_REQUEST)

        comments = Comment.objects.filter(event_id=event_id, parent_comment__isnull=True).order_by("create_at")
        serializer = CommentSerializer(comments, many=True, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        Allow user to create the comments
        """
        event_id = request.data.get("event")
        content = request.data.get("content")
        parent_comment_id = request.data.get("parent_comment", None)

        if not event_id or not content:
            return Response({"error": "event and content are required."}, status=status.HTTP_400_BAD_REQUEST)

        event = get_object_or_404(Event, pk=event_id)
        parent_comment = None
        if parent_comment_id:
            parent_comment = get_object_or_404(Comment, pk=parent_comment_id)

        comment = Comment.objects.create(
            event=event,
            user=request.user,
            content=content,
            parent_comment=parent_comment
        )

        serializer = CommentSerializer(comment, context={"request": request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(["POST"])
def like_comment(request, comment_id):
    """Allow user to like a comment"""
    comment = Comment.objects.get(id=comment_id)
    user = request.user

    if user in comment.likes.all():
        comment.likes.remove(user)
        return Response({"status": "unliked"}, status=status.HTTP_200_OK)
    else:
        comment.likes.add(user)
        comment.dislikes.remove(user)
        return Response({"status": "liked"}, status=status.HTTP_200_OK)


@api_view(["POST"])
def dislike_comment(request, comment_id):
    """Allow user to dislike a comment"""
    comment = Comment.objects.get(id=comment_id)
    user = request.user

    if user in comment.dislikes.all():
        comment.dislikes.remove(user)
        return Response({"status": "undisliked"}, status=status.HTTP_200_OK)
    else:
        comment.dislikes.add(user)
        comment.likes.remove(user)
        return Response({"status": "disliked"}, status=status.HTTP_200_OK)


class SocietyDescriptionRequestAdminView(APIView):
    """
    Description request view for admins to approve/reject descriptions
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all pending description requests (Admins only)."""
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response(
                {"error": "Only admins can view pending description requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        pending_requests = DescriptionRequest.objects.filter(status="Pending")
        serializer = DescriptionRequestSerializer(pending_requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, request_id):
        """Approve or reject a pending description request."""
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response(
                {"error": "Only admins can approve or reject description requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        description_request = get_object_or_404(DescriptionRequest, id=request_id)

        status_update = request.data.get("status")
        if status_update not in ["Approved", "Rejected"]:
            return Response({"error": "Invalid status update."}, status=status.HTTP_400_BAD_REQUEST)

        if status_update == "Approved":
            society = description_request.society
            society.description = description_request.new_description
            society.save()

        description_request.status = status_update
        description_request.reviewed_by = user.admin
        description_request.save()

        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "society_updates",
            {
                "type": "society_list_update",
                "message": f"Description request for {description_request.society.name} has been {status_update.lower()}.",
                "data": DescriptionRequestSerializer(description_request).data,
                "status": status_update
            }
        )

        return Response(
            {"message": f"Description request {status_update.lower()} successfully."},
            status=status.HTTP_200_OK
        )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def toggle_follow(request, user_id):
    """
    Process User's follow/unfollow request
    - only can follow other users
    - if followed then just can unfollow, vice versa
    """
    current_user = request.user
    target_user = get_object_or_404(User, id=user_id)

    if current_user == target_user:
        return Response({"error": "You cannot follow yourself."}, status=status.HTTP_400_BAD_REQUEST)

    if current_user.following.filter(id=target_user.id).exists():
        current_user.following.remove(target_user)
        return Response({"message": "Unfollowed successfully."}, status=status.HTTP_200_OK)
    else:
        current_user.following.add(target_user)
        return Response({"message": "Followed successfully."}, status=status.HTTP_200_OK)


class MyProfileView(APIView):
    """API view to show Student's Profile"""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        student = get_object_or_404(Student, id=user_id)
        serializer = StudentSerializer(student, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class IsAdminOrPresident(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (request.user.is_admin() or request.user.is_president)


class NewsView(APIView):
    permission_classes = [IsAuthenticated, IsAdminOrPresident]

    def post(self, request):
        user = request.user
        data = request.data
        societies = list(map(int, data.get("societies", [])))  # Ensure integer IDs
        events = list(map(int, data.get("events", [])))  # Ensure integer IDs
        message = data.get("message", "")
        recipients = set()


        if not message:
            return Response({"error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

        if 'all' in data.get('target', []):
            recipients.update(User.objects.all())
        else:
            if societies:
                society_members = User.objects.filter(
                    student__isnull=False,  # Ensure the user has a student profile
                    student__societies__in=Society.objects.filter(id__in=societies)
                ).distinct()
                recipients.update(society_members)

            if events:
                event_attendees = User.objects.filter(
                    student__isnull=False,  # Ensure the user has a student profile
                    student__attended_events__in=Event.objects.filter(id__in=events)
                ).distinct()
                recipients.update(event_attendees)

        # Create the Broadcast Message
        broadcast = BroadcastMessage.objects.create(sender=user, message=message)

        # Assign societies and events
        if societies:
            broadcast.societies.set(Society.objects.filter(id__in=societies))  # Ensure valid societies
        if events:
            broadcast.events.set(Event.objects.filter(id__in=events))  # Ensure valid events
        broadcast.save()

        # Assign recipients
        if recipients:
            broadcast.recipients.set(list(recipients))

        return Response(BroadcastSerializer(broadcast).data, status=status.HTTP_201_CREATED)


class BroadcastListAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        # Initialize an empty query
        query = Q(recipients=user)

        # Check if the user has a student relation before accessing societies/events
        if hasattr(user, 'student'):
            student = user.student
            query |= Q(societies__in=student.societies.all()) | Q(events__in=student.attended_events.all())

        # Fetch broadcasts based on the query
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
        Create a new publication request for a news post — no longer requires 'Draft' status.
        If the post is already 'PendingApproval' (or any other), that's okay.
        """
        user = request.user
        if not hasattr(user, "student"):
            return Response(
                {"error": "Only students can submit publication requests"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check 'news_post' param
        news_post_id = request.data.get('news_post')
        if not news_post_id:
            return Response(
                {"error": "News post ID is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Fetch the news post
        try:
            news_post = SocietyNews.objects.get(id=news_post_id)
        except SocietyNews.DoesNotExist:
            return Response(
                {"error": "News post not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        society = news_post.society
        is_author = (news_post.author and news_post.author.id == user.student.id)
        has_permission = is_author or has_society_management_permission(user.student, society)

        if not has_permission:
            return Response(
                {"error": "You do not have permission to publish this news post"},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if there's already a pending request
        existing_request = NewsPublicationRequest.objects.filter(
            news_post=news_post,
            status="Pending"
        ).exists()
        if existing_request:
            return Response(
                {"error": "A publication request for this news post is already pending"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create the new publication request
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
            # For students, return their own requests
            requests = NewsPublicationRequest.objects.filter(
                requested_by=user.student
            ).order_by('-requested_at')
        elif user.is_admin():
            if all_statuses:
                requests = NewsPublicationRequest.objects.all().order_by('-requested_at')
            else:
                requests = NewsPublicationRequest.objects.filter(
                    status="Pending"
                ).order_by('-requested_at')

            # Check if any requests exist at all
            all_requests = NewsPublicationRequest.objects.all()
            for req in all_requests:
                if req:  # Add null check
                    print(f"DEBUG - Request ID: {req.id}, Status: {req.status}, News: {req.news_post.title}")
        else:
            return Response({"error": "Unauthorized"},
                        status=status.HTTP_403_FORBIDDEN)

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
            return Response({"error": "Only admins can view pending publication requests"},
                            status=status.HTTP_403_FORBIDDEN)

        requests_qs = NewsPublicationRequest.objects.filter(status="Pending").order_by('-requested_at')
        serializer = NewsPublicationRequestSerializer(requests_qs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def put(self, request, request_id):
        """Approve or reject a news publication request"""
        if not request.user.is_admin():
            return Response({"error": "Only admins can approve or reject publication requests"},
                            status=status.HTTP_403_FORBIDDEN)

        try:
            publication_request = NewsPublicationRequest.objects.get(id=request_id)
        except NewsPublicationRequest.DoesNotExist:
            return Response({"error": "Publication request not found"},
                            status=status.HTTP_404_NOT_FOUND)

        action = request.data.get('status')
        if action not in ['Approved', 'Rejected']:
            return Response({"error": "Invalid action. Must be 'Approved' or 'Rejected'"},
                            status=status.HTTP_400_BAD_REQUEST)

        # Update the publication request
        publication_request.status = action
        publication_request.reviewed_by = request.user
        publication_request.reviewed_at = timezone.now()
        publication_request.admin_notes = request.data.get('admin_notes', '')

        news_post = publication_request.news_post

        if action == "Approved":
            news_post.status = "Published"
            news_post.published_at = timezone.now()
        else: 
            news_post.status = "Rejected"

        news_post.save()
        publication_request.save()

        # Notify requester
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

class AdminActivityLogView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, log_id=None):
        logs = ActivityLog.objects.all().order_by('-timestamp')
        serializer = ActivityLogSerializer(logs, many=True)
        return Response(serializer.data)
    
    def delete(self, request, log_id):
        user = request.user
        if not (user.role == "admin" or user.is_super_admin):
            return Response({"error": "Only admins can delete activity logs."}, status=status.HTTP_403_FORBIDDEN)
        activity_log = ActivityLog.objects.filter(id=log_id).first()
        if not activity_log:
            return Response({"error": "Activity log not found."}, status=status.HTTP_404_NOT_FOUND)
        activity_log.delete()
        return Response({"message": "Activity log deleted successfully."}, status=status.HTTP_200_OK)

class SearchView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get('q', '').strip()

        if not query:
            return Response({"error": "No search query provided."}, status=400)

        student_results = Student.objects.filter(username__icontains=query)
        student_serializer = StudentSerializer(student_results, many=True, context={'request': request})

        event_results = Event.objects.filter(
            title__icontains=query,
            status="Approved"
        )
        event_serializer = EventSerializer(event_results, many=True, context={'request': request})

        society_results = Society.objects.filter(name__icontains=query)
        society_serializer = SocietySerializer(society_results, many=True, context={'request': request})

        return Response({
            "students": student_serializer.data,
            "events": event_serializer.data,
            "societies": society_serializer.data
        })