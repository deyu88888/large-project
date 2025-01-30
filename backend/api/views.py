from datetime import timezone
from api.models import User, Society, Event, Student, Notification
from rest_framework import generics, status
from .serializers import EventSerializer, RSVPEventSerializer, UserSerializer, StudentSerializer, LeaveSocietySerializer, JoinSocietySerializer, SocietySerializer, NotificationSerializer, DashboardStatisticSerializer, RecentActivitySerializer, EventCalendarSerializer, DashboardNotificationSerializer
from api.models import Admin, User, Society, Event, Student
from rest_framework import generics, status
from .serializers import AdminSerializer, EventSerializer, RSVPEventSerializer, UserSerializer, StudentSerializer, LeaveSocietySerializer, JoinSocietySerializer, SocietySerializer, StartSocietyRequestSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils import timezone
from django.db.models import Count


"""
This function is for the global callout
"""


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
    })


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
    # Otherwise it won't allow anonymous access
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Student registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        serializer = UserSerializer(user)

        if not serializer.data:
            return Response({
                "error": "User data could not be retrieved. Please try again later."
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

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


class MySocietiesView(APIView):
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
        # I am not sure if we need this
        if not hasattr(user, "student"):
            return Response({"error": "Only students can manage societies."}, status=status.HTTP_403_FORBIDDEN)

        societies = user.student.societies.all()
        serializer = SocietySerializer(societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = LeaveSocietySerializer(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            society = serializer.save()
            return Response({"message": f"Successfully left society '{society.name}'."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
        # I am not sure if we need this
        if not hasattr(user, "student"):
            return Response({"error": "Only students can join societies."}, status=status.HTTP_403_FORBIDDEN)

        joined_societies = user.student.societies.all()
        available_societies = Society.objects.exclude(id__in=joined_societies)

        serializer = SocietySerializer(available_societies, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = JoinSocietySerializer(
            data=request.data, context={'request': request})
        if serializer.is_valid():
            society = serializer.save()
            return Response({"message": f"Successfully joined society '{society.name}'."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RSVPEventView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        List events the student is eligible to RSVP for.
        """
        student = request.user.student
        events = Event.objects.filter(
            date__gte=timezone.now().date(),  # Future events only
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

    def patch(self, request, pk=None):
        # Ensure the user is a student
        if not hasattr(request.user, 'student'):
            return Response({"error": "Only students can mark notifications as read."}, status=status.HTTP_403_FORBIDDEN)

        try:
            # Get the specific notification
            notification = Notification.objects.get(
                id=pk, for_student=request.user.student)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update the notification
        serializer = NotificationSerializer(
            notification, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Notification updated successfully."}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
    GET request to get all the society requests that's pending in status for admins
    """
    def get(self, request):
        user = request.user

        # Ensure the user is a admin
        if not hasattr(user, "admin"):
            return Response({"error": "Only admins can view society requests."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society requests
        requests = Society.objects.filter(status='Pending')
        serializer = SocietySerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    # put request to update the status of the society request from pending to approved or rejected for admins
    def put(self, request, society_id):
        user = request.user

        # Ensure the user is a admin
        if not hasattr(user, "admin"):
            return Response({"error": "Only admins can approve or reject society requests."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society request
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society request not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update the society request status
        serializer = SocietySerializer(society, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Society request updated successfully.", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class RejectedSocietyRequestView(APIView):
    """
    get request to get all the societies that's rejected
    """ 
    def get(self, request):
        user = request.user

        # Ensure the user is a admin
        if not hasattr(user, "admin"):
            return Response({"error": "Only admins can view society requests."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society requests
        requests = Society.objects.filter(status='Rejected')
        serializer = SocietySerializer(requests, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


    def put(self, request, society_id):
        """
        PUT request to update the status of the society request from pending to approved or rejected for admins
        """
        user = request.user

        # Ensure the user is a admin
        if not hasattr(user, "admin"):
            return Response({"error": "Only admins can approve or reject society requests."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society request
        society = Society.objects.filter(id=society_id).first()
        if not society:
            return Response({"error": "Society request not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update the society request status
        serializer = SocietySerializer(society, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Society request updated successfully.", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ManageMySocietyView(APIView):
    """
    API View for society presidents to manage their societies.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, society_id):
        user = request.user

        # Ensure the user is a society president
        if not user.is_student() or not user.student.is_president:
            return Response({"error": "Only society presidents can manage their societies."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society
        society = Society.objects.filter(
            id=society_id, leader=user.student).first()
        if not society:
            return Response({"error": "Society not found or you are not the president of this society."}, status=status.HTTP_404_NOT_FOUND)

        # Serialize the society details
        serializer = SocietySerializer(society)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request, society_id):
        user = request.user

        # Ensure the user is a society president
        if not user.is_student() or not user.student.is_president:
            return Response({"error": "Only society presidents can manage their societies."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society
        society = Society.objects.filter(
            id=society_id, leader=user.student).first()
        if not society:
            return Response({"error": "Society not found or you are not the president of this society."}, status=status.HTTP_404_NOT_FOUND)

        # Update the society details
        serializer = SocietySerializer(
            society, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Society details updated successfully.", "data": serializer.data}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CreateSocietyEventView(APIView):
    """
    API View for society presidents to create events for their societies.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, society_id):
        user = request.user

        # Ensure the user is a society president
        if not user.is_student() or not user.student.is_president:
            return Response({"error": "Only society presidents can create events."}, status=status.HTTP_403_FORBIDDEN)

        # Fetch the society
        society = Society.objects.filter(
            id=society_id, leader=user.student).first()
        if not society:
            return Response({"error": "Society not found or you are not the president of this society."}, status=status.HTTP_404_NOT_FOUND)

        # Validate and save the event data
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hosted_by=society)
            return Response({"message": "Event created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        jwt_authenticator = JWTAuthentication()
        decoded_auth = jwt_authenticator.authenticate(request)

        if decoded_auth is None:
            return Response({
                "error": "Invalid or expired token. Please log in again."
            }, status=status.HTTP_401_UNAUTHORIZED)

        user, _ = decoded_auth
        print("request.data: ", request.data)
        serializer = UserSerializer(user, data=request.data, partial=True)

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EventView(APIView):
    """
    event view for admins see  all events
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        """
        List of approved events for the admin.
        """
        events = Event.objects.all()
        serializer = EventSerializer(events, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class AdminView(APIView):
    """
    admin view for admins to view all admins
    """
    permission_classes = [IsAuthenticated]
    queryset = Admin.objects.all()
    serializer_class = AdminSerializer

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


class SocietyView(APIView):
    """
    society view for admins to view all societies
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        """
        get the list of approved societies for the admin.
        """
        # filter the societies that are approved
        society = Society.objects.filter(status='Approved')
        # society = Society.objects.all()
        serializer = SocietySerializer(society, many=True)
        print("serializer data: ", serializer.data)
        return Response(serializer.data, status=status.HTTP_200_OK)

# add a class to review the society requests that's rejected

class StudentView(APIView):
    """
    student view for admins to view all students
    """
    permission_classes = [IsAuthenticated]

    def get(self, request) -> Response:
        """
        get the list of students for the admin.
        """
        # get all students and extend their user information
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
            {"description": "John Doe joined the Chess Society", "timestamp": timezone.now()},
            {"description": "A new event was created: 'AI Workshop'", "timestamp": timezone.now()},
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