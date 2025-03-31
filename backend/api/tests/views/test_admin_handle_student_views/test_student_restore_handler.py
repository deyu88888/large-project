import json
import time
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from api.models import User, Student, Society, Event, ActivityLog
from api.views import StudentRestoreHandler


class TestStudentRestoreHandler(TestCase):

    def setUp(self):
        self.admin_user = User.objects.create(
            username="adminuser",
            email="admin@example.com",
            role="admin",
            first_name="Admin",
            last_name="User"
        )

        self.timestamp = int(time.time())
        self.original_data = {
            "id": 1001,
            "username": f"student_{self.timestamp}",
            "email": f"student_{self.timestamp}@example.com",
            "first_name": "Test",
            "last_name": "Student",
            "is_active": True,
            "role": "student",
            "major": "Engineering"
        }

        self.log_entry = ActivityLog.objects.create(
            action_type="Delete",
            target_type="Student",
            target_id=1001,
            target_name="Test Student",
            performed_by=self.admin_user,
            timestamp=timezone.now(),
            reason="Deleted for testing",
            expiration_date=timezone.now() + timezone.timedelta(days=7),
            original_data=json.dumps(self.original_data)
        )


    def test_restore_new_student(self):
        handler = StudentRestoreHandler()
        response = handler.handle(json.loads(self.log_entry.original_data), self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(Student.objects.filter(email=self.original_data["email"]).exists())

    def test_restore_existing_user_by_email(self):
        User.objects.create(
            username=f"student_{self.timestamp}_alt",
            email=self.original_data["email"],
            first_name="Alt",
            last_name="User"
        )
        handler = StudentRestoreHandler()
        response = handler.handle(json.loads(self.log_entry.original_data), self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


    def test_restore_with_invalid_foreign_keys(self):
        self.original_data.update({
            "societies": [999],
            "attended_events": [999],
            "president_of": 999
        })
        self.log_entry.original_data = json.dumps(self.original_data)
        self.log_entry.save()

        handler = StudentRestoreHandler()
        response = handler.handle(json.loads(self.log_entry.original_data), self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_restore_error_handling(self):
        handler = StudentRestoreHandler()
        response = handler.handle("invalid_data", self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)