import json
import time
from django.utils import timezone
from django.test import TestCase
from rest_framework import status

from api.models import User, Student, Society, Event, ActivityLog
from api.views import StudentUpdateUndoHandler


class TestStudentUpdateUndoHandler(TestCase):
    def setUp(self):
        self.admin = User.objects.create(
            username="admin",
            email="admin@example.com",
            role="admin",
            first_name="Admin",
            last_name="User"
        )

        self.student = Student.objects.create(
            username="student1",
            email="student1@example.com",
            first_name="Old",
            last_name="Name",
            is_active=True,
            major="Physics"
        )

        self.society = Society.objects.create(
            name="Science Club",
            approved_by=self.admin,
            president=self.student
        )

        self.event = Event.objects.create(
            title="Science Fair",
            location="Auditorium"
        )

        self.student.societies.add(self.society)
        self.student.attended_events.add(self.event)

        self.original_data = {
            "username": "updated_student",
            "email": "updated_student@example.com",
            "first_name": "Updated",
            "last_name": "Student",
            "is_active": False,
            "major": "Engineering",
            "societies": [self.society.id],
            "attended_events": [self.event.id],
            "president_of": self.society.id
        }

        self.log_entry = ActivityLog.objects.create(
            action_type="Update",
            target_type="Student",
            target_id=self.student.id,
            target_name=self.student.username,
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Testing undo",
            expiration_date=timezone.now() + timezone.timedelta(days=7),
            original_data=json.dumps(self.original_data)
        )

    def test_successful_student_update_undo(self):
        handler = StudentUpdateUndoHandler()
        response = handler.handle(json.loads(self.log_entry.original_data), self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Student update undone successfully", response.data["message"])

        student = Student.objects.get(id=self.student.id)
        self.assertEqual(student.username, "updated_student")
        self.assertEqual(student.major, "Engineering")
        self.assertIn(self.society, student.societies.all())
        self.assertIn(self.event, student.attended_events.all())
        self.assertEqual(student.first_name, "Updated")

        self.assertFalse(ActivityLog.objects.filter(id=self.log_entry.id).exists())

    def test_student_not_found(self):
        replacement = Student.objects.create(
            username="replacement",
            email="replacement@example.com",
            first_name="Alt",
            last_name="Student"
        )
        self.society.president = replacement
        self.society.save()

        self.student.delete()

        handler = StudentUpdateUndoHandler()
        response = handler.handle(json.loads(self.log_entry.original_data), self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Student not found", response.data["error"])


    def test_missing_original_data(self):
        handler = StudentUpdateUndoHandler()
        response = handler.handle(None, self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No original data found", response.data["error"])

    def test_invalid_society_and_event_ids(self):
        self.original_data["societies"] = [99999]
        self.original_data["attended_events"] = [88888]
        self.original_data["president_of"] = 77777
        self.log_entry.original_data = json.dumps(self.original_data)
        self.log_entry.save()

        handler = StudentUpdateUndoHandler()
        response = handler.handle(json.loads(self.log_entry.original_data), self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        student = Student.objects.get(id=self.student.id)
        self.assertEqual(student.major, "Engineering")  # Value still restored
        self.assertEqual(student.societies.count(), 0)
        self.assertEqual(student.attended_events.count(), 0)

    def test_error_handling_on_corrupt_data(self):
        handler = StudentUpdateUndoHandler()
        response = handler.handle("invalid-data", self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn("Failed to undo student update", response.data["error"])