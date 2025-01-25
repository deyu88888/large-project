from datetime import timezone
from api.models import User, Society, Event, Student, Notification
from rest_framework import generics, status
from .serializers import EventSerializer, RSVPEventSerializer, UserSerializer, StudentSerializer, LeaveSocietySerializer, JoinSocietySerializer, SocietySerializer, NotificationSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication


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
    permission_classes = [AllowAny]  # Otherwise it won't allow anonymous access

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
        serializer = LeaveSocietySerializer(data=request.data, context={'request': request})
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
        serializer = JoinSocietySerializer(data=request.data, context={'request': request})
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
            hosted_by__in=student.societies.all()  # Hosted by societies the student belongs to
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

        serializer = RSVPEventSerializer(instance=event, data={}, context={'request': request, 'action': 'RSVP'})
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

        serializer = RSVPEventSerializer(instance=event, data={}, context={'request': request, 'action': 'CANCEL'})
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
        attended_events = student.attended_events.filter(date__lt=timezone.now().date())
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
            notification = Notification.objects.get(id=pk, for_student=request.user.student)
        except Notification.DoesNotExist:
            return Response({"error": "Notification not found."}, status=status.HTTP_404_NOT_FOUND)

        # Update the notification
        serializer = NotificationSerializer(notification, data=request.data, partial=True)
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
        society = Society.objects.filter(id=society_id, leader=user.student).first()
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
        society = Society.objects.filter(id=society_id, leader=user.student).first()
        if not society:
            return Response({"error": "Society not found or you are not the president of this society."}, status=status.HTTP_404_NOT_FOUND)

        # Update the society details
        serializer = SocietySerializer(society, data=request.data, partial=True)
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
        society = Society.objects.filter(id=society_id, leader=user.student).first()
        if not society:
            return Response({"error": "Society not found or you are not the president of this society."}, status=status.HTTP_404_NOT_FOUND)

        # Validate and save the event data
        serializer = EventSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(hosted_by=society)
            return Response({"message": "Event created successfully.", "data": serializer.data}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class EditSocietyView(APIView):
    """
    View for editing society details by the society's president.
    """
    permission_classes = [IsAuthenticated]

    def patch(self, request, society_id):
        try:
            society = Society.objects.get(id=society_id)
        except Society.DoesNotExist:
            return Response({"error": "Society not found."}, status=status.HTTP_404_NOT_FOUND)

        # Ensure the user is the president of this society
        if not hasattr(request.user, "student") or request.user.student not in society.presidents.all():
            return Response(
                {"error": "You are not authorized to edit this society."},
                status=status.HTTP_403_FORBIDDEN,
            )

        # Update the society details
        serializer = EditSocietySerializer(society, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {"message": "Society details updated successfully.", "data": serializer.data},
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
