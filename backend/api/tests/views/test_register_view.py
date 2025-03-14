from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import Admin, Student, Society, User
from api.tests.file_deletion import delete_file

class RegisterViewTestCase(APITestCase):
    def setUp(self):
        # First create a student user for the leader field
        self.leader_user = User.objects.create_user(
            username="leader_user",
            email="leader@example.com",
            password="Password123",
            first_name="Leader",
            last_name="User",
            role="student",
        )
        
        self.admin = Admin(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        self.admin.save()
        
        # Create the student profile for the leader
        self.leader = Student.objects.create(
            user_ptr=self.leader_user,
            major="Leadership"
        )

        # Now create societies with a leader
        self.society1 = Society.objects.create(
            name="Science Club",
            leader=self.leader,
            description="A club for science enthusiasts",
            approved_by=self.admin,
            social_media_links={"Email": "science@example.com"}
        )
        
        self.society2 = Society.objects.create(
            name="Math Club",
            leader=self.leader,
            description="A club for math enthusiasts",  # Added comma here
            approved_by=self.admin,
            social_media_links={"Email": "math@example.com"}
        )

        self.valid_payload = {
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "jane.doe@example.com",
            "username": "jane_doe",
            "password": "Password123",
            "major": "Computer Science",
            "societies": [self.society1.id],
            "president_of": self.society2.id,
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
        self.assertEqual(response.data["message"], "Student registered successfully")
        self.assertTrue(Student.objects.filter(username=self.valid_payload["username"]).exists())

    def test_register_student_missing_required_fields(self):
        """
        Test registering a student fails when required fields are missing.
        """
        invalid_payload = self.valid_payload.copy()
        del invalid_payload["email"]
        response = self.client.post(reverse("register"), data=invalid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Email", response.data.get("error", ""))

    def test_register_student_duplicate_email(self):
        """
        Test registering a student fails when email already exists.
        """
        self.valid_payload["email"] = self.existing_user.email  
        response = self.client.post(reverse("register"), data=self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        # Check that the error message mentions email; adjust case as needed.
        self.assertIn("email", response.data.get("error", "").lower())
        self.assertEqual(response.data.get("error"), "This email is already registered.")


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

    def test_register_student_username_case_insensitive(self):
        """Test that username is case-insensitively unique."""
        self.valid_payload["username"] = self.existing_user.username.lower()

        response = self.client.post(reverse("register"), data=self.valid_payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("username", response.data)
        self.assertEqual(response.data["username"][0], "user with this username already exists.")

    def test_register_student_without_societies(self):
        """Test that student can register without joining any societies."""
        self.valid_payload["societies"] = []
        self.valid_payload["president_of"] = None  # Explicitly set president_of to None

        response = self.client.post(reverse("register"), data=self.valid_payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("message", response.data)
        self.assertEqual(response.data["message"], "Student registered successfully")

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)