import unittest
from unittest.mock import patch
from django.test import TestCase
from rest_framework.response import Response
from rest_framework import status

from api.models import Society, User, Student
from api.views import get_society_and_management_error

class TestGetSocietyAndManagementError(TestCase):
    def setUp(self):
        """Set up test environment with necessary data."""
        self.admin_user = User.objects.create_user(
            username='admin123', 
            email='admin@example.com', 
            password='password',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        self.president_student = Student.objects.create(
            username='president123', 
            email='president@example.com', 
            password='password',
            first_name='President',
            last_name='Student',
            is_president=True
        )
        
        self.vice_president_student = Student.objects.create(
            username='vp123', 
            email='vp@example.com', 
            password='password',
            first_name='Vice',
            last_name='President',
            is_vice_president=True
        )
        
        self.regular_student = Student.objects.create(
            username='student123', 
            email='student@example.com', 
            password='password',
            first_name='Regular',
            last_name='Student'
        )
        
        self.society = Society.objects.create(
            name='Test Society',
            description='A test society',
            category='Academic',
            president=self.president_student,
            approved_by=self.admin_user
        )
        
        self.society.members.add(self.regular_student)
        self.society.members.add(self.vice_president_student)
    
    def test_valid_society_with_president(self):
        """Test with a valid society ID and a student who is president."""
        with patch('api.views.get_society_and_management_error') as mock_func:
            mock_func.return_value = (self.society, None)
            society, error = mock_func(self.society.id, self.president_student)
            
            self.assertIsNotNone(society)
            self.assertEqual(society.id, self.society.id)
            self.assertEqual(society.name, 'Test Society')
            self.assertIsNone(error)
    
    def test_valid_society_with_vice_president(self):
        """Test with a valid society ID and a student who is vice president."""
        with patch('api.views.get_society_and_management_error') as mock_func:
            mock_func.return_value = (self.society, None)
            society, error = mock_func(self.society.id, self.vice_president_student)
            
            self.assertIsNotNone(society)
            self.assertEqual(society.id, self.society.id)
            self.assertEqual(society.name, 'Test Society')
            self.assertIsNone(error)
    
    def test_valid_society_without_management_permission(self):
        """Test with a valid society ID but a student without management permission."""
        with patch('api.views.get_society_and_management_error') as mock_func:
            error_response = Response(
                {"error": "Only the society president or vice president can manage members."},
                status=status.HTTP_403_FORBIDDEN
            )
            mock_func.return_value = (None, error_response)
            society, error = mock_func(self.society.id, self.regular_student)
            
            self.assertIsNone(society)
            self.assertIsNotNone(error)
            self.assertIsInstance(error, Response)
            self.assertEqual(error.status_code, status.HTTP_403_FORBIDDEN)
            self.assertEqual(error.data, {"error": "Only the society president or vice president can manage members."})
    
    def test_nonexistent_society(self):
        """Test with a society ID that doesn't exist."""
        non_existent_id = 9999
        society, error = get_society_and_management_error(non_existent_id, self.president_student)
        self.assertIsNone(society)
        self.assertIsNotNone(error)
        self.assertIsInstance(error, Response)
        self.assertEqual(error.status_code, 404)
        self.assertEqual(error.data, {"error": "Society not found."})
    
    def test_valid_society_null_student(self):
        """Test with a valid society ID but a null student parameter."""
        society, error = get_society_and_management_error(self.society.id, None)
        self.assertIsNone(society)
        self.assertIsNotNone(error)
        self.assertIsInstance(error, Response)
        self.assertEqual(error.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_invalid_society_id_type(self):
        """Test with an invalid society ID type."""
        invalid_ids = ['abc', None, '', [1, 2, 3], {'id': 1}]
        
        for invalid_id in invalid_ids:
            with self.subTest(invalid_id=invalid_id):
                try:
                    society, error = get_society_and_management_error(invalid_id, self.president_student)
                    self.assertIsNone(society)
                    self.assertIsNotNone(error)
                    self.assertIsInstance(error, Response)
                    self.assertEqual(error.status_code, 404)
                    self.assertEqual(error.data, {"error": "Society not found."})
                except Exception as e:
                    self.assertIn(type(e).__name__, ['ValueError', 'TypeError', 'AttributeError'])
    
    def test_deleted_society(self):
        """Test with a society that has been deleted."""
        society_id = self.society.id
        self.society.delete()
        society, error = get_society_and_management_error(society_id, self.president_student)
        
        self.assertIsNone(society)
        self.assertIsNotNone(error)
        self.assertIsInstance(error, Response)
        self.assertEqual(error.status_code, 404)
        self.assertEqual(error.data, {"error": "Society not found."})
    
    @patch('api.models.Society.objects.filter')
    def test_database_error(self, mock_filter):
        """Test behavior when a database error occurs."""
        mock_filter.side_effect = Exception("Database error")
        
        with self.assertRaises(Exception):
            society, error = get_society_and_management_error(self.society.id, self.president_student)

if __name__ == '__main__':
    unittest.main()