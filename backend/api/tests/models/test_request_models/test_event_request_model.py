from datetime import timedelta
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from api.models import Event, Society, User, Student, EventRequest


class EventRequestTestCase(TestCase):
    """Unit tests for the EventRequest model"""

    def setUp(self):
        self.admin = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            password="adminpassword",
            role="admin"
        )

        self.student = Student.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Student",
            last_name="One",
            password="studentpassword",
            major="Physics"
        )

        self.society = Society.objects.create(
            name="Robotics Club",
            president=self.student,
            approved_by=self.admin
        )

        self.event = Event.objects.create(
            title="Day",
            main_description="Day out",
            hosted_by=self.society,
            location="KCL Campus"
        )

        self.event_request = EventRequest.objects.create(
            event=self.event,
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateSoc",
        )

    def test_valid_event_request(self):
        """Test that our example request is valid"""
        self._assert_event_request_is_valid()

    def test_event_required(self):
        """Test that EventRequest.event is a required field"""
        self.event_request.event = None
        self._assert_event_request_is_invalid()

    def test_hosted_by_required(self):
        """Test that hosted_by is a required field"""
        self.event_request.hosted_by = None
        self._assert_event_request_is_invalid()

    def test_admin_reason_can_be_blank(self):
        """Test that admin_reason can be left empty"""
        self.event_request.admin_reason = ""
        self._assert_event_request_is_valid()

    def test_admin_reason_defaults_to_empty(self):
        """Test that admin_reason defaults to empty string"""
        new_request = EventRequest.objects.create(
            event=self.event,
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateSoc"
        )
        self.assertEqual(new_request.admin_reason, "")

    def test_string_representation(self):
        """Test __str__ method returns meaningful string"""
        expected = f"Request by {self.student} for Event {self.event.id}"
        self.assertEqual(str(self.event_request), expected)

    def _assert_event_request_is_valid(self):
        try:
            self.event_request.full_clean()
        except ValidationError:
            self.fail("EventRequest should be valid")

    def _assert_event_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.event_request.full_clean()
