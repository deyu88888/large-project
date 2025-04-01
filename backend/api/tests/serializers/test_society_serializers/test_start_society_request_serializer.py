from django.test import TestCase
from rest_framework.exceptions import ValidationError
from unittest.mock import patch, MagicMock
from types import SimpleNamespace

from api.serializers import StartSocietyRequestSerializer
from api.models import Society, Student

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
        """
        Test that valid data creates a Society instance with:
          - status set to "Pending"
          - a roles dict containing the description and category,
          - and the president set to the requested_by student.
        """
        data = {
            "name": "New Society",
            "description": "A society for testing purposes.",
            "category": "Academic",
            "requested_by": self.student.id
        }
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        with patch('api.serializers.Society.objects.create') as mock_create:
            
            dummy_society = MagicMock(spec=Society)
            dummy_society.name = data["name"]
            dummy_society.status = "Pending"
            dummy_society.roles = {"description": data["description"],
                                   "category": data["category"]}
            dummy_society.president = self.student
            dummy_society.id = 1
            mock_create.return_value = dummy_society

            society = serializer.save()
            mock_create.assert_called_once_with(
                name=data["name"],
                description=data["description"],
                category=data["category"],
                president=self.student,
                status="Pending"
            )
            self.assertEqual(society.name, data["name"])
            self.assertEqual(society.status, "Pending")
            self.assertEqual(society.roles, {"description": data["description"],
                                              "category": data["category"]})
            self.assertEqual(society.president, self.student)

    def test_duplicate_name_validation(self):
        """
        Test that the serializer rejects data when a Society with the same name already exists.
        """
        
        Society.objects.create(
            name="Existing Society",
            approved_by=self.student,  
            president=self.student,
            status="Approved"
        )
        data = {
            "name": "Existing Society",
            "description": "Attempting duplicate society.",
            "category": "Cultural",
            "requested_by": self.student.id
        }
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertFalse(serializer.is_valid())
        errors = serializer.errors.get("non_field_errors", [])
        self.assertTrue(any("already exists" in str(e) for e in errors))

    def test_missing_required_fields(self):
        """
        Test that errors are returned when required fields are missing.
        """
        data = {}  
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertFalse(serializer.is_valid())
        
        self.assertIn("description", serializer.errors)
        self.assertIn("category", serializer.errors)
        self.assertIn("requested_by", serializer.errors)

    def test_status_read_only(self):
        """
        Test that if a status is provided in the input, it is ignored and the created Society still has status "Pending".
        """
        data = {
            "name": "Society With Status Attempt",
            "description": "Testing read-only status.",
            "category": "Sports",
            "requested_by": self.student.id,
            "status": "Approved"  
        }
        serializer = StartSocietyRequestSerializer(data=data, context={"request": self.mock_request})
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        with patch('api.serializers.Society.objects.create') as mock_create:
            dummy_society = MagicMock(spec=Society)
            dummy_society.status = "Pending"
            dummy_society.name = data["name"]
            dummy_society.roles = {"description": data["description"], "category": data["category"]}
            dummy_society.president = self.student
            dummy_society.id = 2
            mock_create.return_value = dummy_society

            society = serializer.save()
            mock_create.assert_called_once_with(
                name=data["name"],
                description=data["description"],
                category=data["category"],
                president=self.student,
                status="Pending"
            )
            self.assertEqual(society.status, "Pending")

    def test_field_length_validation(self):
        """
        Test that overly long 'description' and 'category' values produce validation errors.
        """
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