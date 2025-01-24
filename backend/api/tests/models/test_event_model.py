from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Event, Society, Admin, Student

class EventModelTestCase(TestCase):
    """ Unit tests for the Event model """

    def setUp(self):
        # Create an admin user
        self.admin = Admin.objects.create(
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
            leader=self.student1,
            approved_by=self.admin,
        )
        self.society.society_members.add(self.student2)

        # Create an event
        self.event = Event.objects.create(
            title='Day',
            description='Day out',
            hosted_by=self.society,
            location='KCL Campus',
        )

    def test_event_valid(self):
        """ Test to ensure base event is valid """
        self._assert_event_is_valid()

    def test_string_representation(self):
        """ Test to assert string representation matches title """
        self.assertEqual(str(self.event), self.event.title)

    def test_location_not_null(self):
        """ Test to assert that location cannot be null """
        self.event.location = None
        self._assert_event_is_invalid()

    def test_society_not_null(self):
        """ Test to assert a society must host each event """
        self.event.hosted_by = None
        self._assert_event_is_invalid()

    def _assert_event_is_valid(self):
        try:
            self.event.full_clean()
        except ValidationError:
            self.fail("Test event should be valid")

    def _assert_event_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.event.full_clean()
