import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.response import Response

from api.models import User, Student, Society, Event, ActivityLog


class TestEventRestoreHandler(TestCase):
    """Tests for the EventRestoreHandler class."""

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
        
        
        self.log_entry = ActivityLog.objects.create(
            action_type="Delete",
            target_type="Event",
            target_id=888,
            target_name="Deleted Event",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Test deletion",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({
                "id": 888,
                "title": "Deleted Event",
                "main_description": "This is a test event that was deleted",
                "date": "2025-04-15",
                "start_time": "14:30:00",
                "duration": "0:02:00:00",
                "location": "Test Location",
                "max_capacity": 100,
                "hosted_by": self.society.id,
                "status": "Approved",
                "cover_image": "default-event/event.jpeg",
                "current_attendees": []
            })
        )
    
    @patch('api.views.EventRestoreHandler.handle')    
    def test_basic_restoration(self, mock_handle):
        """Test basic event restoration."""
        from api.views import EventRestoreHandler
        
        
        mock_handle.return_value = Response(
            {"message": "Event restored successfully!"}, 
            status=status.HTTP_200_OK
        )
        
        
        handler = EventRestoreHandler()
        
        
        original_data = json.loads(self.log_entry.original_data)
        response = handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Event restored successfully!")
    
    @patch('api.views.EventRestoreHandler.handle')    
    def test_with_complex_date(self, mock_handle):
        """Test with complex date format."""
        from api.views import EventRestoreHandler
        
        
        mock_handle.return_value = Response(
            {"message": "Event restored successfully!"}, 
            status=status.HTTP_200_OK
        )
        
        
        handler = EventRestoreHandler()
        
        
        original_data = json.loads(self.log_entry.original_data)
        original_data["date"] = "2025-04-15T14:30:00Z"
        
        
        response = handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Event restored successfully!")
    
    @patch('api.views.EventRestoreHandler.handle')    
    def test_with_attendees(self, mock_handle):
        """Test with attendees."""
        from api.views import EventRestoreHandler
        
        
        mock_handle.return_value = Response(
            {"message": "Event restored successfully!"}, 
            status=status.HTTP_200_OK
        )
        
        
        student1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            role="student",
            first_name="Student",
            last_name="One"
        )
        student2 = Student.objects.create(
            username="student2",
            email="student2@example.com",
            role="student",
            first_name="Student",
            last_name="Two"
        )
        
        
        handler = EventRestoreHandler()
        
        
        original_data = json.loads(self.log_entry.original_data)
        original_data["current_attendees"] = [student1.id, student2.id]
        
        
        response = handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Event restored successfully!")
    
    @patch('api.views.EventRestoreHandler.handle')    
    def test_with_complex_duration(self, mock_handle):
        """Test with complex duration format."""
        from api.views import EventRestoreHandler
        
        
        mock_handle.return_value = Response(
            {"message": "Event restored successfully!"}, 
            status=status.HTTP_200_OK
        )
        
        
        handler = EventRestoreHandler()
        
        
        original_data = json.loads(self.log_entry.original_data)
        original_data["duration"] = "2 days, 3:45:30"
        
        
        response = handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Event restored successfully!")
    
    @patch('api.views.EventRestoreHandler.handle')    
    def test_with_simple_duration(self, mock_handle):
        """Test with simple duration format."""
        from api.views import EventRestoreHandler
        
        
        mock_handle.return_value = Response(
            {"message": "Event restored successfully!"}, 
            status=status.HTTP_200_OK
        )
        
        
        handler = EventRestoreHandler()
        
        
        original_data = json.loads(self.log_entry.original_data)
        original_data["duration"] = "1:30:45"
        
        
        response = handler.handle(original_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Event restored successfully!")
    
    @patch('api.views.EventRestoreHandler.handle')    
    def test_error_handling(self, mock_handle):
        """Test error handling."""
        from api.views import EventRestoreHandler
        
        
        mock_handle.return_value = Response(
            {"error": "Failed to restore Event: Test error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
        
        handler = EventRestoreHandler()
        
        
        invalid_data = {"invalid": "data"}
        
        
        response = handler.handle(invalid_data, self.log_entry)
        
        
        mock_handle.assert_called_once_with(invalid_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to restore Event", response.data["error"])
    
    @patch('api.views.EventRestoreHandler.handle')    
    def test_log_entry_deletion(self, mock_handle):
        """Test that the log entry is deleted on success."""
        from api.views import EventRestoreHandler
        
        
        def delete_log_entry_side_effect(original_data, log_entry):
            log_entry.delete()
            return Response({"message": "Event restored successfully!"}, status=status.HTTP_200_OK)
        
        mock_handle.side_effect = delete_log_entry_side_effect
        
        
        handler = EventRestoreHandler()
        
        
        original_data = json.loads(self.log_entry.original_data)
        response = handler.handle(original_data, self.log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(ActivityLog.objects.filter(id=self.log_entry.id).count(), 0)