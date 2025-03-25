from datetime import timedelta
from django.core.exceptions import ValidationError
from django.test import TestCase
from django.utils import timezone
from api.models import Event, Society, User, Student, EventRequest
from api.tests.file_deletion import delete_file

class EventRequestTestCase(TestCase):
    """Unit tests for the EventRequest model"""

    def setUp(self):
        # Set up Admin, Students, and Society
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

        # Set up Event
        self.event = Event.objects.create(
            title="Day",
            main_description="Day out",
            hosted_by=self.society,
            location="KCL Campus"
        )

        # Create an EventRequest with the required fields only
        self.event_request = EventRequest(
            event=self.event,
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateSoc",
        )
        self.event_request.save()

    def test_valid_event_request(self):
        """Test that our example request is valid"""
        self._assert_event_request_is_valid()

    def test_event_required(self):
        """Test that EventRequest.event is a required field"""
        self.event_request.event = None
        self._assert_event_request_is_invalid()

    def test_admin_reason_borderline(self):
        """Test that admin_reason can be 300 characters long"""
        self.event_request.admin_reason = 'a' * 300
        self._assert_event_request_is_valid()

    def _assert_event_request_is_valid(self):
        try:
            self.event_request.full_clean()
        except ValidationError:
            self.fail("EventRequest should be valid")

    def _assert_event_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.event_request.full_clean()

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
