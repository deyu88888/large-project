from django.test import TestCase
from api.models import Student, Society
from api.serializers import StudentSerializer
from rest_framework.exceptions import ValidationError

class StudentSerializerTestCase(TestCase):
    def setUp(self):
        self.student_data = {
            "username": "unique_student",
            "password": "Password123",
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "unique_email@example.com",
            "major": "Computer Science",
            "societies": [],
            "president_of": [],
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
        self.society1 = Society.objects.create(
            name='Science Club',
            leader=self.student
        )
        self.society2 = Society.objects.create(
            name='Math Club',
        )
        self.student.societies.set([self.society1])
        self.student.president_of.set([self.society1])

    def test_student_serialization(self):
        """test serialization"""
        serializer = StudentSerializer(instance=self.student)
        data = serializer.data
        self.assertEqual(data["username"], self.student.username)
        self.assertEqual(data["major"], self.student.major)
        self.assertEqual(data["societies"], list(self.student.societies.values_list("id", flat=True)))
        self.assertEqual(data["president_of"], list(self.student.president_of.values_list("id", flat=True)))
        self.assertEqual(data["is_president"], True)

    def test_student_deserialization(self):
        """test deserialization"""
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        student = serializer.save()
        self.assertEqual(student.major, self.student_data["major"])
        self.assertEqual(list(student.societies.values_list("id", flat=True)), self.student_data["societies"])
        self.assertEqual(list(student.president_of.values_list("id", flat=True)), self.student_data["president_of"])
        self.assertTrue(student.check_password(self.student_data["password"]))

    def test_duplicate_email_validation(self):
        """test duplicate email validation"""
        self.student_data["email"] = self.student.email  # Duplicate email
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertEqual(serializer.errors["email"][0], "Email already exists.")

    def test_duplicate_username_validation(self):
        """test duplicate username validation"""
        self.student_data["username"] = self.student.username  # Duplicate username
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(serializer.errors["username"][0], "Username already exists.")

    def test_missing_required_fields(self):
        """test missing required fields"""
        invalid_data = self.student_data.copy()
        del invalid_data["email"]  # Remove email
        serializer = StudentSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_optional_fields(self):
        """test optional fields"""
        self.student_data["societies"] = []
        self.student_data["president_of"] = []
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        student = serializer.save()
        self.assertEqual(list(student.societies.all()), [])
        self.assertEqual(list(student.president_of.all()), [])
        self.assertFalse(student.is_president)

    def test_password_minimum_length(self):
        """test password minimum length validation"""
        self.student_data["password"] = "short"
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_societies_and_president_of_relationship(self):
        """test societies and president_of many-to-many relationship"""
        # set valid president_of and societies data
        self.student_data["president_of"] = [self.society1.id]
        self.student_data["societies"] = [self.society1.id, self.society2.id]
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        student = serializer.save()
        # Verify many-to-many relationships and is_president property
        self.assertEqual(list(student.societies.values_list("id", flat=True)), self.student_data["societies"])
        self.assertEqual(list(student.president_of.values_list("id", flat=True)), self.student_data["president_of"])
        self.assertTrue(student.is_president)
