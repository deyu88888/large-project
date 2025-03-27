import json
from datetime import timedelta
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.response import Response
from api.models import User, Student, Society, Event, ActivityLog
from api.views import EventUpdateUndoHandler


class TestEventUpdateUndoHandler(TestCase):
    def setUp(self):
        self.admin = User.objects.create(
            username="adminuser",
            email="admin@example.com",
            role="admin",
            first_name="Admin",
            last_name="User",
        )

        self.president = Student.objects.create(
            username="president1",
            email="president1@example.com",
            first_name="Pres",
            last_name="Ident",
            role="student",
            major="CS"
        )

        self.society = Society.objects.create(
            name="Coding Society",
            description="A society for coders",
            president=self.president,
            approved_by=self.admin
        )

        future_date = timezone.now().date() + timedelta(days=2)
        future_time = (timezone.now() + timedelta(hours=2)).time()

        self.event = Event.objects.create(
            title="Hackathon",
            main_description="A full day hackathon",
            location="Room 101",
            hosted_by=self.society,
            status="Approved",
            date=future_date,
            start_time=future_time,
        )

        self.original_data = {
            "id": self.event.id,
            "title": "Hackathon",
            "main_description": "A full day hackathon",
            "location": "Room 101",
            "hosted_by": self.society.id,
            "status": "Pending"
        }

        self.log_entry = ActivityLog.objects.create(
            action_type="Update",
            target_type="Event",
            target_id=self.event.id,
            target_name=self.event.title,
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Undoing update",
            expiration_date=timezone.now() + timedelta(days=10),
            original_data=json.dumps(self.original_data)
        )

    def test_event_update_undo_success(self):
        handler = EventUpdateUndoHandler()
        data = json.loads(self.log_entry.original_data)
        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Event update undone successfully", response.data["message"])

        self.event.refresh_from_db()
        self.assertEqual(self.event.status, "Pending")
        self.assertFalse(ActivityLog.objects.filter(id=self.log_entry.id).exists())

    def test_event_not_found(self):
        self.log_entry.target_id = 9999
        self.log_entry.target_name = "Fake Event"
        self.log_entry.original_data = json.dumps({
            "id": 9999,
            "title": "Fake Event",
            "main_description": "Should not exist",
            "location": "Nowhere",
            "status": "Pending"
        })
        self.log_entry.save()

        handler = EventUpdateUndoHandler()
        data = json.loads(self.log_entry.original_data)
        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Event not found", response.data["error"])

    def test_handle_exception(self):
        handler = EventUpdateUndoHandler()
        data = "not-a-valid-dict"
        response = handler.handle(data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to undo Event update", response.data["error"])