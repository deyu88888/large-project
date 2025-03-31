from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch
from rest_framework import status
from api.models import User, ActivityLog
from api.views_files.admin_handle_admin_views import AdminUpdateUndoHandler
from datetime import timedelta
import json


class AdminUpdateUndoHandlerTests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="updated_admin",
            email="admin@example.com",
            first_name="Updated",
            last_name="Admin",
            role="admin",
            is_super_admin=False,
        )

        self.performer = User.objects.create_user(
            username="performer",
            email="mod@example.com",
            role="admin",
        )

        self.log_entry = ActivityLog.objects.create(
            action_type="Update",
            target_type="Admin",
            target_id=self.admin.id,
            target_name=self.admin.email,
            performed_by=self.performer,
            reason="Fix incorrect name",
            original_data=json.dumps({
                "username": "original_admin",
                "email": "admin@example.com",
                "first_name": "Original",
                "last_name": "Name",
                "role": "admin",
                "is_super_admin": False,
                "groups": [],
                "user_permissions": [],
                "following": [],
                "follower": []
            }),
            timestamp=timezone.now(),
            expiration_date=timezone.now() + timedelta(days=30)
        )

        self.handler = AdminUpdateUndoHandler()


    def test_successful_undo(self):
        response = self.handler.handle(json.loads(self.log_entry.original_data), self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Admin update undone successfully!", response.data["message"])

        updated_admin = User.objects.get(id=self.admin.id)
        self.assertEqual(updated_admin.first_name, "Original")
        self.assertEqual(updated_admin.last_name, "Name")
        self.assertEqual(updated_admin.username, "original_admin")

        self.assertFalse(ActivityLog.objects.filter(id=self.log_entry.id).exists())


    def test_admin_user_not_found(self):
        self.log_entry.target_id = 99999
        self.log_entry.target_name = "nonexistent@example.com"
        self.log_entry.save()

        response = self.handler.handle(json.loads(self.log_entry.original_data), self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


    def test_user_is_no_longer_admin(self):
        self.admin.role = "student"
        self.admin.is_super_admin = False
        self.admin.save()

        response = self.handler.handle(json.loads(self.log_entry.original_data), self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("User is no longer an admin", response.data["error"])

    def test_handle_with_invalid_data_raises_exception(self):
        with patch('api.views_files.admin_handle_admin_views.User.save', side_effect=Exception("Simulated error")):
            response = self.handler.handle(json.loads(self.log_entry.original_data), self.log_entry)
            self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
            self.assertIn("Failed to undo Admin update", response.data["error"])

    def test_many_to_many_fields_are_restored(self):
        data = json.loads(self.log_entry.original_data)
        data['groups'] = []
        data['user_permissions'] = []
        data['following'] = []
        data['follower'] = []

        response = self.handler.handle(data, self.log_entry)
        self.assertEqual(response.status_code, status.HTTP_200_OK)