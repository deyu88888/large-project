from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from api.models import User
from api.serializers import UserSerializer

User = get_user_model()  # Assuming you use Django's custom user model


class AdminViewTests(APITestCase):
    def setUp(self):
        """
        Set up test users and authentication.
        """
        self.admin_user = User.objects.create_superuser(
            username="admin_user",
            email="admin@example.com",
            password="securepassword"
        )
        self.client.force_authenticate(user=self.admin_user)

        self.admin2 = User.objects.create_superuser(
            username="admin2",
            email="admin2@example.com",
            password="securepassword"
        )

        self.url = reverse("admin")  

    def test_get_admins(self):
        """
        Ensure authenticated users can retrieve the list of admins.
        """
        response = self.client.get(self.url)
        admins = User.get_admins().all()
        expected_data = UserSerializer(admins, many=True).data

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), expected_data)

    def test_create_admin(self):
        """
        Ensure an admin can be created via POST request.
        """
        new_admin_data = {
            "username": "new_admin",
            "email": "newadmin@example.com",
            "password": "securepassword"
        }
        response = self.client.post(self.url, data=new_admin_data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("Admin registered successfully.", response.json()["message"])
        self.assertTrue(User.get_admins().filter(username="new_admin").exists())

    def test_unauthorized_access(self):
        """
        Ensure unauthenticated users cannot access the endpoint.
        """
        self.client.force_authenticate(user=None)   
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)