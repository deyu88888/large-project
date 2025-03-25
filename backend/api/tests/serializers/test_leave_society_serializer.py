from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework.exceptions import ValidationError

from api.serializers import LeaveSocietySerializer
from api.models import Society, Student

User = get_user_model()

class LeaveSocietySerializerTest(TestCase):
    """Test suite for the LeaveSocietySerializer"""

    def setUp(self):
        """Set up test data for the serializer tests"""
        
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="password123",
            role="admin"
        )

        
        self.student1 = Student.objects.create(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student",
            status="Approved"
        )
        
        setattr(self.student1, 'student', self.student1)

        self.student2 = Student.objects.create(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            role="student",
            status="Approved"
        )
        setattr(self.student2, 'student', self.student2)

        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student2,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        self.society.society_members.add(self.student1)
        self.student1.societies.add(self.society)

        
        self.factory = APIRequestFactory()

    def _create_request(self, user):
        """Helper to create a request with the given user."""
        request = self.factory.get('/')
        request.user = user
        return request

    def test_init_with_society_id(self):
        """Test initializing the serializer with a society_id."""
        serializer = LeaveSocietySerializer(society_id=self.society.id)
        self.assertEqual(serializer.society_id, self.society.id)

    def test_init_without_society_id(self):
        """Test initializing the serializer without a society_id."""
        serializer = LeaveSocietySerializer()
        self.assertIsNone(serializer.society_id)

    def test_validate_success(self):
        """Test validation succeeds with correct parameters."""
        request = self._create_request(self.student1)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=self.society.id
        )
        validated_data = serializer.validate(serializer.initial_data)
        self.assertEqual(validated_data['society'], self.society)

    def test_validate_non_student_user(self):
        """Test validation fails if user is not a student (missing 'student' attribute)."""
        request = self._create_request(self.admin_user)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=self.society.id
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("Only students can leave societies", str(exc.exception))

    def test_validate_missing_society_id(self):
        """Test validation fails if society_id is not provided."""
        request = self._create_request(self.student1)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request}
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("society_id is required", str(exc.exception))

    def test_validate_nonexistent_society(self):
        """Test validation fails if society does not exist."""
        request = self._create_request(self.student1)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=9999  
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("Society does not exist", str(exc.exception))

    def test_validate_not_a_member(self):
        """Test validation fails if user is not a member of the society."""
        
        student3 = Student.objects.create(
            username="student3",
            email="student3@example.com",
            password="password123",
            first_name="Student",
            last_name="Three",
            role="student",
            status="Approved"
        )
        setattr(student3, 'student', student3)
        request = self._create_request(student3)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=self.society.id
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("You are not a member of this society", str(exc.exception))

    def test_save_removes_user_from_society(self):
        """Test that save() removes the society from the student's societies."""
        request = self._create_request(self.student1)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=self.society.id
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        returned_society = serializer.save()
        self.assertEqual(returned_society, self.society)
        
        self.student1.refresh_from_db()
        self.assertFalse(self.student1.societies.filter(id=self.society.id).exists())

    def test_end_to_end_leave_society(self):
        """Test the complete flow: validate and save, removing the society from the student's list."""
        request = self._create_request(self.student1)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=self.society.id
        )
        
        self.assertTrue(self.society.society_members.filter(id=self.student1.id).exists())
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['society'], self.society)
        serializer.save()
        
        self.student1.refresh_from_db()
        self.assertFalse(self.student1.societies.filter(id=self.society.id).exists())

    def test_is_valid_and_save(self):
        """Test the flow using is_valid() then save()."""
        request = self._create_request(self.student1)
        serializer = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=self.society.id
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['society'], self.society)
        serializer.save()
        self.student1.refresh_from_db()
        self.assertFalse(self.student1.societies.filter(id=self.society.id).exists())

    def test_leave_multiple_societies(self):
        """Test that a student can leave multiple societies sequentially."""
        
        society2 = Society.objects.create(
            name="Another Society",
            description="Another test society",
            president=self.student2,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        society2.society_members.add(self.student1)
        self.student1.societies.add(society2)
        request = self._create_request(self.student1)
        
        serializer1 = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=self.society.id
        )
        self.assertTrue(serializer1.is_valid(), serializer1.errors)
        serializer1.save()
        self.student1.refresh_from_db()
        self.assertFalse(self.student1.societies.filter(id=self.society.id).exists())
        
        self.assertTrue(self.student1.societies.filter(id=society2.id).exists())
        
        serializer2 = LeaveSocietySerializer(
            data={},
            context={'request': request},
            society_id=society2.id
        )
        self.assertTrue(serializer2.is_valid(), serializer2.errors)
        serializer2.save()
        self.student1.refresh_from_db()
        self.assertFalse(self.student1.societies.filter(id=society2.id).exists())