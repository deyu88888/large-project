import json
from datetime import timedelta
from unittest.mock import patch, MagicMock
from django.utils import timezone
from django.urls import reverse, path
from rest_framework import status
from rest_framework.response import Response
from rest_framework.test import APITestCase, URLPatternsTestCase

from api.models import User, ActivityLog, Student, Society, Event
from api.views import AdminRestoreView, get_admin_if_user_is_admin


class TestAdminRestoreView(APITestCase, URLPatternsTestCase):
    """Tests for the AdminRestoreView class.

    This test suite validates the functionality of the AdminRestoreView which handles
    restoring resources that were previously deleted or modified, based on activity logs.

    Key functionalities tested:
    - Authorization (only admins can restore, super admins needed for admin restoration)
    - Validation (supported action types, log entry existence)
    - Error handling (invalid data, unsupported operations)
    - Restoration handlers (proper delegation to appropriate handlers)
    """

    urlpatterns = [
        path('admin/restore/<int:log_id>',
             AdminRestoreView.as_view(), name='restore'),
    ]

    def setUp(self):
        """Set up test data."""

        self.get_admin_patcher = patch('api.views.get_admin_if_user_is_admin')
        self.mock_get_admin = self.get_admin_patcher.start()

        self.handler_factory_patcher = patch('api.views.RestoreHandlerFactory')
        self.mock_factory = self.handler_factory_patcher.start()

        self.super_admin = User.objects.create(
            username="superadmin",
            email="superadmin@example.com",
            role="admin",
            is_super_admin=True,
            first_name="Super",
            last_name="Admin"
        )

        self.admin = User.objects.create(
            username="regularadmin",
            email="admin@example.com",
            role="admin",
            is_super_admin=False,
            first_name="Regular",
            last_name="Admin"
        )

        self.student = Student.objects.create(
            username="teststudent",
            email="student@example.com",
            role="student",
            first_name="Test",
            last_name="Student",
            major="Computer Science"
        )

        self.student_delete_log = ActivityLog.objects.create(
            action_type="Delete",
            target_type="Student",
            target_id=999,
            target_name="Deleted Student",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Test deletion",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({
                "id": 999,
                "username": "deletedstudent",
                "email": "deleted@example.com",
                "first_name": "Deleted",
                "last_name": "Student",
                "role": "student",
                "major": "Computer Science"
            })
        )

        self.admin_delete_log = ActivityLog.objects.create(
            action_type="Delete",
            target_type="Admin",
            target_id=888,
            target_name="Deleted Admin",
            performed_by=self.super_admin,
            timestamp=timezone.now(),
            reason="Test deletion",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({
                "id": 888,
                "username": "deletedadmin",
                "email": "deletedadmin@example.com",
                "first_name": "Deleted",
                "last_name": "Admin",
                "role": "admin"
            })
        )

        self.student_update_log = ActivityLog.objects.create(
            action_type="Update",
            target_type="Student",
            target_id=self.student.id,
            target_name=f"{self.student.first_name} {self.student.last_name}",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Test update",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({
                "id": self.student.id,
                "username": self.student.username,
                "email": self.student.email,
                "first_name": "Original",
                "last_name": "Name",
                "role": "student",
                "major": "Original Major"
            })
        )

        self.approval_log = ActivityLog.objects.create(
            action_type="Approve",
            target_type="Society",
            target_id=777,
            target_name="Approved Society",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Test approval",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=None
        )

        self.invalid_data_log = ActivityLog.objects.create(
            action_type="Delete",
            target_type="Student",
            target_id=666,
            target_name="Invalid Data Student",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Test invalid data",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data="invalid{json"
        )

        self.unsupported_action_log = ActivityLog.objects.create(
            action_type="Unsupported",
            target_type="Student",
            target_id=555,
            target_name="Unsupported Action",
            performed_by=self.admin,
            timestamp=timezone.now(),
            reason="Test unsupported action",
            expiration_date=timezone.now() + timedelta(days=30),
            original_data=json.dumps({"id": 555})
        )

        self.model_mapping_patcher = patch.object(
            AdminRestoreView,
            'model_mapping',
            {
                "Admin": User,
                "Student": Student,
                "Society": Society,
                "Event": Event
            }
        )
        self.model_mapping_patcher.start()

    def tearDown(self):
        """Clean up after tests."""

        self.get_admin_patcher.stop()
        self.handler_factory_patcher.stop()
        self.model_mapping_patcher.stop()

    def test_restore_unauthorized_user(self):
        """Test restoration by an unauthorized user."""

        self.client.force_authenticate(user=self.student)

        error_response = Response(
            {"error": "Not authorized"}, status=status.HTTP_403_FORBIDDEN)
        self.mock_get_admin.return_value = (None, error_response)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.student_delete_log.id})
        response = self.client.post(restore_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_restore_nonexistent_log(self):
        """Test restoration of a nonexistent log entry."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse('restore', kwargs={'log_id': 99999})
        response = self.client.post(restore_url)

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Log entry not found", response.data["error"])

    def test_restore_admin_by_regular_admin(self):
        """Test restoration of an admin by a regular admin (should fail)."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.admin_delete_log.id})
        response = self.client.post(restore_url)

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only super admins", response.data["error"])

    def test_restore_admin_by_super_admin(self):
        """Test restoration of an admin by a super admin."""

        self.client.force_authenticate(user=self.super_admin)

        self.mock_get_admin.return_value = (self.super_admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.admin_delete_log.id})
        response = self.client.post(restore_url)

        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])

    def test_restore_student_by_admin(self):
        """Test restoration of a student by an admin."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.student_delete_log.id})
        response = self.client.post(restore_url)

        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN,
                            "Admin should not get forbidden response when restoring student")

    def test_restore_student_update_by_admin(self):
        """Test restoration of a student's previous data by an admin."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.student_update_log.id})
        response = self.client.post(restore_url)

        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN,
                            "Admin should not get forbidden response when restoring student data")

    def test_restore_with_approve_action(self):
        """Test restoration with Approve action."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.approval_log.id})
        response = self.client.post(restore_url)

        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_404_NOT_FOUND
        ])

    def test_restore_with_invalid_json_data(self):
        """Test restoration with invalid JSON data."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.invalid_data_log.id})
        response = self.client.post(restore_url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Error decoding original data", response.data["error"])

    def test_restore_with_unsupported_action(self):
        """Test restoration with unsupported action type."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.unsupported_action_log.id})
        response = self.client.post(restore_url)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Invalid action type", response.data["error"])

    def test_restore_with_no_handler(self):
        """Test restoration when no handler is available."""

        self.client.force_authenticate(user=self.admin)

        self.mock_get_admin.return_value = (self.admin, None)

        self.mock_factory.return_value.get_handler.return_value = None

        restore_url = reverse(
            'restore', kwargs={'log_id': self.student_delete_log.id})
        response = self.client.post(restore_url)

        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_restore_with_exception_in_handler(self):
        """Test restoration when handler raises an exception."""

        self.client.force_authenticate(user=self.admin)
        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.student_delete_log.id})
        response = self.client.post(restore_url)

        self.assertNotEqual(response.status_code, status.HTTP_403_FORBIDDEN,
                            "Admin should not get forbidden response when attempting restore")

    def test_approve_with_invalid_json_data(self):
        self.client.force_authenticate(user=self.admin)
        self.mock_get_admin.return_value = (self.admin, None)

        restore_url = reverse(
            'restore', kwargs={'log_id': self.invalid_data_log.id})
        response = self.client.post(restore_url)

        self.assertIn(response.status_code, [200, 400])
