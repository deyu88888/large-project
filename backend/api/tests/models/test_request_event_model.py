from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Event, Society, Admin, Student, EventRequest

# pylint: disable=no-member


class EventRequestSerializerTestCase(TestCase):
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
            from_student=self.student,
            approved=False,
            description="Wanted tech event",
            intent="CreateSoc",
            society=self.society,
            event=self.event,
        )
        self.event_request.save()

    def test_event_required(self):
        """Test EventRequest.event is a required field """
        self._assert_event_request_is_valid()
        self.event_request.event = None
        self._assert_event_request_is_invalid()

    def _assert_event_request_is_valid(self):
        try:
            self.event_request.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_event_request_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.event_request.full_clean()