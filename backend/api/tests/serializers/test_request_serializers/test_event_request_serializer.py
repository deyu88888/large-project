from datetime import timedelta
import json
from types import SimpleNamespace

from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from rest_framework import serializers
from api.models import Event, Society, User, Student, EventRequest, EventModule
from api.serializers import EventRequestSerializer


class EventRequestSerializerTestCase(TestCase):
    """Full coverage tests for EventRequestSerializer"""

    def setUp(self):
        self.factory = APIRequestFactory()

        self.admin = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            password="adminpassword",
            role="admin"
        )

        self.student = Student.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Student",
            last_name="One",
            password="studentpassword",
            major="Physics"
        )

        self.society = Society.objects.create(
            name="Robotics Club",
            president=self.student,
            approved_by=self.admin
        )

        self.student.president_of = self.society
        self.student.save()

        self.event = Event.objects.create(
            title="Old Event",
            main_description="Old Description",
            hosted_by=self.society,
            location="Old Location"
        )

        self.event_request = EventRequest.objects.create(
            event=self.event,
            from_student=self.student,
            hosted_by=self.society,
            intent="CreateEve",
            approved=False
        )

        self.request = self.factory.post("/")
        self.request.user = self.student
        now = timezone.now()
        future_time = (now + timedelta(hours=1)).time().replace(microsecond=0)
        future_date = (now + timedelta(days=1)).date()

        self.request.data = {
            "title": "New Event",
            "main_description": "Big fun",
            "location": "Main Hall",
            "date": future_date.isoformat(),
            "start_time": future_time.strftime("%H:%M:%S"),
            "duration": "01:30:00",
            "extra_modules": json.dumps([
                {"textValue": "Extra A", "type": "subtitle"}
            ]),
            "participant_modules": json.dumps([
                {"textValue": "Participant A", "type": "description"}
            ])
        }

    def test_serializer_creates_event_and_modules(self):
        serializer = EventRequestSerializer(data={}, context={"request": self.request, "hosted_by": self.society})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        event_request = serializer.save()
        event = event_request.event
        self.assertEqual(event.title, "New Event")
        self.assertEqual(event.duration, timedelta(hours=1, minutes=30))
        self.assertEqual(event.status, "Pending")
        self.assertEqual(EventModule.objects.filter(event=event).count(), 2)

    def test_serializer_rejects_invalid_duration(self):
        self.request.data["duration"] = "abc"
        serializer = EventRequestSerializer(data={}, context={"request": self.request, "hosted_by": self.society})
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(serializers.ValidationError) as ctx:
            serializer.save()
        self.assertIn("duration", str(ctx.exception))

    def test_serializer_rejects_invalid_json_modules(self):
        self.request.data["extra_modules"] = "[invalid json"
        serializer = EventRequestSerializer(data={}, context={"request": self.request, "hosted_by": self.society})
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(serializers.ValidationError) as ctx:
            serializer.save()
        self.assertIn("extra_modules", str(ctx.exception))

    def test_serializer_rejects_if_not_student(self):
        self.request.user = self.admin
        serializer = EventRequestSerializer(data={}, context={"request": self.request, "hosted_by": self.society})
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(serializers.ValidationError) as ctx:
            serializer.save()
        self.assertIn("Only students can request", str(ctx.exception))

    def test_serializer_rejects_if_no_hosted_by(self):
        serializer = EventRequestSerializer(data={}, context={"request": self.request})
        self.assertTrue(serializer.is_valid())
        with self.assertRaises(serializers.ValidationError) as ctx:
            serializer.save()
        self.assertIn("hosted_by", str(ctx.exception))

    def test_serializer_update_resets_modules_and_approval(self):
        EventModule.objects.create(
            event=self.event,
            type="description",
            text_value="Old content",
            is_participant_only=False
        )

        self.request.data["title"] = "Updated Title"
        self.request.data["duration"] = "02:00:00"
        serializer = EventRequestSerializer(
            instance=self.event_request,
            data={},
            context={"request": self.request},
            partial=True
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        self.event.refresh_from_db()
        self.assertEqual(self.event.title, "Updated Title")
        self.assertEqual(self.event.duration, timedelta(hours=2))
        self.assertEqual(self.event.status, "Pending")
        self.assertEqual(self.event.modules.count(), 2)  # replaced by new modules
        self.event_request.refresh_from_db()
        self.assertIsNone(self.event_request.approved)

    def test_get_event_returns_id(self):
        serializer = EventRequestSerializer(instance=self.event_request)
        self.assertEqual(serializer.data["event"], self.event.id)

    def test_get_event_returns_none(self):
        dummy_obj = SimpleNamespace(event=None)
        serializer = EventRequestSerializer()
        self.assertIsNone(serializer.get_event(dummy_obj))
