from django.test import TestCase
from api.models import User
from api.serializers import UserSerializer
from rest_framework.exceptions import ValidationError


class UserSerializerTestCase(TestCase):
    def setUp(self):
        self.user_data = {
            "username": "unique_username",
            "password": "Password123",
            "first_name": "John",
            "last_name": "Doe",
            "email": "unique_email@example.com",
            "is_active": True,
            "role": "student",
        }

        self.user = User.objects.create_user(
            username="existing_user",
            password="Password123",
            email="existing_email@example.com",
            first_name="Existing",
            last_name="User",
            role="student",
        )

    def test_user_serialization(self):
        serializer = UserSerializer(instance=self.user)
        data = serializer.data
        self.assertEqual(data["username"], self.user.username)
        self.assertEqual(data["email"], self.user.email)
        self.assertNotIn("password", data)  # Password should not be included in serialized data

    def test_user_deserialization(self):
        serializer = UserSerializer(data=self.user_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, self.user_data["username"])
        self.assertTrue(user.check_password(self.user_data["password"]))

    def test_user_invalid_data(self):
        invalid_data = self.user_data.copy()
        invalid_data["username"] = "!"  # Invalid character in username
        serializer = UserSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)