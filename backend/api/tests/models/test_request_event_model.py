from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Event, Society, Admin, Student, EventRequest
from datetime import timedelta
from django.utils import timezone

# pylint: disable=no-member


class EventRequestTestCase(TestCase):
    """ Unit tests for the Event Serializer """

    def setUp(self):
        # Set up Admin, Students, and Society
        self.admin = Admin.objects.create(
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
            leader=self.student,
            approved_by=self.admin
        )

        # Set up Event
        self.event = Event.objects.create(
            title="Day",
            description="Day out",
            hosted_by=self.society,
            location="KCL Campus"
        )

        self.event_request = EventRequest(
            event=self.event,
            title="Night",
            description="Night out",
            location="UCL Campus",
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            duration=timedelta(hours=1),
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateSoc",
        )
        self.event_request.save()

    def test_valid_event_request(self):
        """Test that our example request is valid"""
        self._assert_event_request_is_valid()

    def test_event_not_required(self):
        """Test EventRequest.event is a required field """
        self.event_request.event = None
        self._assert_event_request_is_valid()

    def test_title_not_required(self):
        """Test EventRequest.title is a required field """
        self.event_request.title = None
        self._assert_event_request_is_valid()

    def test_description_not_required(self):
        """Test EventRequest.description is a required field """
        self.event_request.description = None
        self._assert_event_request_is_valid()

    def test_location_not_required(self):
        """Test EventRequest.location is a required field """
        self.event_request.location = None
        self._assert_event_request_is_valid()

    def test_date_not_required(self):
        """Test EventRequest.date is a required field """
        self.event_request.date = None
        self._assert_event_request_is_valid()

    def test_start_time_not_required(self):
        """Test EventRequest.start_time is a required field """
        self.event_request.start_time = None
        self._assert_event_request_is_valid()

    def test_duration_not_required(self):
        """Test EventRequest.duration is a required field """
        self.event_request.duration = None
        self._assert_event_request_is_valid()

    def test_description_borderline(self):
        """Test EventRequest.description can be 300 chars"""
        self.event_request.description = 'a' * 300
        self._assert_event_request_is_valid()

    def test_description_too_long(self):
        """Test EventRequest.description can't be <300 chars"""
        self.event_request.description = 'a' * 301
        self._assert_event_request_is_invalid()

    def _assert_event_request_is_valid(self):
        try:
            self.event_request.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_event_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.event_request.full_clean()
