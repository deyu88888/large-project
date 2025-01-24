from django.test import TestCase
from api.models import Admin
from api.serializers import AdminSerializer
from rest_framework.exceptions import ValidationError

class AdminSerializerTestCase(TestCase):
    def setUp(self):
        self.admin_data = {
            "username": "unique_admin",
            "password": "Password123",
            "first_name": "Admin",
            "last_name": "User",
            "email": "unique_email@example.com",
        }
        self.admin = Admin.objects.create_user(
            username="existing_admin",
            password="Password123",
            first_name="Admin",
            last_name="User",
            email="existing_email@example.com",
            role="admin",
        )

    def test_admin_serialization(self):
        serializer = AdminSerializer(instance=self.admin)
        data = serializer.data
        self.assertEqual(data["username"], self.admin.username)
        self.assertEqual(data["role"], "admin")

    def test_admin_deserialization(self):
        serializer = AdminSerializer(data=self.admin_data)
        self.assertTrue(serializer.is_valid())
        admin = serializer.save()
        self.assertEqual(admin.role, "admin")
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.check_password(self.admin_data["password"]))