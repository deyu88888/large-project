from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Notification, Event
from api.tests.models.test_event_model import EventModelTestCase

class NotificationModelTestCase(TestCase):
    """ Unit test for the notification model """

    def setUp(self):
        self.event : Event = None
        EventModelTestCase.setUp(self)

        self.notification = Notification(
            for_event=self.event,
            for_student=self.event.hosted_by.society_members.first()
        )
        self.notification.save()

    def test_event_valid(self):
        """ Test to ensure the event is valid """
        self._assert_notification_is_valid()
    
    def test_event_not_nullable(self):
        """ Test ensuring event cannot be None """
        self.notification.for_event = None

        self._assert_notifiation_is_invalid()

    def test_student_not_nullable(self):
        """ Test ensuring student cannot be None """
        self.notification.for_student = None

        self._assert_notifiation_is_invalid()
    
    def test_string_representation(self):
        """ Test the string rep matches event the notification is for """
        self.assertEqual(str(self.notification), self.event.title)

        self.assertEqual(str(self.notification), str(self.event))

    def _assert_notification_is_valid(self):
        try:
            self.notification.full_clean()
        except ValidationError:
            self.fail("Test notification should be valid")

    def _assert_notifiation_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.notification.full_clean()
