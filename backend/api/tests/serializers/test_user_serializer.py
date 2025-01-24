from django.test import TestCase
from api.models import User, Student, Advisor, Admin
from api.serializers import UserSerializer, StudentSerializer, AdvisorSerializer, AdminSerializer
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


class StudentSerializerTestCase(TestCase):
    def setUp(self):
        self.student_data = {
            "username": "unique_student",
            "password": "Password123",
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "unique_email@example.com",
            "major": "Computer Science",
        }
        self.student = Student.objects.create_user(
            username="existing_student",
            password="Password123",
            first_name="Jane",
            last_name="Doe",
            email="existing_email@example.com",
            role="student",
            major="Computer Science",
        )

    def test_student_serialization(self):
        serializer = StudentSerializer(instance=self.student)
        data = serializer.data
        self.assertEqual(data["username"], self.student.username)
        self.assertEqual(data["major"], self.student.major)

    def test_student_deserialization(self):
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid())
        student = serializer.save()
        self.assertEqual(student.major, self.student_data["major"])
        self.assertTrue(student.check_password(self.student_data["password"]))

    def test_duplicate_email_validation(self):
        self.student_data["email"] = self.student.email  # Duplicate email
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertEqual(serializer.errors["email"][0], "user with this email already exists.")

    def test_duplicate_username_validation(self):
        self.student_data["username"] = self.student.username  # Duplicate username
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(serializer.errors["username"][0], "user with this username already exists.")

    def test_missing_required_fields(self):
        invalid_data = self.student_data.copy()
        del invalid_data["email"]  # Remove email
        serializer = StudentSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_optional_fields(self):
        self.student_data["societies"] = None
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid())
        student = serializer.save()
        self.assertEqual(list(student.societies.all()), [])

    def test_password_minimum_length(self):
        self.student_data["password"] = "short"
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)


class AdvisorSerializerTestCase(TestCase):
    def setUp(self):
        self.advisor_data = {
            "username": "unique_advisor",
            "password": "Password123",
            "first_name": "Alice",
            "last_name": "Smith",
            "email": "unique_email@example.com",
            "department": "Computer Science",
        }
        self.advisor = Advisor.objects.create_user(
            username="existing_advisor",
            password="Password123",
            first_name="Alice",
            last_name="Smith",
            email="existing_email@example.com",
            role="advisor",
            department="Computer Science",
        )

    def test_advisor_serialization(self):
        serializer = AdvisorSerializer(instance=self.advisor)
        data = serializer.data
        self.assertEqual(data["username"], self.advisor.username)
        self.assertEqual(data["department"], self.advisor.department)

    def test_advisor_deserialization(self):
        serializer = AdvisorSerializer(data=self.advisor_data)
        self.assertTrue(serializer.is_valid())
        advisor = serializer.save()
        self.assertEqual(advisor.department, self.advisor_data["department"])
        self.assertTrue(advisor.check_password(self.advisor_data["password"]))


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