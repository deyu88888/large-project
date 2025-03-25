from django.test import TestCase
from api.serializers import PendingMemberSerializer
from api.models import UserRequest, Student

class PendingMemberSerializerTest(TestCase):
    def setUp(self):
        
        self.student = Student.objects.create(
            username="teststudent",
            first_name="Test",
            last_name="Student",
            email="test@student.com",
            password="password123",
            role="student",
            status="Approved"
        )
        
        self.user_request = UserRequest.objects.create(
            from_student=self.student,
            approved=False
        )

    def test_serialization_output(self):
        """
        Test that the serializer produces the correct flat output.
        Expected output keys are:
          - id
          - student_id (sourced from from_student.id)
          - first_name (sourced from from_student.first_name)
          - last_name (sourced from from_student.last_name)
          - username (sourced from from_student.username)
          - approved
        """
        serializer = PendingMemberSerializer(instance=self.user_request)
        data = serializer.data

        expected_keys = {"id", "student_id", "first_name", "last_name", "username", "approved"}
        self.assertEqual(set(data.keys()), expected_keys)

        
        self.assertEqual(data["student_id"], self.student.id)
        self.assertEqual(data["first_name"], self.student.first_name)
        self.assertEqual(data["last_name"], self.student.last_name)
        self.assertEqual(data["username"], self.student.username)
        self.assertEqual(data["approved"], self.user_request.approved)

    def test_serialization_with_approved_true(self):
        """Test that when approved is True on the instance, the output reflects that."""
        self.user_request.approved = True
        self.user_request.save()
        serializer = PendingMemberSerializer(instance=self.user_request)
        data = serializer.data
        self.assertTrue(data["approved"])

    def test_meta_fields(self):
        """Test that the serializer's Meta.fields are exactly as specified."""
        expected_fields = ["id", "student_id", "first_name", "last_name", "username", "approved"]
        self.assertEqual(PendingMemberSerializer.Meta.fields, expected_fields)

    def test_deserialization_not_supported(self):
        """
        Test that this serializer is read-only.
        Although passing input data makes is_valid() return True (since there are no writable fields),
        attempting to call save() should raise an AssertionError.
        """
        input_data = {
            "id": 1,
            "student_id": self.student.id,
            "first_name": "Changed",
            "last_name": "Changed",
            "username": "changed_username",
            "approved": True
        }
        serializer = PendingMemberSerializer(data=input_data)
        
        self.assertTrue(serializer.is_valid(), serializer.errors)
        with self.assertRaises(AssertionError):
            serializer.save()