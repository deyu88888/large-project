from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIRequestFactory
from rest_framework import serializers
from api.models import Event, Society, User, Student, EventRequest
from api.serializers import EventRequestSerializer
from api.tests.file_deletion import delete_file

# pylint: disable=no-member


class EventRequestSerializerTestCase(TestCase):
    """Unit tests for the EventRequestSerializer"""

    def setUp(self):
        # Create an admin
        self.admin = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            password="adminpassword",
            role="admin"
        )
        # Create a student
        self.student1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Student",
            last_name="One",
            password="studentpassword",
            major="Physics"
        )
        # Create a society with student1 as president (and president)
        self.society = Society.objects.create(
            name="Robotics Club",
            president=self.student1,
            approved_by=self.admin
        )
        self.student1.president_of = self.society
        self.student1.save()

        # Create an event
        self.event = Event.objects.create(
            title="Day",
            main_description="Day out",
            hosted_by=self.society,
            location="KCL Campus"
        )

        # Create an existing EventRequest instance (for serialization and update tests)
        self.event_request = EventRequest.objects.create(
            event=self.event,
            from_student=self.student1,
            hosted_by=self.society,
            intent="CreateSoc",
            approved=False
        )
        # Create a dummy request (for serializer context)
        factory = APIRequestFactory()
        self.request = factory.get('/')
        self.request.user = self.student1

        # Input data for creation (only writable fields are provided)
        self.data = {
            "title": "Evening Gala",
            "description": "A gala event in the evening.",
            "location": "Main Hall",
            "date": timezone.now().date(),
            "start_time": timezone.now().time(),
            "duration": "01:30:00",  # as an ISO 8601 duration string
        }

        # Data for update (to change approval)
        self.update_data = {"approved": True}

    def test_event_request_serialization(self):
        """Test that serialization produces the expected output."""
        serializer = EventRequestSerializer(instance=self.event_request)
        data = serializer.data

        # Because we now use a SerializerMethodField for 'event',
        # it will always appear in the output.
        self.assertEqual(self.event_request.event.id, data.get("event"))
        self.assertEqual(self.event_request.title, data.get("title"))
        self.assertEqual(self.event_request.description, data.get("description"))
        self.assertEqual(self.event_request.location, data.get("location"))
        self.assertEqual(self.event_request.approved, data.get("approved"))
        self.assertEqual(self.event_request.intent, data.get("intent"))
        self.assertEqual(self.event_request.from_student.id, data.get("from_student"))
        self.assertIn("requested_at", data)

    def test_event_request_deserialization(self):
        """Test that deserialization and creation function correctly."""
        serializer = EventRequestSerializer(data=self.data, context={'request': self.request})
        self._assert_serializer_is_valid(serializer)
        # Simulate creation by providing 'hosted_by' (and letting create() set defaults)
        event_request = serializer.save(hosted_by=self.society)
        self.assertEqual(event_request.title, self.data["title"])
        self.assertEqual(event_request.description, self.data["description"])
        self.assertEqual(event_request.location, self.data["location"])
        # create() sets these defaults:
        self.assertEqual(event_request.intent, "CreateEve")
        self.assertFalse(event_request.approved)
        self.assertEqual(event_request.from_student.id, self.student1.id)
        self.assertEqual(event_request.hosted_by.id, self.society.id)
        # 'event' was not provided in the input so it remains None
        self.assertIsNone(event_request.event)

    def test_event_requests_create(self):
        """Test event request creation via serializer works correctly."""
        serializer = EventRequestSerializer(data=self.data, context={'request': self.request})
        self._assert_serializer_is_valid(serializer)
        event_request = serializer.save(hosted_by=self.society)
        # Check that the created instance has the expected values.
        self.assertEqual(event_request.title, self.data["title"])
        self.assertEqual(event_request.location, self.data["location"])
        self.assertEqual(event_request.intent, "CreateEve")
        self.assertFalse(event_request.approved)
        self.assertEqual(event_request.from_student.id, self.student1.id)
        self.assertEqual(event_request.hosted_by.id, self.society.id)

    def test_event_request_update(self):
        """Test that updating an event request works as expected."""
        self.assertFalse(self.event_request.approved)
        serializer = EventRequestSerializer(
            instance=self.event_request,
            data=self.update_data,
            partial=True,
            context={'request': self.request}
        )
        self._assert_serializer_is_valid(serializer)
        serializer.save()
        self.event_request.refresh_from_db()
        self.assertTrue(self.event_request.approved)

    # --- Additional tests to increase coverage ---

    def test_create_without_request_context(self):
        """Test that create() fails if no request is in the context."""
        serializer = EventRequestSerializer(data=self.data)  # no context provided
        self._assert_serializer_is_valid(serializer)
        with self.assertRaises(serializers.ValidationError) as context:
            serializer.save(hosted_by=self.society)
        self.assertIn("Request is required in serializer context.", str(context.exception))

    def test_create_with_non_student_user(self):
        """Test that create() fails if the request.user is not a student."""
        # Set request.user to the admin (which is not a student)
        self.request.user = self.admin
        serializer = EventRequestSerializer(data=self.data, context={'request': self.request})
        self._assert_serializer_is_valid(serializer)
        with self.assertRaises(serializers.ValidationError) as context:
            serializer.save(hosted_by=self.society)
        self.assertIn("Only students can request event creation.", str(context.exception))
        # Restore original user for other tests
        self.request.user = self.student1

    def test_create_with_student_not_president(self):
        """Test that create() fails if the student is not the president of the provided society."""
        # Create a new society and student who is not its president.
        other_society = Society.objects.create(
            name="Chess Club",
            president=self.student1,  # initially student1 is president here...
            approved_by=self.admin
        )
        # Create a new student with no president_of assignment.
        student2 = Student.objects.create(
            username="student2",
            email="student2@example.com",
            first_name="Student",
            last_name="Two",
            password="studentpassword",
            major="Math"
        )
        # Set request.user to student2 (who is not president of self.society)
        self.request.user = student2
        serializer = EventRequestSerializer(data=self.data, context={'request': self.request})
        self._assert_serializer_is_valid(serializer)
        with self.assertRaises(serializers.ValidationError) as context:
            serializer.save(hosted_by=self.society)
        self.assertIn("You can only create events for your own society.", str(context.exception))
        # Restore original user for other tests
        self.request.user = self.student1

    def test_create_without_hosted_by(self):
        """Test that create() fails if 'hosted_by' is not provided (via validated_data)."""
        serializer = EventRequestSerializer(data=self.data, context={'request': self.request})
        self._assert_serializer_is_valid(serializer)
        # Do not pass hosted_by to save()
        with self.assertRaises(serializers.ValidationError) as context:
            serializer.save()
        self.assertIn("hosted_by", str(context.exception))

    def test_invalid_title_validation(self):
        """Test that an invalid (blank) title fails validation."""
        invalid_data = self.data.copy()
        invalid_data["title"] = "   "  # blank after stripping
        serializer = EventRequestSerializer(data=invalid_data, context={'request': self.request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Title cannot be blank", str(serializer.errors.get("title", "")))

    def test_get_event_method(self):
        """Test that the get_event() method returns None when event is None."""
        # Create an EventRequest without an event.
        serializer = EventRequestSerializer(instance=self.event_request)
        # Manually set event to None for this test.
        self.event_request.event = None
        self.event_request.save()
        data = serializer.data
        self.assertIsNone(data.get("event"))

    def _assert_serializer_is_valid(self, serializer):
        if not serializer.is_valid():
            self.fail(f"Serializer should be valid. Errors: {serializer.errors}")

    def _assert_serializer_is_invalid(self, serializer):
        if serializer.is_valid():
            self.fail("Serializer should be invalid")

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
