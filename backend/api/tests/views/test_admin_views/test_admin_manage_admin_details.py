import json
from datetime import timedelta
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User, ActivityLog
from api.serializers import AdminSerializer
from django.urls import reverse


class TestAdminManageAdminDetailsView(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="password",
            role="admin",
            is_super_admin=True
        )

        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="password",
            role="admin"
        )

        self.other_admin = User.objects.create_user(
            username="otheradmin",
            email="otheradmin@example.com",
            password="password",
            role="admin"
        )

        self.client = APIClient()

    def test_get_admin_details_success(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("manage_admin_details_admin",  args=[self.other_admin.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["id"], self.other_admin.id)

    def test_get_admin_details_forbidden_if_not_admin(self):
        non_admin = User.objects.create_user(
            username="student",
            email="student@example.com",
            password="password",
            role="student"
        )
        self.client.force_authenticate(user=non_admin)
        url = reverse("manage_admin_details_admin", args=[self.other_admin.id])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_admin_details_not_found(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("manage_admin_details_admin", args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_admin_success(self):
        self.client.force_authenticate(user=self.super_admin)
        url = reverse("manage_admin_details_admin", args=[self.admin_user.id])
        payload = {
            "first_name": "Updated",
            "last_name": "Admin",
            "reason": "Fix name"
        }
        response = self.client.patch(url, data=payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.admin_user.refresh_from_db()
        self.assertEqual(self.admin_user.first_name, "Updated")
        self.assertTrue(ActivityLog.objects.filter(target_id=self.admin_user.id, action_type="Update").exists())

    def test_patch_admin_forbidden_if_not_superadmin(self):
        self.client.force_authenticate(user=self.admin_user)
        url = reverse("manage_admin_details_admin", args=[self.other_admin.id])
        response = self.client.patch(url, data={"first_name": "Hacker"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_patch_admin_not_found(self):
        self.client.force_authenticate(user=self.super_admin)
        url = reverse("manage_admin_details_admin", args=[9999])
        response = self.client.patch(url, data={"first_name": "Ghost"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_patch_admin_invalid_data(self):
        self.client.force_authenticate(user=self.super_admin)
        url = reverse("manage_admin_details_admin", args=[self.admin_user.id])
        response = self.client.patch(url, data={"email": "not-an-email"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)