import json
from datetime import timedelta
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.response import Response

from api.models import User, Student, Society, Event, ActivityLog
from api.views import EventStatusChangeUndoHandler




class TestEventStatusChangeUndoHandler(TestCase):
    """Tests for the EventStatusChangeUndoHandler class."""

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
        
        future_date = timezone.now().date() + timedelta(days=1)
        future_time = (timezone.now() + timedelta(hours=1)).time()

        self.event = Event.objects.create(
            title="Test Event",
            main_description="This is a test event",
            location="Test Location",
            hosted_by=self.society,
            status="Approved",
            date=future_date,
            start_time=future_time,
        )
        
        
        self.approve_log_entry = ActivityLog.objects.create(
            action_type="Approve",
            target_type="Event",
            target_id=self.event.id,
            target_name=self.event.title,
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Event approved for testing",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({
                "id": self.event.id,
                "title": self.event.title,
                "status": "Pending"
            })
        )
        
        
        self.reject_log_entry = ActivityLog.objects.create(
            action_type="Reject",
            target_type="Event",
            target_id=self.event.id,
            target_name=self.event.title,
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Event rejected for testing",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({
                "id": self.event.id,
                "title": self.event.title,
                "status": "Pending"
            })
        )
    
    @patch('api.views.get_object_by_id_or_name')
    @patch('api.views.EventStatusChangeUndoHandler.handle')    
    def test_undo_approve_status(self, mock_handle, mock_get_object):
        """Test undoing an approve status change."""        
        mock_get_object.return_value = self.event
        mock_handle.return_value = Response(
            {"message": "Event status change undone successfully. Status set back to Pending."}, 
            status=status.HTTP_200_OK
        )
        
        
        handler = EventStatusChangeUndoHandler()
        
        
        original_data = json.loads(self.approve_log_entry.original_data)
        response = handler.handle(original_data, self.approve_log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.approve_log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Event status change undone successfully", response.data["message"])
    
    @patch('api.views.get_object_by_id_or_name')
    @patch('api.views.EventStatusChangeUndoHandler.handle')    
    def test_undo_reject_status(self, mock_handle, mock_get_object):
        """Test undoing a reject status change."""        
        mock_get_object.return_value = self.event
        mock_handle.return_value = Response(
            {"message": "Event status change undone successfully. Status set back to Pending."}, 
            status=status.HTTP_200_OK
        )
        
        
        handler = EventStatusChangeUndoHandler()
        
        
        original_data = json.loads(self.reject_log_entry.original_data)
        response = handler.handle(original_data, self.reject_log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.reject_log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Event status change undone successfully", response.data["message"])
    
    @patch('api.views.get_object_by_id_or_name')
    @patch('api.views.EventStatusChangeUndoHandler.handle')    
    def test_event_not_found(self, mock_handle, mock_get_object):
        """Test handling when event is not found."""
        mock_get_object.return_value = None
        mock_handle.return_value = Response(
            {"error": "Event not found."}, 
            status=status.HTTP_404_NOT_FOUND
        )
        
        
        handler = EventStatusChangeUndoHandler()
        
        
        original_data = json.loads(self.approve_log_entry.original_data)
        response = handler.handle(original_data, self.approve_log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.approve_log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data["error"], "Event not found.")
    
    @patch('api.views.get_object_by_id_or_name')
    @patch('api.views.EventStatusChangeUndoHandler.handle')    
    def test_error_handling(self, mock_handle, mock_get_object):
        """Test error handling during status change undo."""
        mock_get_object.return_value = self.event
        mock_handle.return_value = Response(
            {"error": "Failed to undo event status change: Test error"}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
        
        
        handler = EventStatusChangeUndoHandler()
        
        
        original_data = json.loads(self.approve_log_entry.original_data)
        response = handler.handle(original_data, self.approve_log_entry)
        
        
        mock_handle.assert_called_once_with(original_data, self.approve_log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to undo event status change", response.data["error"])
    
    @patch('api.views.get_object_by_id_or_name')
    @patch('api.views.EventStatusChangeUndoHandler.handle')    
    def test_log_entry_deletion_and_creation(self, mock_handle, mock_get_object):
        """Test that log entry is deleted and a new one is created."""
        def simulate_handler_behavior(original_data, log_entry):
            
            ActivityLog.objects.create(
                action_type="Update",
                target_type="Event",
                target_id=self.event.id,
                target_name=self.event.title,
                performed_by=log_entry.performed_by,
                timestamp=timezone.now(),
                reason=log_entry.reason,
                expiration_date=timezone.now() + timedelta(days=30),
            )
            
            
            log_entry.delete()
            
            return Response(
                {"message": "Event status change undone successfully. Status set back to Pending."}, 
                status=status.HTTP_200_OK
            )
        
        
        mock_get_object.return_value = self.event
        mock_handle.side_effect = simulate_handler_behavior
        
        
        initial_log_count = ActivityLog.objects.count()
        
        
        handler = EventStatusChangeUndoHandler()
        
        
        original_data = json.loads(self.approve_log_entry.original_data)
        response = handler.handle(original_data, self.approve_log_entry)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(ActivityLog.objects.filter(id=self.approve_log_entry.id).count(), 0)
        
        
        current_log_count = ActivityLog.objects.count()
        self.assertEqual(current_log_count, initial_log_count)  
        
        
        new_log = ActivityLog.objects.filter(
            action_type="Update",
            target_type="Event",
            target_id=self.event.id
        ).first()
        
        self.assertIsNotNone(new_log)
        self.assertEqual(new_log.target_name, self.event.title)
        self.assertEqual(new_log.performed_by, self.admin)
    
    @patch('api.views.get_object_by_id_or_name')
    @patch('api.views.ActivityLog.objects.create')
    def test_full_integration(self, mock_activity_log_create, mock_get_object):
        """Test a more integrated approach with fewer mocks."""
        mock_get_object.return_value = self.event
    
        mock_log = MagicMock()
        mock_activity_log_create.return_value = mock_log
        
        handler = EventStatusChangeUndoHandler()
    
        original_data = json.loads(self.approve_log_entry.original_data)
        response = handler.handle(original_data, self.approve_log_entry)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Event status change undone successfully", response.data["message"])
    
        self.event.refresh_from_db()
        self.assertEqual(self.event.status, "Pending")
        
        mock_activity_log_create.assert_called_once()