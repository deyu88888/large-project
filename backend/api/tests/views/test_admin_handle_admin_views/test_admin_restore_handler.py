from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.response import Response
from rest_framework import status
from api.views_files.admin_handle_admin_views import AdminRestoreHandler
from api.models import ActivityLog
from unittest.mock import MagicMock, patch

User = get_user_model()


class AdminRestoreHandlerTests(TestCase):
    def setUp(self):
        self.handler = AdminRestoreHandler()
        self.original_data = {
            'username': 'restored_admin',
            'email': 'restored@example.com',
            'first_name': 'Restored',
            'last_name': 'Admin',
            'role': 'admin',
            'is_super_admin': True,
            'groups': [],
            'user_permissions': [],
            'following': [],
            'follower': []
        }

        self.log_entry = MagicMock(spec=ActivityLog)
        self.log_entry.delete = MagicMock()

    @patch('api.views_files.admin_handle_admin_views.set_many_to_many_relationship')
    def test_successful_restore_admin_user(self, mock_set_m2m):
        response = self.handler.handle(self.original_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("Admin user restored successfully", response.data["message"])

        user = User.objects.get(username='restored_admin')
        self.assertEqual(user.email, 'restored@example.com')
        self.assertTrue(user.is_super_admin)
        self.assertTrue(user.check_password("TemporaryPassword123!"))

        self.log_entry.delete.assert_called_once()

        self.assertEqual(mock_set_m2m.call_count, 4)


    def test_restore_fails_due_to_invalid_data(self):
        broken_data = self.original_data.copy()
        del broken_data["email"]
        del broken_data["username"]

        response = self.handler.handle(broken_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["error"], "Validation failed")

        self.log_entry.delete.assert_not_called()


    @patch('api.views_files.admin_handle_admin_views.set_many_to_many_relationship')
    def test_restore_sets_default_super_admin_false(self, mock_set_m2m):
        minimal_data = {
            'username': 'basic_admin',
            'email': 'basic@example.com',
            'first_name': 'Basic',
            'last_name': 'Admin',
        }

        response = self.handler.handle(minimal_data, self.log_entry)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(username='basic_admin')
        self.assertFalse(user.is_super_admin)