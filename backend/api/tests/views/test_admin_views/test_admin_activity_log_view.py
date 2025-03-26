from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User, ActivityLog
from django.utils import timezone
from datetime import timedelta


class TestAdminActivityLogView(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="superpass",
            role="admin",
            is_super_admin=True,
            is_staff=True
        )

        self.regular_user = User.objects.create_user(
            username="regularuser",
            email="user@example.com",
            password="userpass",
            role="student"
        )

        self.activity_log = ActivityLog.objects.create(
            action_type="Update",
            target_type="Society",
            target_id=123,
            target_name="Some Society",
            performed_by=self.super_admin,
            reason="Admin updated something important.",
            timestamp=timezone.now() - timedelta(hours=1)
        )

        self.client = APIClient()
        self.get_url = "/api/admin/activity-log"  
        self.delete_url = f"/api/admin/delete-activity-log/{self.activity_log.id}"

    def test_get_activity_logs_authenticated(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_activity_logs_unauthenticated(self):
        response = self.client.get(self.get_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_delete_activity_log_authenticated_super_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.delete(self.delete_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Activity log deleted successfully.")

    def test_delete_activity_log_unauthenticated(self):
        response = self.client.delete(self.delete_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)