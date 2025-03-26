from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from api.models import Student, User, Event, Notification
from api.serializers import DashboardNotificationSerializer
from api.tests.file_deletion import delete_file

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
            first_name="NotificationSerializer",
            last_name="Student",
            user_ptr=self.user,
            major="Computer Science",
        )

        # Create an event
        self.event = Event.objects.create(
            title="Test Event",
            main_description="A test event.",
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            location="Test Location",
        )

        # Create a notification
        self.notification = Notification.objects.create(
            header=str(self.event),
            for_user=self.student,
            body="This is a test notification.",
            is_read=False,
        )

    def test_valid_notification_serialization(self):
        """Test that valid notification data serializes correctly."""
        serializer = DashboardNotificationSerializer(self.notification)
        expected_data = {
            "id": self.notification.id,
            "body": self.notification.body,
            "is_read": self.notification.is_read,
            "header": self.notification.header,
            "student_name": f"{self.student.first_name} {self.student.last_name}",
        }
        self.assertEqual(serializer.data, expected_data)

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
            f"{instance.for_user.first_name} {instance.for_user.last_name}",
            invalid_data.get("student_name", ""),
            "Student name should not change"
        )

    def tearDown(self):
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
