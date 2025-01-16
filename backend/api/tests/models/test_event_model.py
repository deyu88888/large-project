from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Event
from api.tests.models.test_society_model import SocietyModelTestCase

class EventModelTestCase(TestCase):
    """ Unit tests for the event model """

    def setUp(self):
        self.society = None
        SocietyModelTestCase.setUp(self)

        self.event = Event(
            title='Day',
            description='Day out',
            hosted_by=self.society,
            location='KCL Campus',
        )
        self.event.save()

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
