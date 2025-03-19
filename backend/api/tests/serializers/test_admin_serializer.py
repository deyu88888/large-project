from django.test import TestCase
from api.models import User
from api.serializers import UserSerializer
from rest_framework.exceptions import ValidationError

class AdminSerializerTestCase(TestCase):
    def setUp(self):
        self.admin_data = {
            "username": "unique_admin",
            "password": "Password123",
            "first_name": "Admin",
            "last_name": "User",
            "email": "unique_email@example.com",
            "role": "admin",
        }
        self.admin = User.objects.create_user(
            username="existing_admin",
            password="Password123",
            first_name="Admin",
            last_name="User",
            email="existing_email@example.com",
            role="admin",
        )

    def test_admin_serialization(self):
        serializer = UserSerializer(instance=self.admin)
        data = serializer.data
        self.assertEqual(data["username"], self.admin.username)
        self.assertEqual(data["role"], "admin")

    def test_admin_deserialization(self):
        serializer = UserSerializer(data=self.admin_data)
        self.assertTrue(serializer.is_valid())
        admin = serializer.save()
        self.assertEqual(admin.role, "admin")
        self.assertFalse(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertTrue(admin.check_password(self.admin_data["password"]))

    def test_duplicate_email_validation(self):
        """Test that duplicate email validation works."""
        self.admin_data["email"] = self.admin.email
        serializer = UserSerializer(data=self.admin_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertEqual(str(serializer.errors["email"][0]), "This field must be unique.")

    def test_duplicate_username_validation(self):
        """Test that duplicate username validation works."""
        self.admin_data["username"] = self.admin.username
        serializer = UserSerializer(data=self.admin_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(str(serializer.errors["username"][0]), "This field must be unique.")

    def test_admin_update(self):
        """Test updating admin fields using serializer."""
        update_data = {"first_name": "Updated", "last_name": "Admin"}
        serializer = UserSerializer(instance=self.admin, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_admin = serializer.save()

        self.assertEqual(updated_admin.first_name, "Updated")
        self.assertEqual(updated_admin.last_name, "Admin")

    # def test_admin_role_cannot_be_changed(self):
    #     """Test that an admin's role cannot be changed to student."""
    #     update_data = {"role": "student"}
    #     serializer = UserSerializer(instance=self.admin, data=update_data, partial=True)
    #     self.assertTrue(serializer.is_valid(), serializer.errors)
    #     updated_admin = serializer.save()

    #     # role 应该仍然是 admin
    #     self.assertEqual(updated_admin.role, "admin")
