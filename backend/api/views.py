# from datetime import timezone // incorrect import
from django.utils import timezone
from datetime import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.contrib.auth import authenticate
from django.db.models import Count, Sum
from django.utils.timezone import now
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from django.conf import settings
from django.views.static import serve
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.views.decorators.csrf import csrf_exempt
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.models import Admin, AdminReportRequest, Event, Notification, Society, Student, User, Award, AwardStudent, \
    UserRequest, DescriptionRequest, AdminReportRequest, Comment
from api.serializers import (
    AdminReportRequestSerializer,
    AdminSerializer,
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
            # No matching Student row, so just use User
            serializer = UserSerializer(user)

        # Check if serializer.data is falsy, return 500 error.
        if not serializer.data:
            return Response(
                {"error": "User data could not be retrieved. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        return Response(serializer.data, status=status.HTTP_200_OK)


    def put(self, request):
        """
        update user details
        note: this current implmentation is not secure, it should not be able to update the user role
        """
        jwt_authenticator = JWTAuthentication()
        decoded_auth = jwt_authenticator.authenticate(request)

        if decoded_auth is None:
            return Response({
                "error": "Invalid or expired token. Please log in again."
            }, status=status.HTTP_401_UNAUTHORIZED)

        user, _ = decoded_auth
        print("request.data: ", request.data)
        serializer = UserSerializer(user, data=request.data, partial=True)
        # check the user role shouldn't change

        if serializer.is_valid():
            serializer.save()   # save the update
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentSocietiesView(APIView):
    """
    API View for managing societies that a student has joined.

    - **GET**: Retrieves a list of societies the currently logged-in student has joined.
        - Permissions: Requires the user to be authenticated and a student.
        - Response:
            - 200: A list of societies with details such as name and leader.
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
            - 200: A list of available societies with details such as name and leader.
            - 403: If the user is not a student.

    - **POST**: Allows the student to join a new society.
        - Permissions: Requires the user to be authenticated and a student.
        - Request Body:
            - `society_id` (int): ID of the society to join.
        - Response:
            - 200: Confirmation message indicating the student has successfully joined the society.
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

        if not hasattr(user, "student"):
            return Response({"error": "Only students can join societies."}, status=status.HTTP_403_FORBIDDEN)

        if not society_id:
            return Response({"error": "Society ID is required."}, status=status.HTTP_400_BAD_REQUEST)

        serializer = JoinSocietySerializer(data={"society_id": society_id}, context={"request": request})

        if not serializer.is_valid():

            if "Society does not exist." in serializer.errors.get("society_id", []):
                return Response(serializer.errors, status=status.HTTP_404_NOT_FOUND)

            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)  

        society = serializer.save()
        return Response({"message": f"Successfully joined society '{society.name}'."}, status=status.HTTP_200_OK)


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
        # Ensure the user is a student
        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can view notifications."}, status=status.HTTP_403_FORBIDDEN)

        # Get notifications for societies the student has joined
        student = request.user.student
        notifications = Notification.objects.filter(for_student=student)

        serializer = NotificationSerializer(notifications, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, pk):
        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can mark notifications as read."}, status=status.HTTP_403_FORBIDDEN)

        try:
            notification = Notification.objects.get(id=pk, for_student=request.user.student)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        notification.is_read = True  # ✅ Manually update is_read field
        notification.save()  # ✅ Save the notification explicitly

        return Response({"message": "Notification marked as read.", "id": pk}, status=status.HTTP_200_OK)


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

class ManageSocietyDetailsView(APIView):
    """
    API View for society presidents to manage their societies.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        user = request.user

        # Ensure the user is a society president
        try:
            student = Student.objects.get(pk=user.pk)
        except Student.DoesNotExist:
            return Response({"error": "Only society presidents can manage their societies."}, status=status.HTTP_403_FORBIDDEN)
        print("Logged-in student id:", student.id)
        print("Requested society id:", society_id)
        if not student.is_president:
            return Response({"error": "Only society presidents can manage their societies."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society
        society = Society.objects.filter(
            id=society_id).first()
        if not society:
            return Response({"error": "Society not found or you are not the president of this society."}, status=status.HTTP_404_NOT_FOUND)

        # Serialize the society details
        serializer = SocietySerializer(society)
        print("Sending response data:", serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, society_id):
        user = request.user

        # Ensure the user is a society president
        if not user.is_student() or not user.student.is_president:
            return Response({"error": "Only society presidents can manage their societies."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society
        society = Society.objects.filter(
            id=society_id).first()
        if not society:
            return Response({"error": "Society not found or you are not the president of this society."}, status=status.HTTP_404_NOT_FOUND)

        # Update the society details
        serializer = SocietySerializer(
            society, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Society details updated successfully.", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateEventRequestView(APIView):
    """
    API View for society presidents to create events that require admin approval.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, society_id):
        """
        Create a new event request (Pending approval)
        """
        user = request.user

        # Ensure the user is a society president
        if not user.is_student() or not user.student.is_president:
            return Response(
                {"error": "Only society presidents can create events."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Fetch the society
        society = Society.objects.filter(
            id=society_id, leader=user.student
        ).first()

        if not society:
            return Response(
                {"error": "Society not found or you are not the president of this society."},
                status=status.HTTP_404_NOT_FOUND
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

class EventListView(APIView):
    """
    API View to list events based on filters (upcoming, previous, pending).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        society_id = request.query_params.get("society_id")
        filter_type = request.query_params.get("filter")

        if not society_id:
            return Response({"error": "Missing society_id"}, status=400)

        events = Event.objects.filter(hosted_by_id=society_id)

        today = now().date()
        current_time = now().time()

        if filter_type == "upcoming":
            events = events.filter(date__gt=today, status="Approved") | events.filter(date=today, start_time__gt=current_time, status="Approved")
        
        elif filter_type == "previous":
            events = events.filter(date__lt=today, status="Approved") | events.filter(date=today, start_time__lt=current_time, status="Approved")
        
        elif filter_type == "pending":
            print("Pending events xxx", events)
            events = events.filter(status="Pending")

        serializer = EventSerializer(events, many=True)
        return Response(serializer.data)


class PendingMembersView(APIView):
    """
    API View for Society Presidents to manage pending membership requests.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        """
        Retrieve all pending membership requests for a specific society.
        """
        user = request.user

        # Ensure the user is a president
        if not hasattr(user, "student") or not user.student.is_president:
            return Response({"error": "Only society presidents can manage members."}, status=status.HTTP_403_FORBIDDEN)

        # Ensure the president owns this society
        society = Society.objects.filter(id=society_id, leader=user.student).first()
        if not society:
            return Response({"error": "You are not the president of this society."}, status=status.HTTP_403_FORBIDDEN)

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

        # Ensure the user is a president
        if not hasattr(user, "student") or not user.student.is_president:
            return Response({"error": "Only society presidents can manage members."}, status=status.HTTP_403_FORBIDDEN)

        society = Society.objects.filter(id=society_id, leader=user.student).first()
        if not society:
            return Response({"error": "You are not the president of this society."}, status=status.HTTP_403_FORBIDDEN)

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
    # queryset = Admin.objects.all()      # redundant code, remove later
    # serializer_class = AdminSerializer      # redundant code, remove later

    def get(self, request) -> Response:
        """
        get the list of admins for the admin.
        """
        admin = Admin.objects.all()
        serializer = AdminSerializer(admin, many=True)  # serializer ensures its a admin object
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        """
        post request to create a new admin user
        """
        serializer = AdminSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Admin registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StudentView(APIView):
    """
    Student view for admins to view all students.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        """
        Get the list of students for the admin.
        """
        # Get all students and extend their user information
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
        # Example recent activities (can be extended based on project requirements)
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
        # If user's role is not "student", forbid access
        if request.user.role != "student":
            return Response({"error": "Only students can view notifications."}, status=403)

        notifications = Notification.objects.filter(for_student=request.user).order_by("-id")
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
        user = request.user
        if not hasattr(user, "student"):
            return Response(
                {"error": "Only students can view societies."},
                status=status.HTTP_403_FORBIDDEN
            )

        # Manual society access via id
        society = get_object_or_404(Society, id=society_id)
        serializer = SocietySerializer(society)
        return Response(serializer.data, status=status.HTTP_200_OK)


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
    """API to get all comments for a specific event"""
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get(self, request, event_id):

        comments = Comment.objects.filter(event=event_id, parent_comment__isnull=True).order_by("-create_at")
        serializer = CommentSerializer(comments, many=True)
        return Response(serializer.data)

    def post(self, request, event_id):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        event = get_object_or_404(Event, id=event_id)

        serializer = CommentSerializer(data=request.data)
        if serializer.is_valid():
            parent_comment = serializer.validated_data.get("parent_comment")
            comment = serializer.save(
                event=event,
                user=request.user,
                parent_comment=parent_comment
            )

            comment_data = CommentSerializer(comment).data
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"event_{event_id}",
                {
                    "type": "new_comment",
                    "comment_data": comment_data
                }
            )

            return Response(comment_data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

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
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        student = get_object_or_404(Student, id=user_id)
        serializer = StudentSerializer(student, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)