# api/tests/serializers/test_event_calendar_serializer.py
import datetime
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from api.models import Event
from api.serializers import EventCalendarSerializer

class TestEventCalendarSerializer(TestCase):
    def setUp(self):
        self.event = Event.objects.create(
            title="Sample Event",
            main_description="Test event description",
            date=timezone.now().date(),
            start_time=timezone.now().time(),
            duration=timedelta(hours=2),
            location="Sample Location",
        )

    def test_valid_event_serialization(self):
        """Test that valid event data serializes correctly."""
        serializer = EventCalendarSerializer(self.event)
        # Calculate expected start/end in UTC
        start_dt = datetime.datetime.combine(self.event.date, self.event.start_time).replace(
            tzinfo=datetime.timezone.utc
        )
        expected_start = start_dt.isoformat()
        expected_end = (start_dt + self.event.duration).isoformat()

        self.assertEqual(serializer.data["id"], self.event.id)
        self.assertEqual(serializer.data["title"], self.event.title)
        self.assertEqual(serializer.data["start"], expected_start)
        self.assertEqual(serializer.data["end"], expected_end)
        self.assertEqual(serializer.data["location"], self.event.location)

    def test_get_end_method(self):
        """Test the `get_end` method calculates end time correctly."""
        serializer = EventCalendarSerializer(self.event)
        # Manually calculate the expected end
        start_dt = datetime.datetime.combine(self.event.date, self.event.start_time).replace(
            tzinfo=datetime.timezone.utc
        )
        expected_end = (start_dt + self.event.duration).isoformat()
        calculated_end = serializer.get_end(self.event)
        self.assertEqual(calculated_end, expected_end)

    def test_partial_update_end(self):
        """Test that partial updates do not affect the calculated end time."""
        serializer = EventCalendarSerializer(
            self.event, data={"title": "Updated Title"}, partial=True
        )
        self.assertTrue(serializer.is_valid())
        updated_instance = serializer.save()

        # Recalculate expected end
        start_dt = datetime.datetime.combine(updated_instance.date, updated_instance.start_time).replace(
            tzinfo=datetime.timezone.utc
        )
        expected_end = (start_dt + updated_instance.duration).isoformat()
        self.assertEqual(serializer.get_end(updated_instance), expected_end)

    def test_read_only_fields(self):
        """Ensure read-only fields `start` & `end` can't be set."""
        # Attempt to override read-only fields
        invalid_data = {
            "start": "2025-01-30T12:00:00Z",
            "end": "2025-01-30T14:00:00Z"
        }
        serializer = EventCalendarSerializer(self.event, data=invalid_data, partial=True)
        self.assertTrue(
            serializer.is_valid(),
            "Serializer should ignore read-only fields in partial updates",
        )
        instance = serializer.save()

        # The model date & time remain unchanged
        start_dt = datetime.datetime.combine(instance.date, instance.start_time).replace(
            tzinfo=datetime.timezone.utc
        )
        self.assertNotEqual(
            start_dt.isoformat(), invalid_data["start"], "Read-only 'start' should remain unchanged."
        )