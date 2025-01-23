from django.http import JsonResponse
from django.contrib.auth.decorators import login_required
from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework_simplejwt.authentication import JWTAuthentication
from .serializers import UserSerializer, StudentSerializer
from .models import User, Student, Society, Event


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

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            student = serializer.save()

            # Additional optional fields (department and societies)
            department = request.data.get("department")
            societies = request.data.get("societies")

            if department:
                student.department = department

            if societies:
                student.societies.add(*societies.split(","))

            student.save()
            return Response({"message": "Student registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    """
    API endpoint to retrieve the current authenticated user.
    """
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,  # Include other fields if needed
    })


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