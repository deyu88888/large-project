from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Notification, Event, Society, Student
from django.utils.timezone import now, timedelta


class NotificationModelTestCase(TestCase):
    """Unit test for the Notification model"""

    def setUp(self):
        # Create a society
        self.society = Society.objects.create(name="Test Society")

        # Create a student
        self.student = Student.objects.create_user(
            username="teststudent",
            password="password123",
            email="teststudent@example.com",
            first_name="Test",
            last_name="Student",
        )
        self.society.society_members.add(self.student)

        # Create an event hosted by the society
        self.event = Event.objects.create(
            title="Test Event",
            description="Event description",
            hosted_by=self.society,
            location="KCL Campus",
            date=now().date() + timedelta(days=1),
            start_time=now().time(),
        )

        # Create a notification
        self.notification = Notification.objects.create(
            for_event=self.event,
            for_student=self.student,
        )

    def test_notification_valid(self):
        """Test to ensure the notification is valid"""
        self._assert_notification_is_valid()

    def test_event_not_nullable(self):
        """Test ensuring event cannot be None"""
        self.notification.for_event = None
        self._assert_notification_is_invalid()

    def test_student_not_nullable(self):
        """Test ensuring student cannot be None"""
        self.notification.for_student = None
        self._assert_notification_is_invalid()

    def test_string_representation(self):
        """Test the string representation matches the event title"""
        self.assertEqual(str(self.notification), self.event.title)

    def _assert_notification_is_valid(self):
        try:
            self.notification.full_clean()
        except ValidationError:
            self.fail("Test notification should be valid")

    def _assert_notification_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.notification.full_clean()
