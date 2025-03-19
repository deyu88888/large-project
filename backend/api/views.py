import logging
from django.utils import timezone
from datetime import datetime, timezone
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
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser, BasePermission
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.models import  AdminReportRequest, BroadcastMessage, Event, Notification, Society, SocietyRequest, Student, User, Award, AwardStudent, \
    UserRequest, DescriptionRequest, AdminReportRequest, Comment
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
    DescriptionRequestSerializer, CommentSerializer,
)
from api.utils import *
from django.db.models import Q


class CreateUserView(generics.CreateAPIView):
    """
    View for creating a new user. This view allows only POST requests for creating a user instance.

    - **POST**: Creates a new user from the provided data. Expects the following fields in the request body:
        - first_name
        - last_name
        - email
        - username
        - password

    Permissions:
        - Open to all users (AllowAny).

    This view uses the `UserSerializer` to validate the input data and save the new user to the database.
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
            print(serializer.errors)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response({"message": "Student registered successfully"}, status=status.HTTP_201_CREATED)


import traceback
import sys

class CurrentUserView(APIView):
    """
    View for retrieving the currently authenticated user. This view provides information about the logged-in user
    based on the provided JWT authentication token.

    - **GET**: Retrieves the details of the currently authenticated user. Expects an authorization token in the request
    header as 'Authorization: Bearer <token>'.

    Returns the user data using the `UserSerializer` if a valid token is provided. If the token is missing or invalid,
    an error message is returned.

    Permissions:
        - Requires a valid JWT token to access (authentication via JWT).
    """

    def get(self, request):
        try:
            print("\n" + "="*80)
            print(f"DEBUG - CurrentUserView - User ID: {request.user.id}")
            print(f"DEBUG - CurrentUserView - Username: {request.user.username}")
            print(f"DEBUG - CurrentUserView - User type: {type(request.user).__name__}")
            
            jwt_authenticator = JWTAuthentication()
            print(f"DEBUG - About to authenticate with JWT")
            decoded_auth = jwt_authenticator.authenticate(request)
            print(f"DEBUG - JWT authentication result: {decoded_auth is not None}")

            if decoded_auth is None:
                print(f"DEBUG - JWT authentication failed")
                return Response({
                    "error": "Invalid or expired token. Please log in again."
                }, status=status.HTTP_401_UNAUTHORIZED)

            user, _ = decoded_auth
            print(f"DEBUG - Authenticated user ID: {user.id}")
            print(f"DEBUG - Authenticated username: {user.username}")
            
            try:
                print(f"DEBUG - Trying to get Student with pk={user.pk}")
                student_user = Student.objects.get(pk=user.pk)
                print(f"DEBUG - Found student: {student_user.username}")
                print(f"DEBUG - Student fields: {dir(student_user)}")
                print(f"DEBUG - Is president: {getattr(student_user, 'is_president', None)}")
                print(f"DEBUG - Is vice president: {getattr(student_user, 'is_vice_president', None)}")
                
                # Check for president relationship
                if hasattr(student_user, 'president_of'):
                    print(f"DEBUG - President of society: {getattr(student_user.president_of, 'id', None) if student_user.president_of else None}")
                else:
                    print(f"DEBUG - No president_of attribute")
                
                # Check for vice president relationship
                try:
                    vp_societies = getattr(student_user, 'vice_president_of_society', None)
                    print(f"DEBUG - VP society type: {type(vp_societies).__name__}")
                    print(f"DEBUG - VP society: {vp_societies}")
                except Exception as e:
                    print(f"DEBUG - Error getting vice_president_of_society: {str(e)}")
                
                # Create serializer
                print(f"DEBUG - Creating StudentSerializer")
                serializer = StudentSerializer(student_user)
                print(f"DEBUG - StudentSerializer created")
            except Student.DoesNotExist:
                # No matching Student row, so just use User
                print(f"DEBUG - No Student found, using UserSerializer instead")
                serializer = UserSerializer(user)
            except Exception as e:
                print(f"DEBUG - Unexpected error handling student: {str(e)}")
                print(traceback.format_exc())
                # Fallback to UserSerializer
                serializer = UserSerializer(user)

            # Check if serializer.data exists
            print(f"DEBUG - About to access serializer.data")
            if not serializer.data:
                print(f"DEBUG - serializer.data is empty or None")
                return Response(
                    {"error": "User data could not be retrieved. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            print(f"DEBUG - Serializer data keys: {serializer.data.keys()}")
            print(f"DEBUG - Response data: {serializer.data}")
            return Response(serializer.data, status=status.HTTP_200_OK)
            
        except Exception as e:
            # Print detailed error information
            print("\nCRITICAL ERROR IN CURRENT USER VIEW:")
            print("-"*80)
            print(f"Exception: {str(e)}")
            print("-"*80)
            traceback.print_exc(file=sys.stdout)
            print("="*80)
            
            # Return a proper error response
            return Response(
                {"error": "Server error fetching user data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def put(self, request):
        """
        update user details
        note: this current implmentation is not secure, it should not be able to update the user role
        """
        try:
            print(f"DEBUG - PUT request to CurrentUserView")
            jwt_authenticator = JWTAuthentication()
            decoded_auth = jwt_authenticator.authenticate(request)

            if decoded_auth is None:
                print(f"DEBUG - JWT authentication failed in PUT")
                return Response({
                    "error": "Invalid or expired token. Please log in again."
                }, status=status.HTTP_401_UNAUTHORIZED)

            user, _ = decoded_auth
            print(f"DEBUG - PUT request data: {request.data}")
            serializer = UserSerializer(user, data=request.data, partial=True)
            
            if serializer.is_valid():
                print(f"DEBUG - Serializer is valid, saving changes")
                serializer.save()   # save the update
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                print(f"DEBUG - Serializer validation errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"DEBUG - Error in PUT method: {str(e)}")
            print(traceback.format_exc())
            return Response(
                {"error": "Server error updating user data", "detail": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class StudentSocietiesView(APIView):
    """
    API View for managing societies that a student has joined.

    - **GET**: Retrieves a list of societies the currently logged-in student has joined.
        - Permissions: Requires the user to be authenticated and a student.
        - Response:
            - 200: A list of societies with details such as name and president.
            - 403: If the user is not a student.

    - **POST**: Allows the student to leave a society they are part of.
        - Permissions: Requires the user to be authenticated and a student.
        - Request Body:
            - `society_id` (int): ID of the society to leave.
        - Response:
            - 200: Confirmation message indicating the student has successfully left the society.
            - 400: Validation errors, such as invalid society ID.
            - 403: If the user is not a student.
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

        # Remove the student from the society
        user.student.societies_belongs_to.remove(society)

        return Response({"message": f"Successfully left society '{society.name}'."}, status=status.HTTP_200_OK)


class JoinSocietyView(APIView):
    """
    API View for managing the joining of new societies by a student.
    - **GET**: Retrieves a list of societies the currently logged-in student has NOT joined.
        - Permissions: Requires the user to be authenticated and a student.
        - Response:
            - 200: A list of available societies with details such as name and president.
            - 403: If the user is not a student.

    - **POST**: Creates a request for president approval to join a society.
        - Permissions: Requires the user to be authenticated and a student.
        - Request Body:
            - `society_id` (int): ID of the society to join.
        - Response:
            - 201: Confirmation message indicating the join request has been submitted.
            - 400: Validation errors, such as invalid society ID.
            - 403: If the user is not a student.
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
        # Debugging prints:
        print("DEBUG: User:", user, "User ID:", user.id)
        print("DEBUG: society_id:", society_id)

        if not hasattr(user, "student"):
            print("DEBUG: User is not a student.")
            return Response({"error": "Only students can join societies."}, status=status.HTTP_403_FORBIDDEN)

        if not society_id:
            print("DEBUG: No society_id provided in URL.")
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
        
class PendingRequestsView(APIView):
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


class StudentInboxView(StudentNotificationsView):
    """
    View to retrieve and update important notifications for a student.
    """
    def get(self, request):
        user = request.user
        notifications = Notification.objects.filter(for_user=user, is_important=True)
        notifications = [n for n in notifications if n.is_sent()]
        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StartSocietyRequestView(APIView):
    """View to handle society creation requests."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        user = request.user

        # Ensure the user is a student
        if not hasattr(user, "student"):
            return Response({"error": "Only students can request a new society."}, status=status.HTTP_403_FORBIDDEN)

        # Validate and save the data
        serializer = StartSocietyRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(requested_by=user.student)
            return Response(
                {"message": "Your request has been submitted for review."},
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class SocietyRequestView(APIView):
    """
    GET request to get all the society requests that are pending in status for admins.
    """
    def get(self, request, society_status):
        user = request.user

        # Ensure the user is an admin
        if not hasattr(user, "admin"):
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
        print("society_id", society_id, type(society_id))
        # Ensure the user is an admin
        if not hasattr(user, "admin"):
            return Response(
                {"error": "Only admins can approve or reject society requests."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch the society request using manual lookup
        society = Society.objects.filter(id=society_id).first()
        print("society xxx ", society)
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
    
    Args:
        student: The Student instance to check
        society: The Society instance to check against
        for_events_only: If True, includes event managers in the permission check
        
    Returns:
        bool: True if the student has management permissions, False otherwise
    """
    # Check if student is president (leader)
    is_president = student.is_president and hasattr(society, 'leader') and society.leader and society.leader.id == student.id
    
    # Check if student is vice president
    is_vice_president = hasattr(society, 'vice_president') and society.vice_president and society.vice_president.id == student.id
    
    # If this is specifically for event operations, also check if student is the event manager
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

        # Ensure the user is a student
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "Only society presidents and vice presidents can manage their societies."}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        print("Logged-in student id:", student.id)
        print("Requested society id:", society_id)
        
        # Fetch the society
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)
            
        # Check for management permissions using utility function
        if not has_society_management_permission(student, society):
            return Response({"error": "Only the society president or vice president can manage this society."}, 
                           status=status.HTTP_403_FORBIDDEN)

        # Serialize the society details
        serializer = SocietySerializer(society)
        print("Sending response data:", serializer.data)
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
            
        # Check for management permissions using utility function
        if not has_society_management_permission(user.student, society):
            return Response(
                {"error": "Only the society president or vice president can manage this society."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Pass the request context so the serializer can access the current user.
        serializer = SocietyRequestSerializer(data=request.data, context={"request": request}, partial=True)
        if serializer.is_valid():
            # Pass the society instance explicitly to the serializer's save() method.
            society_request = serializer.save(society=society)
            return Response(
                {
                    "message": "Society update request submitted. Await admin approval.",
                    "request_id": society_request.id,
                },
                status=status.HTTP_200_OK,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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


class EventDetailView(APIView):
    """API View to get details of an event"""
    permission_classes = [AllowAny]

    def get(self, request, event_id):
        event = get_object_or_404(Event, id=event_id, status="Approved")
        serializer = EventSerializer(event)
        return Response(serializer.data, status=status.HTTP_200_OK)


logger = logging.getLogger(__name__)


class EventListView(APIView):
    """
    Lists events for all societies the currently logged-in student is part of.
    Optionally applies a filter (upcoming, previous, pending).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        filter_type = request.query_params.get("filter", "upcoming")

        # Ensure the user is a student
        if not hasattr(request.user, "student"):
            logger.warning("User is not a student.")
            return Response({"error": "Only students can retrieve society events."}, status=403)

        # Gather all society IDs the student is in
        societies = request.user.student.societies_belongs_to.all()
        society_ids = [s.id for s in societies]

        # If the user belongs to no societies, return an empty list
        if not society_ids:
            logger.info("User is not part of any society. Returning empty list.")
            return Response([], status=200)

        # Fetch events for these societies only
        events = Event.objects.filter(hosted_by__in=society_ids)

        # If you want to do time-based filtering:
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
        # else: no filter → returns all events from these societies

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=200)


class ManageEventDetailsView(APIView):
    """
    API View for society presidents and vice presidents to edit or delete events.
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

        # Combine the event's date and start_time.
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
        # Ensure the user is a valid student
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

        # Prepare data for the update request.
        data = request.data.copy()
        data.setdefault("title", event.title)
        data.setdefault("description", event.description)
        data.setdefault("location", event.location)
        data.setdefault("date", event.date)
        data.setdefault("start_time", event.start_time)
        data.setdefault("duration", event.duration)

        # Instantiate the serializer.
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
        # Ensure the user is a valid student
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

        action = request.data.get("action")  # "approve" or "reject"

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


class EventView(APIView):
    """
    Event view to show upcoming approved events.
    """

    def get(self, request, event_status) -> Response:
        """
        Returns a list of upcoming approved events sorted by date and time.
        """
        event_status = event_status.capitalize()
        print("event_status: ", event_status)
        events = Event.objects.filter(status=event_status).order_by("date", "start_time")
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    

class EventRequestView(APIView):
    """
    Event view to show upcoming approved events.
    """

    def put(self, request, event_id):
        """
        PUT request to update the status of the event request from pending to approved or rejected for admins
        """
        user = request.user

        if not hasattr(user, "admin"):
            return Response({"error": "Only admins can approve or reject event requests."}, status=status.HTTP_403_FORBIDDEN)

        event = Event.objects.filter(id=event_id).first()
        print("event xxx: ", event)
        if not event:
            return Response({"error": "Event request not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = EventSerializer(event, data=request.data, partial=True)
        print("serializer sss: ", serializer)
        if serializer.is_valid():
            serializer.save()

        channel_layer = get_channel_layer()

        print("serializer.validated_data.get('status'): ", serializer.validated_data.get("status")) # working
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


class AdminView(APIView):
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


class StudentView(APIView):
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


class MySocietiesView(APIView):
    pass


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


class AdminReportView(APIView):
    """
    API view for students and society presidents to submit reports to admins.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = AdminReportRequestSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(from_student=request.user.student)  #  Auto-assign the reporter
            return Response({"message": "Report submitted successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def get(self, request):
        reports = AdminReportRequest.objects.all().order_by("-requested_at")

        serializer = AdminReportRequestSerializer(reports, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class StudentSocietyDataView(APIView):
    """
    API View to inspect a specific society.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        # Manual society access via id
        society = get_object_or_404(Society, id=society_id)
        serializer = SocietySerializer(society)

        # Return extra data indicating membership
        serializer_data = serializer.data
        is_member = society.society_members.filter(
            id=request.user.student.id
        ).exists()
        if is_member:
            serializer_data["is_member"] = 2
        else:
            request_exists = SocietyRequest.objects.filter(
                society=society,
                from_student=request.user.student,
                intent="JoinSoc"
            ).exists()
            if request_exists:
                serializer_data["is_member"] = 1
            else:
                serializer_data["is_member"] = 0

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


class DescriptionRequestView(APIView):
    """
    Description request view for admins to approve/reject descriptions
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all pending description requests (Admins only)."""
        user = request.user

        if not hasattr(user, "admin"):
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

        # ensure the user is an admin
        if not hasattr(user, "admin"):
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


class StudentProfileView(APIView):
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

        # Debugging prints
        print(f"Received societies: {societies}")  
        print(f"Received events: {events}")  
        print(f"Total Student Users: {User.objects.filter(student__isnull=False).count()}")  

        if not message:
            return Response({"error": "Message content is required."}, status=status.HTTP_400_BAD_REQUEST)

        if 'all' in data.get('target', []):
            print("Sending to all users")
            recipients.update(User.objects.all())
        else:
            print("Filtering recipients based on societies and events")

            if societies:
                society_members = User.objects.filter(
                    student__isnull=False,  # Ensure the user has a student profile
                    student__societies__in=Society.objects.filter(id__in=societies)
                ).distinct()
                print(f"Society Members: {list(society_members.values('id', 'username'))}")
                recipients.update(society_members)

            if events:
                event_attendees = User.objects.filter(
                    student__isnull=False,  # Ensure the user has a student profile
                    student__attended_events__in=Event.objects.filter(id__in=events)
                ).distinct()
                print(f"Event Attendees: {list(event_attendees.values('id', 'username'))}")
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