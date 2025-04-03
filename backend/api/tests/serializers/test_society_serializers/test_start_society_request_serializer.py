from django.test import TestCase
from rest_framework.exceptions import ValidationError
from unittest.mock import patch, MagicMock
from types import SimpleNamespace

from api.serializers import StartSocietyRequestSerializer
from api.models import Society, Student, SocietyRequest

class StartSocietyRequestSerializerTest(TestCase):
    """Tests for StartSocietyRequestSerializer."""

    def setUp(self):
        """Set up a requester student for tests."""
        self.student = Student.objects.create(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student",
            status="Approved"
        )

        self.another_student = Student.objects.create(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            role="student",
            status="Approved"
        )
        self.mock_request = SimpleNamespace(user=SimpleNamespace(student=self.student))

    def test_successful_creation(self):
        """Test that valid data creates a SocietyRequest instance."""
        data = {
            "name": "New Society",
            "description": "A society for testing purposes.",
            "category": "Academic",
            "requested_by": self.student.id
        }
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

        with patch('api.models.SocietyRequest.objects.create') as mock_create:
            dummy_request_obj = MagicMock(spec=SocietyRequest)
            dummy_request_obj.name = data["name"]
            dummy_request_obj.description = data["description"]
            dummy_request_obj.category = data["category"]
            dummy_request_obj.from_student = self.student
            dummy_request_obj.president = self.student
            dummy_request_obj.intent = "CreateSoc"
            dummy_request_obj.approved = None
            dummy_request_obj.id = 1
            mock_create.return_value = dummy_request_obj

            created_request = serializer.save()

            mock_create.assert_called_once_with(
                name=data["name"],
                description=data["description"],
                category=data["category"],
                president=self.student,
                intent="CreateSoc",
                from_student=self.student
            )

            self.assertEqual(created_request.name, data["name"])
            self.assertEqual(created_request.description, data["description"])
            self.assertEqual(created_request.category, data["category"])
            self.assertEqual(created_request.from_student, self.student)
            self.assertEqual(created_request.president, self.student)
            self.assertEqual(created_request.intent, "CreateSoc")

    def test_status_read_only(self):
        """
        Test that if extra fields (like status) are provided, they are ignored,
        and a SocietyRequest is created correctly.
        """
        data = {
            "name": "Society With Extra Status",
            "description": "Testing ignored status.",
            "category": "Sports",
            "requested_by": self.student.id,
            "status": "Approved"
        }
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertTrue(serializer.is_valid(), serializer.errors)

        with patch('api.models.SocietyRequest.objects.create') as mock_create:
            dummy_request_obj = MagicMock(spec=SocietyRequest)
            dummy_request_obj.name = data["name"]
            dummy_request_obj.description = data["description"]
            dummy_request_obj.category = data["category"]
            dummy_request_obj.from_student = self.student
            dummy_request_obj.president = self.student
            dummy_request_obj.intent = "CreateSoc"
            dummy_request_obj.id = 2
            mock_create.return_value = dummy_request_obj

            created_request = serializer.save()

            mock_create.assert_called_once_with(
                name=data["name"],
                description=data["description"],
                category=data["category"],
                president=self.student,
                intent="CreateSoc",
                from_student=self.student
            )

            self.assertEqual(created_request.name, data["name"])
            self.assertEqual(created_request.from_student, self.student)

    def test_duplicate_name_validation(self):
        """Test duplicate Society name validation."""
        approved_society = Society.objects.create(
            name="Existing Society",
            president=self.another_student,
            status="Approved",
            category="Test"
        )
        data = {
            "name": "Existing Society",
            "description": "Attempting duplicate society.",
            "category": "Cultural",
            "requested_by": self.student.id
        }
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertFalse(serializer.is_valid())
        self.assertIn('name', serializer.errors)
        self.assertIn("society with this name already exists", str(serializer.errors['name'][0]))

    def test_missing_required_fields(self):
        """Test missing required fields validation."""
        data = {"name": "Incomplete Society"}
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("description", serializer.errors)
        self.assertIn("category", serializer.errors)
        self.assertIn("requested_by", serializer.errors)

    def test_field_length_validation(self):
        """Test field length validation."""
        too_long_description = "a" * 501
        too_long_category = "b" * 51
        data = {
            "name": "Society With Long Fields",
            "description": too_long_description,
            "category": too_long_category,
            "requested_by": self.student.id
        }
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertFalse(serializer.is_valid())
        self.assertIn("Ensure this field has no more than 500 characters",
                      str(serializer.errors.get("description", [])))
        self.assertIn("Ensure this field has no more than 50 characters",
                      str(serializer.errors.get("category", [])))