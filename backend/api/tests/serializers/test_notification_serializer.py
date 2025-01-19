# pylint: disable=no-member
from django.test import TestCase
from api.models import Notification
from api.serializers import NotificationSerializer
from api.tests.serializers.test_event_serializer import EventSerializerTestCase

class NotificationSerialierTestCase(TestCase):
    """ Test cases for the Notification Serializer """

    def setUp(self):
        self.event = None
        self.student2 = None

        # Will initialize both self.event and self.student2
        EventSerializerTestCase.setUp(self)

        self.notification = Notification(
            for_event=self.event,
            for_student=self.student2
        )
        self.notification.save()

        self.serializer = None
        self.data = {
            'for_event' : self.event.id,
            'for_student' : self.student2.id
        }

    def test_notification_serialization(self):
        """ Test to ensure the serializer is correctly serializing """

        self.serializer = NotificationSerializer(instance=self.notification)
        data = self.serializer.data

        self.assertEqual(data['for_event'], self.event.id)
        self.assertEqual(data['for_student'], self.student2.id)

    def test_event_deserialization(self):
        """ Test to ensure deserialization functions correctly """

        self.serializer = NotificationSerializer(data=self.data)
        self._assert_serializer_is_valid()

        notification = self.serializer.save()

        self.assertEqual(notification.for_event.id, self.data['for_event'])
        self.assertEqual(notification.for_student.id, self.data['for_student'])

    def test_notification_update(self):
        """ Test notification update functions correctly """

        self.serializer = NotificationSerializer(
            instance=self.notification,
            data=self.data,
            partial=True
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.assertEqual(self.notification.for_event.id, self.data['for_event'])
        self.assertEqual(self.notification.for_student.id, self.data['for_student'])

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")
