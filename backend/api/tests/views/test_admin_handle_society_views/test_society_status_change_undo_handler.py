from datetime import timedelta
from django.test import TestCase
from django.utils import timezone
from rest_framework import status
from api.models import User, Student, SocietyRequest, ActivityLog
from api.views import SocietyStatusChangeUndoHandler

class TestSocietyStatusChangeUndoHandler(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="adminpass",
            role="admin",
        )
        self.student_president = Student.objects.create_user(
            username="president",
            email="president@example.com",
            password="prespass"
        )
        self.society_request = SocietyRequest.objects.create(
            name="Tech Society",
            description="A society about tech",
            president=self.student_president,
            category="Technology"
        )
        self.log_entry = ActivityLog.objects.create(
            action_type="Approve",
            target_type="Society",
            target_id=self.society_request.id,
            target_name=self.society_request.name,
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Initial approval",
            expiration_date=timezone.now() + timedelta(days=30),
        )

    def test_society_status_undo_success(self):
        handler = SocietyStatusChangeUndoHandler()
        response = handler.handle({}, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.society_request.refresh_from_db()
        self.assertIn("message", response.data)
        self.assertEqual(
            response.data["message"],
            "Society status change undone successfully. Status set back to Pending."
        )
        self.assertFalse(ActivityLog.objects.filter(id=self.log_entry.id).exists())

    def test_society_status_undo_not_found(self):
        self.society_request.delete()
        handler = SocietyStatusChangeUndoHandler()
        response = handler.handle({}, self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)