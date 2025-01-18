# pylint: disable=no-member
from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from api.models import Event
from api.serializers import EventSerializer
from api.tests.serializers.test_society_serializer import SocietySerializerTestCase

class EventSerializerTestCase(TestCase):
    """ Unit tests for the Event Serializer """

    def setUp(self):
        self.society = None

        SocietySerializerTestCase.setUp(self)

        self.event = Event(
            title='Day',
            description='Day out',
            hosted_by=self.society,
            location='KCL Campus',
        )
        self.event.save()

        self.serializer = None
        self.data = {
            'title': 'event',
            'description': 'an event',
            'date': timezone.now().date(),
            'start_time': timezone.now().time(),
            'duration': timedelta(hours=2),
            'hosted_by': self.society.id,
            'location': 'Strand'
        }

    def test_event_serialization(self):
        """ Test to ensure the serializer is correctly serializing """

        self.serializer = EventSerializer(instance=self.event)
        data = self.serializer.data

        self.assertEqual(data['title'], self.event.title)
        self.assertEqual(data['description'], self.event.description)
        self.assertEqual(data['date'], self.event.date.strftime('%Y-%m-%d'))
        self.assertEqual(data['start_time'][:8], self.event.start_time.strftime('%H:%M:%S'))
        self.assertEqual(data['hosted_by'], self.event.hosted_by.id)
        self.assertEqual(data['location'], self.event.location)

    def test_event_deserialization(self):
        """ Test to ensure deserialization functions correctly """

        self.serializer = EventSerializer(data=self.data)
        self._assert_serializer_is_valid()

        event = self.serializer.save()

        self.assertEqual(event.title, self.data['title'])
        self.assertEqual(event.description, self.data['description'])
        self.assertEqual(event.date, self.data['date'])
        self.assertEqual(event.start_time, self.data['start_time'])
        self.assertEqual(event.hosted_by.id, self.data['hosted_by'])
        self.assertEqual(event.location, self.data['location'])

    def test_event_update(self):
        """ Test event update functions correctly """

        self.serializer = EventSerializer(
            instance=self.event,
            data=self.data,
            partial=True
        )
        self._assert_serializer_is_valid()

        self.serializer.save()

        self.assertEqual(self.event.title, self.data['title'])
        self.assertEqual(self.event.description, self.data['description'])
        self.assertEqual(self.event.date, self.data['date'])
        self.assertEqual(self.event.start_time, self.data['start_time'])
        self.assertEqual(self.event.hosted_by.id, self.data['hosted_by'])
        self.assertEqual(self.event.location, self.data['location'])

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")
