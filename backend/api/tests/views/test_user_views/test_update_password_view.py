from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch
from api.models import User



class UpdatePasswordViewTestCase(TestCase):
    """Tests for the UpdatePasswordView."""

    def setUp(self):
        """Set up test data."""
        
        self.user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="oldpassword123"
        )
        
        # Create API client and authenticate
        self.client = APIClient()
        self.refresh = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {str(self.refresh.access_token)}')
        
        self.url = '/api/users/password'

    @patch('nltk.download', return_value=None)
    def test_update_password_success(self, mock_nltk):
        """Test successful password update."""
        data = {
            'current_password': 'oldpassword123',
            'new_password': 'newpassword456',
            'confirm_password': 'newpassword456'
        }
        
        response = self.client.put(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"message": "Password updated"})
        
        updated_user = User.objects.get(id=self.user.id)
        self.assertTrue(updated_user.check_password('newpassword456'))
        self.assertFalse(updated_user.check_password('oldpassword123'))

    @patch('nltk.download', return_value=None)
    def test_incorrect_current_password(self, mock_nltk):
        """Test that providing incorrect current password returns an error."""
        data = {
            'current_password': 'wrongpassword',
            'new_password': 'newpassword456',
            'confirm_password': 'newpassword456'
        }
        
        response = self.client.put(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {"message": "Current password is not correct"})
        
        updated_user = User.objects.get(id=self.user.id)
        self.assertTrue(updated_user.check_password('oldpassword123'))

    @patch('nltk.download', return_value=None)
    def test_mismatched_passwords(self, mock_nltk):
        """Test that new_password and confirm_password must match."""
        data = {
            'current_password': 'oldpassword123',
            'new_password': 'newpassword456',
            'confirm_password': 'different456'
        }
        
        response = self.client.put(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("non_field_errors", response.data)
        self.assertEqual(response.data["non_field_errors"][0], "New Password and Confirm Password do not match.")
        
        updated_user = User.objects.get(id=self.user.id)
        self.assertTrue(updated_user.check_password('oldpassword123'))

    @patch('nltk.download', return_value=None)
    def test_missing_confirm_password(self, mock_nltk):
        """Test that confirm_password is required."""
        data = {
            'current_password': 'oldpassword123',
            'new_password': 'newpassword456'
        }
        
        response = self.client.put(self.url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('confirm_password', response.data)
        self.assertEqual(response.data['confirm_password'][0], 'This field is required.')
        
        updated_user = User.objects.get(id=self.user.id)
        self.assertTrue(updated_user.check_password('oldpassword123'))

    @patch('nltk.download', return_value=None)
    def test_unauthenticated_request(self, mock_nltk):
        """Test that unauthenticated requests are rejected."""
        self.client.credentials()
        
        data = {
            'current_password': 'oldpassword123',
            'new_password': 'newpassword456',
            'confirm_password': 'newpassword456'
        }
        
        response = self.client.put(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
        updated_user = User.objects.get(id=self.user.id)
        self.assertTrue(updated_user.check_password('oldpassword123'))