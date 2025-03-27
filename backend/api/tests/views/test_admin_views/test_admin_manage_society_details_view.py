from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import User, Student, Society


class TestAdminManageSocietyDetailsView(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="superpass",
            role="admin",
            is_super_admin=True,
            is_staff=True,
        )

        self.student = Student.objects.create_user(
            username="student",
            email="student@example.com",
            password="studentpass",
            role="student",
            major="Computer Science"
        )

        self.society = Society.objects.create(
            name="Science Society",
            description="Focuses on science",
            president=self.student,
            approved_by=self.super_admin,
            status="Approved"
        )

        self.url = f"/api/admin/manage-society/{self.society.id}"

    def test_get_society_authenticated(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], "Science Society")

    def test_get_society_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_patch_society_authenticated(self):
        self.client.force_authenticate(user=self.super_admin)
        data = {
            "description": "Updated science society description",
            "reason": "Improve description"
        }
        response = self.client.patch(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["data"]["description"], "Updated science society description")

    def test_get_nonexistent_society(self):
        self.client.force_authenticate(user=self.super_admin)
        bad_url = "/api/admin/manage-society/99999"
        response = self.client.get(bad_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)