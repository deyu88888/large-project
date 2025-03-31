from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch
from api.models import User
from api.views import get_user_if_authenticated


class GetUserIfAuthenticatedTestCase(TestCase):
    """Tests for the get_user_if_authenticated function."""

    def setUp(self):
        """Set up test data."""
        self.factory = APIRequestFactory()
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="password123"
        )
        self.refresh = RefreshToken.for_user(self.user)
        self.valid_token = str(self.refresh.access_token)

    def test_valid_token_returns_user(self):
        """Test that a valid token returns the correct user."""
        request = self.factory.get('/test-path/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.valid_token}'

        with patch.object(JWTAuthentication, 'authenticate', return_value=(self.user, self.valid_token)):
            result = get_user_if_authenticated(request)

            self.assertEqual(result, self.user)

    def test_missing_token_returns_401(self):
        """Test that a request without a token returns a 401 response."""
        request = self.factory.get('/test-path/')

        with patch.object(JWTAuthentication, 'authenticate', return_value=None):
            result = get_user_if_authenticated(request)

            self.assertEqual(result.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertEqual(result.data, {
                "error": "Invalid or expired token. Please log in again."
            })

    def test_invalid_token_returns_401(self):
        """Test that an invalid token returns a 401 response."""
        request = self.factory.get('/test-path/')
        request.META['HTTP_AUTHORIZATION'] = 'Bearer invalid_token'

        with patch.object(JWTAuthentication, 'authenticate', return_value=None):
            result = get_user_if_authenticated(request)

            self.assertEqual(result.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertEqual(result.data, {
                "error": "Invalid or expired token. Please log in again."
            })

    def test_expired_token_returns_401(self):
        """Test that an expired token returns a 401 response."""
        request = self.factory.get('/test-path/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.valid_token}'

        with patch.object(JWTAuthentication, 'authenticate', return_value=None):
            result = get_user_if_authenticated(request)

            self.assertEqual(result.status_code, status.HTTP_401_UNAUTHORIZED)
            self.assertEqual(result.data, {
                "error": "Invalid or expired token. Please log in again."
            })

    def test_authenticate_raising_exception(self):
        """Test handling when JWT authenticate raises an exception."""
        request = self.factory.get('/test-path/')
        request.META['HTTP_AUTHORIZATION'] = f'Bearer {self.valid_token}'
        try:
            with patch.object(JWTAuthentication, 'authenticate', side_effect=Exception("Authentication error")):
                result = get_user_if_authenticated(request)
                
                self.fail("Function did not raise exception as expected")
        except Exception as e:
            self.assertEqual(str(e), "Authentication error")