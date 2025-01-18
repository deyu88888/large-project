from api.models import User
from rest_framework import generics, status
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Student, User
from rest_framework_simplejwt.authentication import JWTAuthentication


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
    """
    View for registering a new student user. This view handles creating a student user and accepting optional data
    about department and societies.

    - **POST**: Registers a student user with required data:
        - first_name
        - last_name
        - email
        - username
        - password
        - major

      Optional data:
        - department (if any)
        - societies (comma-separated list of societies)

    Returns appropriate error messages for missing required fields or duplicate emails and usernames.

    Permissions:
        - Open to all users (AllowAny).

    This view processes the provided data, creates the student user, and saves it to the database, including optional
    information such as department and societies.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        first_name = request.data.get("first_name")
        last_name = request.data.get("last_name")
        email = request.data.get("email")
        username = request.data.get("username")
        password = request.data.get("password")
        major = request.data.get("major")
        department = request.data.get("department")  # Optional
        societies = request.data.get("societies")  # Optional

        if not email or not username or not password or not major or not first_name or not last_name:
            return Response({"error": "Username, password, and major are required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({"error": "Email already exists."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        # Create the student user
        student = Student.objects.create_user(
            first_name=first_name,
            last_name=last_name,
            email=email,
            username=username,
            password=password,
            major=major,
        )

        # Add optional advisor-related fields if provided
        if department:
            student.department = department
        if societies:
            student.societies.add(*societies.split(","))

        student.save()
        return Response({"message": "Student registered successfully."}, status=status.HTTP_201_CREATED)


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
            }, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.data, status=status.HTTP_200_OK)
