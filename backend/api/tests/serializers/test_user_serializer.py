from django.test import TestCase
from api.models import User
from api.serializers import UserSerializer


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
        self.assertNotIn("password", data)

    def test_user_deserialization(self):
        serializer = UserSerializer(data=self.user_data)
        self.assertTrue(serializer.is_valid())
        user = serializer.save()
        self.assertEqual(user.username, self.user_data["username"])
        self.assertTrue(user.check_password(self.user_data["password"]))

    def test_get_is_following(self):
        """Test if get_is_following returns the correct boolean value."""
        another_user = User.objects.create_user(
            username="followed_user", password="Password123", email="followed@example.com"
        )
        self.user.following.add(another_user)

        request = self.client.get("/")
        request.user = self.user

        serializer = UserSerializer(instance=another_user, context={"request": request})
        self.assertTrue(serializer.data["is_following"])

    def test_user_update(self):
        """Test updating user fields using serializer."""
        update_data = {"first_name": "Updated", "last_name": "User"}
        serializer = UserSerializer(instance=self.user, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()

        self.assertEqual(updated_user.first_name, "Updated")
        self.assertEqual(updated_user.last_name, "User")

    def test_user_password_update(self):
        """Test updating user password using serializer."""
        update_data = {"password": "NewSecurePassword123"}
        serializer = UserSerializer(instance=self.user, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_user = serializer.save()

        self.assertTrue(updated_user.check_password("NewSecurePassword123"))


