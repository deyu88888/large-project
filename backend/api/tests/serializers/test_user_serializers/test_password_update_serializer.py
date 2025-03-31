from django.test import TestCase
from api.serializers import PasswordUpdateSerializer
from unittest.mock import patch


class PasswordUpdateSerializerTest(TestCase):
    """Test suite for the PasswordUpdateSerializer."""

    def setUp(self):
        self.valid_data = {
            'current_password': 'currentPassword123',
            'new_password': 'newStrongPassword123!',
            'confirm_password': 'newStrongPassword123!'
        }

    @patch('nltk.download', return_value=None)
    def test_valid_data(self, mock_nltk):
        """Test serializer with valid data."""
        serializer = PasswordUpdateSerializer(data=self.valid_data)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(set(serializer.validated_data.keys()), 
                         {'current_password', 'new_password', 'confirm_password'})

    @patch('nltk.download', return_value=None)
    def test_all_fields_required(self, mock_nltk):
        """Test that all fields are required."""
        # Test missing current_password
        invalid_data = {
            'new_password': 'newStrongPassword123!',
            'confirm_password': 'newStrongPassword123!'
        }
        serializer = PasswordUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('current_password', serializer.errors)
        self.assertEqual(serializer.errors['current_password'][0], 'This field is required.')

        # Test missing new_password
        invalid_data = {
            'current_password': 'currentPassword123',
            'confirm_password': 'newStrongPassword123!'
        }
        serializer = PasswordUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)
        self.assertEqual(serializer.errors['new_password'][0], 'This field is required.')

        # Test missing confirm_password
        invalid_data = {
            'current_password': 'currentPassword123',
            'new_password': 'newStrongPassword123!'
        }
        serializer = PasswordUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('confirm_password', serializer.errors)
        self.assertEqual(serializer.errors['confirm_password'][0], 'This field is required.')

    @patch('nltk.download', return_value=None)
    def test_passwords_must_match(self, mock_nltk):
        """Test that new_password and confirm_password must match."""
        invalid_data = {
            'current_password': 'currentPassword123',
            'new_password': 'newStrongPassword123!',
            'confirm_password': 'differentPassword123!'
        }
        serializer = PasswordUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('non_field_errors', serializer.errors)
        self.assertEqual(serializer.errors['non_field_errors'][0], 
                         'New Password and Confirm Password do not match.')

    @patch('nltk.download', return_value=None)
    def test_password_validation(self, mock_nltk):
        """Test password validators are applied to new_password."""
        invalid_data = {
            'current_password': 'currentPassword123',
            'new_password': 'weak',
            'confirm_password': 'weak'
        }
        serializer = PasswordUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)
        error_message = str(serializer.errors['new_password'][0])
        self.assertTrue(
            "too short" in error_message or 
            "too common" in error_message or 
            "entirely numeric" in error_message or
            "too weak" in error_message
        )

    @patch('nltk.download', return_value=None)
    def test_password_validation_with_common_passwords(self, mock_nltk):
        """Test that common passwords are rejected."""
        common_passwords = ['password', '123456', 'qwerty', 'admin']
        
        for password in common_passwords:
            invalid_data = {
                'current_password': 'currentPassword123',
                'new_password': password,
                'confirm_password': password
            }
            serializer = PasswordUpdateSerializer(data=invalid_data)
            if serializer.is_valid():
                self.fail(f"Validation should have rejected the common password: {password}")
            else:
                has_error = 'new_password' in serializer.errors or 'non_field_errors' in serializer.errors
                self.assertTrue(has_error, f"No validation error for common password: {password}")

    @patch('nltk.download', return_value=None)
    def test_empty_fields(self, mock_nltk):
        """Test that empty fields are rejected."""
        invalid_data = {
            'current_password': '',
            'new_password': 'newStrongPassword123!',
            'confirm_password': 'newStrongPassword123!'
        }
        serializer = PasswordUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('current_password', serializer.errors)
        
        invalid_data = {
            'current_password': 'currentPassword123',
            'new_password': '',
            'confirm_password': ''
        }
        serializer = PasswordUpdateSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('new_password', serializer.errors)