from datetime import date, time
from datetime import datetime, timedelta
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils.timezone import now, make_aware
from api.models import Event, Student, User, Society
from api.tests.file_deletion import delete_file


class EventModelTestCase(TestCase):
    """ Unit tests for the Event model """

    def setUp(self):
        # Create an admin user
        self.admin = User.objects.create(
            username='admin_user',
            first_name='Admin',
            last_name='User',
            email='admin@example.com',
            password='adminpassword',
            role='admin',
        )

        # Create students
        self.student1 = Student.objects.create(
            username='QWERTY',
            first_name='QWE',
            last_name='RTY',
            email='qwerty@gmail.com',
            role='student',
            major='CompSci',
        )

        self.student2 = Student.objects.create(
            username='Ja-Smith',
            first_name='Jane',
            last_name='Smith',
            email='jasmith@gmail.com',
            role='student',
            major='Mathematics',
        )

        # Create a society
        self.society = Society.objects.create(
            name='Tech',
            president=self.student1,
            approved_by=self.admin,
        )
        self.society.society_members.add(self.student2)

        dummy_cover = SimpleUploadedFile(
            "test_cover.jpg",
            b"dummy image content",
            content_type="image/jpeg"
        )

        # Create an event
        self.event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
            date=(now() + timedelta(days=1)).date(),
            start_time=(now() + timedelta(hours=1)).time(),
            cover_image=dummy_cover
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
            main_description="No capacity limit",
            hosted_by=self.society,
            location="Open Field",
            date=(now() + timedelta(days=1)).date(),
            start_time=(now() + timedelta(hours=1)).time(),
        )
        self.assertEqual(event.max_capacity, 0)

    def test_event_is_full(self):
        """Test to ensure event is full"""
        self.event.current_attendees.add(self.student1)
        another_student = Student.objects.create_user(
            username="student2",
            password="password123",
            email="student2@example.com",
            first_name="Another",
            last_name="Student",
        )
        self.event.current_attendees.add(another_student)
        self.assertTrue(self.event.is_full())

    def test_event_is_not_full(self):
        """Test to ensure event is not full"""
        self.event.current_attendees.add(self.student1)
        self.assertFalse(self.event.is_full())

    def test_event_has_not_started(self):
        """Test to ensure event has not started"""
        event_datetime = make_aware(
            datetime.combine(self.event.date, self.event.start_time)
        )
        self.assertTrue(event_datetime > now())

    def test_event_has_started(self):
        """Test to ensure event has started"""
        self.event.date = (now() - timedelta(days=1)).date()
        self.event.start_time = (now() - timedelta(hours=1)).time()
        self.event.save()
        event_datetime = make_aware(
            datetime.combine(self.event.date, self.event.start_time)
        )
        self.assertTrue(event_datetime <= now())

    def test_status_defaults_to_pending(self):
        """Test to ensure status defaults to pending"""
        self.assertEqual(self.event.status, "Pending")

    def test_pending_event_past_start_becomes_rejected(self):
        """Test to ensure status defaults to rejected"""
        self.event.date = (now() - timedelta(days=1)).date()
        self.event.start_time = (now() - timedelta(hours=1)).time()
        self.event.save()
        self.assertEqual(self.event.status, "Rejected")

    def test_approved_event_past_start_stays_approved(self):
        """Test to ensure status defaults to approved"""
        self.event.status = "Approved"
        self.event.date = (now() - timedelta(days=1)).date()
        self.event.start_time = (now() - timedelta(hours=1)).time()
        self.event.save()
        self.assertEqual(self.event.status, "Approved")

    def test_default_duration_is_one_hour(self):
        """Test to ensure default duration is one hour"""
        event = Event.objects.create(
            title="Short Event",
            main_description="Quick one",
            hosted_by=self.society,
            location="Library",
            date=(now() + timedelta(days=2)).date(),
            start_time=(now() + timedelta(hours=2)).time(),
        )
        self.assertEqual(event.duration, timedelta(hours=1))

    def test_date_and_time_as_string_parsed_correctly(self):
        """Test to ensure date and time are parsed correctly"""
        event = Event(
            title="String Event",
            main_description="String time and date",
            hosted_by=self.society,
            location="Somewhere",
            date=(now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            start_time=(now() + timedelta(hours=1)).strftime("%H:%M"),
        )
        event.save()
        self.assertIsInstance(event.date, date)
        self.assertIsInstance(event.start_time, time)

    def test_invalid_time_format_raises_error(self):
        """Test to ensure time format is invalid"""
        event = Event(
            title="Bad Time Event",
            main_description="Invalid time",
            hosted_by=self.society,
            location="Error zone",
            date=(now() + timedelta(days=1)).strftime("%Y-%m-%d"),
            start_time="invalid-time-format",
        )
        with self.assertRaises(ValueError):
            event.save()

    def _assert_event_is_valid(self):
        """Test to ensure event is valid"""
        try:
            self.event.full_clean()
        except ValidationError:
            self.fail("Test event should be valid")

    def _assert_event_is_invalid(self):
        """Test to ensure event is invalid"""
        with self.assertRaises(ValidationError):
            self.event.full_clean()

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
