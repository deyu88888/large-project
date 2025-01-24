# pylint: disable=no-member
from django.test import TestCase
from django.utils.timezone import now
from datetime import timedelta
from api.models import Notification, Event, Student, Society
from api.serializers import NotificationSerializer

class NotificationSerialierTestCase(TestCase):
    """ Test cases for the Notification Serializer """

    def setUp(self):
        # Create a student
        self.student2 = Student.objects.create_user(
            username="test_student",
            password="Password123",
            first_name="Test",
            last_name="Student",
            email="test_student@example.com",
            role="student",
            major="Computer Science",
        )

        # Create a society
        self.society = Society.objects.create(
            name="Test Society",
            leader=self.student2
        )

        # Create an event
        self.event = Event.objects.create(
            title="Test Event",
            description="This is a test event",
            date=now().date(),
            start_time=now().time(),
            duration=timedelta(hours=2),
            hosted_by=self.society,
            location="Test Location"
        )

        # Create a notification
        self.notification = Notification.objects.create(
            for_event=self.event,
            for_student=self.student2
        )

        # Sample data for serialization
        self.serializer = None
        self.data = {
            'for_event': self.event.id,
            'for_student': self.student2.id
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