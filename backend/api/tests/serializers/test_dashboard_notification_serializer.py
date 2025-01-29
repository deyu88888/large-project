from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from api.models import Student, User, Event, Notification
from api.serializers import DashboardNotificationSerializer

class TestNotificationSerializer(TestCase):
    def setUp(self):
        # Create a user
        self.user = User.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Student",
            last_name="One",
        )

        # Create a student
        self.student = Student.objects.create(
            user_ptr=self.user,
            major="Computer Science",
        )

        # Create an event
        self.event = Event.objects.create(
            title="Test Event",
            description="A test event.",
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            location="Test Location",
        )

        # Create a notification
        self.notification = Notification.objects.create(
            for_event=self.event,
            for_student=self.student,
            message="This is a test notification.",
            is_read=False,
        )

    def test_valid_notification_serialization(self):
        """Test that valid notification data serializes correctly."""
        serializer = DashboardNotificationSerializer(self.notification)
        expected_data = {
            "id": self.notification.id,
            "message": self.notification.message,
            "is_read": self.notification.is_read,
            "event_title": self.event.title,
            "student_name": f"{self.student.first_name} {self.student.last_name}",
        }
        self.assertEqual(serializer.data, expected_data)

    def test_invalid_notification_without_message(self):
        """Test that the serializer fails without a message."""
        invalid_data = {
            "for_event": self.event.id,
            "for_student": self.student.id,
            "is_read": False,
        }
        serializer = DashboardNotificationSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid(), "Serializer should be invalid without 'message'")
        self.assertIn("message", serializer.errors)

    def test_partial_update_is_read(self):
        """Test partial update for the `is_read` field."""
        serializer = DashboardNotificationSerializer(
            self.notification, data={"is_read": True}, partial=True
        )
        self.assertTrue(serializer.is_valid(), "Serializer should be valid for partial update")
        updated_instance = serializer.save()
        self.assertTrue(updated_instance.is_read, "'is_read' should be updated to True")

    def test_read_only_fields(self):
        """
        Test that read-only fields (id, event_title, student_name) 
        cannot be directly changed through the serializer.
        """
        invalid_data = {
            "id": 999,
            "event_title": "Fake Event Title",
            "student_name": "Fake Name",
        }
        serializer = DashboardNotificationSerializer(
            self.notification, data=invalid_data, partial=True
        )
        # The serializer is "valid" because DRF just ignores read-only fields. 
        # We check if these read-only fields remain unchanged after save().
        self.assertTrue(serializer.is_valid())
        instance = serializer.save()

        # Ensure these read-only fields remain unchanged
        self.assertNotEqual(instance.id, invalid_data["id"], "ID should not change")
        self.assertNotEqual(
            instance.for_event.title,
            invalid_data.get("event_title", ""),
            "Event title should not change"
        )
        self.assertNotEqual(
            f"{instance.for_student.first_name} {instance.for_student.last_name}",
            invalid_data.get("student_name", ""),
            "Student name should not change"
        )