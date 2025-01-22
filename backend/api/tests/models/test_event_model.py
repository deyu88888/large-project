from django.utils.timezone import now, make_aware
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Event, Society, Student
from api.tests.models.test_society_model import SocietyModelTestCase

class EventModelTestCase(TestCase):
    """Unit tests for the event model"""

    def setUp(self):
        # Create a society for hosting events
        self.society = Society.objects.create(name="Test Society")

        # Create a student for testing RSVP functionality
        self.student = Student.objects.create_user(
            username="teststudent",
            password="password123",
            email="teststudent@example.com",
            first_name="Test",
            last_name="Student",
        )

        # Create an event
        self.event = Event.objects.create(
            title="Day Out",
            description="Day out at the park",
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
            date=(now() + timedelta(days=1)).date(),  # Event is in the future
            start_time=(now() + timedelta(hours=1)).time(),  # One hour from now
        )

    def test_event_valid(self):
        """Test to ensure base event is valid"""
        self._assert_event_is_valid()

    def test_string_representation(self):
        """Test to assert string representation matches title"""
        self.assertEqual(str(self.event), self.event.title)

    def test_location_not_null(self):
        """Test to assert that location cannot be null"""
        self.event.location = None
        self._assert_event_is_invalid()

    def test_society_not_null(self):
        """Test to assert a society must host each event"""
        self.event.hosted_by = None
        self._assert_event_is_invalid()

    def test_max_capacity_defaults_to_zero(self):
        """Test that max capacity defaults to 0 (no limit)"""
        event = Event.objects.create(
            title="Unlimited Event",
            description="No capacity limit",
            hosted_by=self.society,
            location="Open Field",
            date=(now() + timedelta(days=1)).date(),
            start_time=(now() + timedelta(hours=1)).time(),
        )
        self.assertEqual(event.max_capacity, 0)

    def test_event_is_full(self):
        """Test to ensure event reports as full when max capacity is reached"""
        self.event.current_attendees.add(self.student)  # Add one attendee
        another_student = Student.objects.create_user(
            username="student2",
            password="password123",
            email="student2@example.com",
            first_name="Another",
            last_name="Student",
        )
        self.event.current_attendees.add(another_student)  # Add another attendee
        self.assertTrue(self.event.is_full())

    def test_event_is_not_full(self):
        """Test to ensure event reports as not full when under max capacity"""
        self.event.current_attendees.add(self.student)  # Add one attendee
        self.assertFalse(self.event.is_full())

    def test_event_has_not_started(self):
        """Test to ensure event reports as not started when in the future"""
        event_datetime = make_aware(
            datetime.combine(self.event.date, self.event.start_time)
        )
        self.assertTrue(event_datetime > now())  # Future event

    def test_event_has_started(self):
        """Test to ensure event reports as started when in the past"""
        self.event.date = (now() - timedelta(days=1)).date()  # Past event
        self.event.start_time = (now() - timedelta(hours=1)).time()  # One hour ago
        self.event.save()
        event_datetime = make_aware(
            datetime.combine(self.event.date, self.event.start_time)
        )
        self.assertTrue(event_datetime <= now())  # Event has started

    def _assert_event_is_valid(self):
        try:
            self.event.full_clean()
        except ValidationError:
            self.fail("Test event should be valid")

    def _assert_event_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.event.full_clean()
