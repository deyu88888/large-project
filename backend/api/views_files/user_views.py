from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.authentication import JWTAuthentication
from api.models import Student, User
from api.serializers import StudentSerializer, UserSerializer


def get_user_if_authenticated(request):
    """Returns the current user if their token is still valid"""
    jwt_authenticator = JWTAuthentication()
    decoded_auth = jwt_authenticator.authenticate(request)

    if decoded_auth is None:
        return Response({
            "error": "Invalid or expired token. Please log in again."
        }, status=status.HTTP_401_UNAUTHORIZED)

    user, _ = decoded_auth
    return user


class CreateUserView(generics.CreateAPIView):
    """
    View for creating a new user. This view allows only POST requests for creating a user instance.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


class RegisterView(APIView):
    """APIView for posting a users registration details"""
    permission_classes = [AllowAny]

    def post(self, request):
        """
        Validates registering users details
        """
        email = request.data.get("email")

        if not email:
            return Response({"error": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "This email is already registered."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = StudentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response(
            {"message": "Student registered successfully"},
            status=status.HTTP_201_CREATED
        )


class CurrentUserView(APIView):
    """
    View for retrieving and updating the currently authenticated user.
    """

    def get(self, request):
        """
        Get user details
        """
        try:
            user = get_user_if_authenticated(request)

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
            user = get_user_if_authenticated(request)
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


class MyProfileView(APIView):
    """API view to show Student's Profile"""
    permission_classes = [AllowAny]

    def get(self, request, user_id):
        """
        Get user details
        """
        student = get_object_or_404(Student, id=user_id)
        serializer = StudentSerializer(student, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
