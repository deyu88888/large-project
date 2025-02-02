from django.test import TestCase
from django.utils import timezone
from api.models import Event, Society, Admin, Student, EventRequest
from api.serializers import EventRequestSerializer
from datetime import timedelta

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

        self.student1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Student",
            last_name="One",
            password="studentpassword",
            major="Physics"
        )

        self.society = Society.objects.create(
            name="Robotics Club",
            leader=self.student1,
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
            from_student=self.student1,
            intent="CreateSoc",
        )
        self.event_request.save()

        # Serializer data
        self.serializer = None
        self.data = {
            "event": self.event.id,
            "title": "Night",
            "description": "Night out",
            "location": "UCL Capus",
            "from_student": self.student1.id,
            "requested_at": timezone.now(),
            "approved": True,
            "intent": "CreateSoc",
        }

    def test_event_request_serialization(self):
        """Test to ensure serialization function correctly"""
        self.serializer = EventRequestSerializer(instance=self.event_request)
        data = self.serializer.data

        self.assertEqual(self.event_request.event.id, data["event"])
        self.assertEqual(self.event_request.title, data["title"])
        self.assertEqual(self.event_request.description, data["description"])
        self.assertEqual(self.event_request.location, data["location"])
        self.assertEqual(self.event_request.approved, data["approved"])
        self.assertEqual(self.event_request.intent, data["intent"])
        self.assertEqual(
            self.event_request.from_student.id,
            data["from_student"]
        )

        self.assertEqual(
            self.event_request.requested_at.hour,
            self.data["requested_at"].hour
        )
        self.assertEqual(
            self.event_request.requested_at.minute,
            self.data["requested_at"].minute
        )
        self.assertEqual(
            self.event_request.requested_at.second,
            self.data["requested_at"].second
        )

    def test_event_request_deserialization(self):
        """Test to ensure deserialization functions correctly"""
        self.serializer = EventRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        event_request = self.serializer.save()

        self.assertEqual(event_request.event.id, self.data["event"])
        self.assertEqual(event_request.title, self.data["title"])
        self.assertEqual(event_request.location, self.data["location"])
        self.assertEqual(event_request.approved, self.data["approved"])
        self.assertEqual(event_request.intent, self.data["intent"])
        self.assertEqual(
            event_request.description,
            self.data["description"]
        )
        self.assertEqual(
            event_request.from_student.id,
            self.data["from_student"]
        )

    def test_event_requests_create(self):
        """Test event request creation function correctly"""
        self.serializer = EventRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        event_request = self.serializer.validated_data

        self.assertEqual(event_request["event"].id, self.data["event"])
        self.assertEqual(event_request["title"], self.data["title"])
        self.assertEqual(event_request["location"], self.data["location"])
        self.assertEqual(event_request["approved"], self.data["approved"])
        self.assertEqual(event_request["intent"], self.data["intent"])
        self.assertEqual(
            event_request["description"],
            self.data["description"]
        )
        self.assertEqual(
            event_request["from_student"].id,
            self.data["from_student"]
        )

    def test_event_request_update(self):
        """Test event request update functions correctly"""
        self.assertFalse(self.event_request.approved)

        self.serializer = EventRequestSerializer(
            instance=self.event_request,
            data=self.data,
            partial=True,
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.assertTrue(self.event_request.approved)

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")
