from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from unittest.mock import MagicMock, patch

User = get_user_model()

class CurrentUserViewTestCase(APITestCase):
    def setUp(self):
        """
        Set up a user and token for the test case.
        """
        self.user = User.objects.create_user(
            username="testuser",
            email="testuser@example.com",
            password="testpassword123",
            first_name="Test",
            last_name="User"
        )
        refresh = RefreshToken.for_user(self.user)
        self.access_token = str(refresh.access_token)
        self.current_user_url = "/api/user/current"

    def test_get_current_user_with_valid_token(self):
        """
        Test retrieving the current user with a valid JWT token.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.current_user_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["username"], self.user.username)

    def test_get_current_user_with_invalid_token(self):
        """
        Test retrieving the current user with an invalid JWT token.
        """
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalidtoken")
        response = self.client.get(self.current_user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "Given token not valid for any token type")

    def test_get_current_user_without_token(self):
        """
        Test retrieving the current user without providing a token.
        """
        response = self.client.get(self.current_user_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    @patch("api.views.UserSerializer")
    def test_get_current_user_with_serializer_error(self, MockUserSerializer):
        """
        Test scenario where the user serializer does not return valid data.
        """
        mock_serializer = MagicMock()
        mock_serializer.data = None
        MockUserSerializer.return_value = mock_serializer
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.current_user_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "User data could not be retrieved. Please try again later.")