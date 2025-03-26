import json
import time as time_module
from unittest.mock import patch, MagicMock
from datetime import timedelta

from django.utils import timezone
from django.test import TestCase
from rest_framework import status

from api.models import User, Student, Society, Event, ActivityLog
from api.views import StudentRestoreHandler


class TestStudentRestoreHandler(TestCase):
    """Tests for the StudentRestoreHandler class."""

    def setUp(self):
        """Set up test data."""
        
        self.admin = User.objects.create(
            username="testadmin",
            email="admin@example.com",
            role="admin",
            first_name="Test",
            last_name="Admin"
        )
        
        
        self.president = Student.objects.create(
            username="president_student",
            email="president@example.com",
            role="student",
            first_name="President",
            last_name="Student",
            major="Leadership"
        )
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="Test Description",
            approved_by=self.admin,
            president=self.president  
        )
        
        
        self.event = Event.objects.create(
            title="Test Event",
            main_description="Test Description",
            hosted_by=self.society,
            location="Test Location"
        )
        
        
        self.log_entry = ActivityLog.objects.create(
            action_type="Delete",
            target_type="Student",
            target_id=999,
            target_name="Deleted Student",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Test deletion",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({
                "id": 999,
                "username": "deletedstudent",
                "email": "deletedstudent@example.com",
                "first_name": "Deleted",
                "last_name": "Student",
                "role": "student",
                "major": "Computer Science",
                "is_president": False,
                "is_vice_president": False,
                "is_event_manager": False,
                "status": "Approved",
                "societies": [self.society.id],
                "attended_events": [self.event.id],
                "followers": [],
                "following": []
            })
        )
        
        
        self.handler = StudentRestoreHandler()
    
    @patch('api.views.StudentRestoreHandler.handle')
    def test_handle_restore_non_existent_student(self, mock_handle):
        """Test restoring a student that doesn't exist in the database."""
        
        mock_handle.return_value = MagicMock(
            status_code=status.HTTP_200_OK,
            data={"message": "Student restored successfully!"}
        )
        
        original_data = json.loads(self.log_entry.original_data)
        
        
        response = self.handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Student restored successfully!")
    
    @patch('api.views.StudentRestoreHandler.handle')
    def test_handle_restore_existing_student(self, mock_handle):
        """Test restoring a student that already exists."""
        
        mock_handle.return_value = MagicMock(
            status_code=status.HTTP_200_OK,
            data={"message": "Student restored successfully!"}
        )
        
        original_data = json.loads(self.log_entry.original_data)
        
        
        response = self.handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Student restored successfully!")
    
    @patch('api.views.StudentRestoreHandler.handle')
    def test_handle_restore_with_conflicting_username(self, mock_handle):
        """Test restoring a student with a username that already exists."""
        
        mock_handle.return_value = MagicMock(
            status_code=status.HTTP_200_OK,
            data={"message": "Student restored successfully!"}
        )
        
        original_data = json.loads(self.log_entry.original_data)
        
        
        response = self.handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Student restored successfully!")
    
    @patch('api.views.StudentRestoreHandler.handle')
    def test_handle_restore_with_conflicting_email(self, mock_handle):
        """Test restoring a student with an email that already exists."""
        
        mock_handle.return_value = MagicMock(
            status_code=status.HTTP_200_OK,
            data={"message": "Student restored successfully!"}
        )
        
        original_data = json.loads(self.log_entry.original_data)
        
        
        response = self.handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Student restored successfully!")
    
    @patch('api.views.StudentRestoreHandler.handle')
    def test_handle_with_error(self, mock_handle):
        """Test handling errors during restoration."""
        
        mock_handle.return_value = MagicMock(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            data={"error": "Failed to restore Student: Test error"}
        )
        
        invalid_data = {'invalid': 'data'}
        
        
        response = self.handler.handle(invalid_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(invalid_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to restore Student", response.data["error"])
    
    @patch('api.views.StudentRestoreHandler.handle')
    def test_handle_with_relationship_error(self, mock_handle):
        """Test handling errors when setting relationships."""
        
        mock_handle.return_value = MagicMock(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            data={"error": "Failed to restore Student: Error setting relationships"}
        )
        
        original_data = json.loads(self.log_entry.original_data)
        
        
        response = self.handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to restore Student", response.data["error"])