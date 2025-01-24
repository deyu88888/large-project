from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Student, Society, User

class RegisterViewTestCase(APITestCase):
    def setUp(self):

        self.society1 = Society.objects.create(name="Science Club")
        self.society2 = Society.objects.create(name="Math Club")

        self.valid_payload = {
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane.doe@example.com",
            "username": "jane_doe",
            "password": "Password123",
            "major": "Computer Science",
            "societies": [self.society1.id],
            "president_of": [self.society2.id],
        }

        self.existing_user = User.objects.create_user(
            username="existing_user",
            email="existing_user@example.com",
            password="Password123",
            first_name="John",
            last_name="Smith",
            role="student",
        )

    def test_register_student_success(self):
        """
        Test registering a student successfully with valid data.
        """
        response = self.client.post(reverse("register"), data=self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertEqual(response.data["message"], "Student registered successfully.")
        self.assertTrue(Student.objects.filter(username=self.valid_payload["username"]).exists())

    def test_register_student_missing_required_fields(self):
        """
        Test registering a student fails when required fields are missing.
        """
        invalid_payload = self.valid_payload.copy()
        del invalid_payload["email"]  
        response = self.client.post(reverse("register"), data=invalid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_register_student_duplicate_email(self):
        """
        Test registering a student fails when email already exists.
        """
        self.valid_payload["email"] = self.existing_user.email  
        response = self.client.post(reverse("register"), data=self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)
        self.assertEqual(response.data["email"][0], "user with this email already exists.")

    def test_register_student_duplicate_username(self):
        """
        Test registering a student fails when username already exists.
        """
        self.valid_payload["username"] = self.existing_user.username  
        response = self.client.post(reverse("register"), data=self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(response.data["username"][0], "user with this username already exists.")

    def test_register_student_invalid_password(self):
        """
        Test registering a student fails when password is too short.
        """
        self.valid_payload["password"] = "short"
        response = self.client.post(reverse("register"), data=self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", response.data)

    def test_register_student_missing_major(self):
        """
        Test registering a student fails when 'major' field is missing.
        """
        invalid_payload = self.valid_payload.copy()
        del invalid_payload["major"]
        response = self.client.post(reverse("register"), data=invalid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("major", response.data)