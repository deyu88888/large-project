from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from api.models import User


class TestAdminListView(APITestCase):
    def setUp(self):
        self.super_admin = User.objects.create_user(
            username="superadmin",
            email="superadmin@example.com",
            password="superpass",
            role="admin",
            is_super_admin=True,
            is_staff=True,
        )

        self.admin = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="adminpass",
            role="admin",
            is_super_admin=False,
            is_staff=True,
        )

        self.client = APIClient()
        self.url = "/api/admin/admin"

    def test_get_admins_authenticated(self):
        self.client.force_authenticate(user=self.super_admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_get_admins_unauthenticated(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_admin_as_super_admin(self):
        self.client.force_authenticate(user=self.super_admin)
        data = {
            "username": "newadmin",
            "email": "newadmin@example.com",
            "password": "newadminpass",
            "first_name": "New",
            "last_name": "Admin"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["admin"]["username"], "newadmin")

    def test_create_admin_as_non_super_admin(self):
        self.client.force_authenticate(user=self.admin)
        data = {
            "username": "unauthorizedadmin",
            "email": "unauth@example.com",
            "password": "unauthpass",
            "first_name": "Not",
            "last_name": "Allowed"
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)