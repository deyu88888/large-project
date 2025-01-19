from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from api.models import User, Society, Event
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication
from .serializers import UserSerializer
from .models import Student, User


class CreateUserView(generics.CreateAPIView):
    """
    View for creating a new user. This view allows only POST requests for creating a user instance.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class RegisterView(APIView):
    """
    View for registering a new student user. Handles creating a student user with optional data like department and societies.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

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
            return Response({"error": "All required fields must be provided."}, status=status.HTTP_400_BAD_REQUEST)

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
    View for retrieving the currently authenticated user based on JWT authentication.
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


@login_required
def dashboard_stats(request):
    """
    API endpoint to provide dashboard statistics:
    - Total number of societies
    - Total number of events
    - Pending society approvals
    """
    stats = {
        "total_societies": Society.objects.count(),
        "total_events": Event.objects.count(),
        "pending_approvals": Society.objects.filter(approved_by=None).count(),
    }
    return JsonResponse(stats)


def root_view(request):
    """
    Root API endpoint.
    """
    return JsonResponse({"message": "Welcome to the Universal Student Society API!"})