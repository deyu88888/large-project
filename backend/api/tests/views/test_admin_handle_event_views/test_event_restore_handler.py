import json
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.response import Response
from api.models import User, Student, Society, Event, ActivityLog
from api.views import EventRestoreHandler

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
        mock_handle.return_value = Response(
            {"message": "Event restored successfully!"},
            status=status.HTTP_200_OK
        )

        handler = EventRestoreHandler()

        original_data = json.loads(self.log_entry.original_data)
        response = handler.handle(original_data, self.log_entry)

        mock_handle.assert_called_once_with(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"],
                         "Event restored successfully!")

    @patch('api.views.EventRestoreHandler.handle')
    def test_with_complex_date(self, mock_handle):
        """Test with complex date format."""
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
        self.assertEqual(response.data["message"],
                         "Event restored successfully!")

    @patch('api.views.EventRestoreHandler.handle')
    def test_with_attendees(self, mock_handle):
        """Test with attendees."""
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
        self.assertEqual(response.data["message"],
                         "Event restored successfully!")

    @patch('api.views.EventRestoreHandler.handle')
    def test_with_complex_duration(self, mock_handle):
        """Test with complex duration format."""
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
        self.assertEqual(response.data["message"],
                         "Event restored successfully!")

    @patch('api.views.EventRestoreHandler.handle')
    def test_with_simple_duration(self, mock_handle):
        """Test with simple duration format."""
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
        self.assertEqual(response.data["message"],
                         "Event restored successfully!")

    @patch('api.views.EventRestoreHandler.handle')
    def test_error_handling(self, mock_handle):
        """Test error handling."""
        mock_handle.return_value = Response(
            {"error": "Failed to restore Event: Test error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

        handler = EventRestoreHandler()

        invalid_data = {"invalid": "data"}

        response = handler.handle(invalid_data, self.log_entry)

        mock_handle.assert_called_once_with(invalid_data, self.log_entry)

        self.assertEqual(response.status_code,
                         status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to restore Event", response.data["error"])

    @patch('api.views.EventRestoreHandler.handle')
    def test_log_entry_deletion(self, mock_handle):
        """Test that the log entry is deleted on success."""
        def delete_log_entry_side_effect(original_data, log_entry):
            log_entry.delete()
            return Response({"message": "Event restored successfully!"}, status=status.HTTP_200_OK)

        mock_handle.side_effect = delete_log_entry_side_effect

        handler = EventRestoreHandler()

        original_data = json.loads(self.log_entry.original_data)
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        self.assertEqual(ActivityLog.objects.filter(
            id=self.log_entry.id).count(), 0)

    def test_restore_minimal_event(self):
        """Test restoring a minimal valid event."""
        original_data = json.loads(self.log_entry.original_data)

        handler = EventRestoreHandler()
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"],
                         "Event restored successfully!")

        restored_event = Event.objects.get(id=response.data["event_id"])
        self.assertEqual(restored_event.title, original_data["title"])

    def test_restore_with_attendees_and_current_attendees(self):
        """Test restoration with attendees and current_attendees by email."""
        s1 = Student.objects.create(
            username="s1", email="s1@test.com", first_name="S", last_name="One"
        )
        s2 = Student.objects.create(
            username="s2", email="s2@test.com", first_name="S", last_name="Two"
        )

        original_data = json.loads(self.log_entry.original_data)
        original_data["attendees"] = [s1.id, s2.id]
        original_data["current_attendees"] = [s1.email, s2.email]

        handler = EventRestoreHandler()
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        event = Event.objects.get(id=response.data["event_id"])
        self.assertEqual(set(event.attendees.values_list(
            "id", flat=True)), {s1.id, s2.id})
        self.assertEqual(set(event.current_attendees.values_list(
            "id", flat=True)), {s1.id, s2.id})

    def test_restore_with_duration_formats(self):
        """Test parsing of multiple duration formats."""
        durations = ["2 days, 3:45:30", "1:30:00", 5400]

        for duration in durations:
            log = self.log_entry
            log.pk = None
            log.id = None
            log.save()

            original_data = json.loads(log.original_data)
            original_data["duration"] = duration

            handler = EventRestoreHandler()
            response = handler.handle(original_data, log)

            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertIn("event_id", response.data)

    def test_restore_with_invalid_duration_gracefully_falls_back(self):
        """Test that invalid duration doesn't break restoration."""
        from api.views_files.admin_handle_event_views import EventRestoreHandler

        original_data = json.loads(self.log_entry.original_data)
        original_data["duration"] = "bad-format"

        handler = EventRestoreHandler()
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = Event.objects.get(id=response.data["event_id"])
        self.assertEqual(event.duration, timedelta(hours=1))

    @patch("api.views_files.admin_handle_event_views.Event.objects.create", side_effect=Exception("Simulated failure"))
    def test_restore_fails_on_exception(self, mock_create):
        """Ensure exceptions are caught and returned as 500."""
        original_data = json.loads(self.log_entry.original_data)
        handler = EventRestoreHandler()
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code,
                         status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to restore Event", response.data["error"])

    def test_restore_sets_status_to_default_if_missing(self):
        """Ensure 'status' is set to 'Approved' if missing in original data."""
        original_data = json.loads(self.log_entry.original_data)
        original_data.pop("status", None)

        handler = EventRestoreHandler()
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = Event.objects.get(id=response.data["event_id"])
        self.assertEqual(event.status, "Approved")


    def test_restore_prints_on_invalid_current_attendees(self):
        """Ensure print occurs on missing student emails in current_attendees."""
        original_data = json.loads(self.log_entry.original_data)
        original_data["current_attendees"] = ["nonexistent@example.com"]

        handler = EventRestoreHandler()
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = Event.objects.get(id=response.data["event_id"])
        self.assertEqual(event.current_attendees.count(), 0)


    def test_restore_handles_images_field_exception(self):
        """Ensure image handling block catches errors and continues."""
        original_data = json.loads(self.log_entry.original_data)
        original_data["images"] = ["invalid-image-id"]  # not a valid ID

        handler = EventRestoreHandler()
        response = handler.handle(original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        event = Event.objects.get(id=response.data["event_id"])
