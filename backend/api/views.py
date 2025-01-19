from api.models import User
from rest_framework import generics, status
from .serializers import UserSerializer, StudentSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Student, User
from rest_framework.decorators import api_view, permission_classes
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


<<<<<<< HEAD

class RegisterView(APIView):
    permission_classes = [AllowAny]  # Otherwise it won't allow anonymous access

    def post(self, request):
        serializer = StudentSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Student registered successfully."}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def get_current_user(request):
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,  # Include other fields if needed
    })
=======

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
>>>>>>> b8a5dbd7b91dd2bcd5e91aa9a0e357836ebbd66f
