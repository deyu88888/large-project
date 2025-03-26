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
        self.current_user_url = "/api/user/current/"

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

    @patch("api.views_files.user_views.UserSerializer")
    def test_get_current_user_with_serializer_error(self, MockUserSerializer):
        """
        Test scenario where the user serializer does not return valid data.
        """
        mock_serializer = MagicMock()
        mock_serializer.data = None
        MockUserSerializer.return_value = mock_serializer
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        response = self.client.get(self.current_user_url)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR, (response, response.data))
        self.assertIn("error", response.data)
        self.assertEqual(response.data["error"], "User data could not be retrieved. Please try again later.")

    def test_put_update_current_user(self):
        """
        Test updating the current user details.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        update_data = {"first_name": "UpdatedName"}
        response = self.client.put(self.current_user_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["first_name"], "UpdatedName")
        
    def test_put_without_token(self):
        """
        Test that a PUT request without a token returns 401 Unauthorized.
        """
        update_data = {"first_name": "NoToken"}
        response = self.client.put(self.current_user_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "Authentication credentials were not provided.")

    def test_put_with_invalid_token(self):
        """
        Test that a PUT request with an invalid token returns 401 Unauthorized.
        """
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalidtoken")
        update_data = {"first_name": "InvalidToken"}
        response = self.client.put(self.current_user_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)
        self.assertEqual(response.data["detail"], "Given token not valid for any token type")

    def test_put_invalid_data(self):
        """
        Test that a PUT request with invalid data returns 400 Bad Request.
        For example, if you try to update the email with an invalid format.
        """
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access_token}")
        update_data = {"email": "not-an-email"}
        response = self.client.put(self.current_user_url, update_data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)