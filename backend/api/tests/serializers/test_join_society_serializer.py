from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from rest_framework.exceptions import ValidationError

from api.serializers import JoinSocietySerializer
from api.models import Society, Student, SocietyRequest

User = get_user_model()

class JoinSocietySerializerTest(TestCase):
    """Test suite for the JoinSocietySerializer"""

    def setUp(self):
        """Set up test data for JoinSocietySerializer tests."""
        
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="password123",
            role="admin"
        )

        
        self.student = Student.objects.create(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student",
            status="Approved"
        )
        
        setattr(self.student, 'student', self.student)

        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student,  
            approved_by=self.admin_user,
            status="Approved"
        )
        
        self.society.society_members.add(self.student)
        self.student.societies.add(self.society)

        
        self.factory = APIRequestFactory()

    def _create_request(self, user):
        """Helper to create a request with the given user."""
        request = self.factory.get('/')
        request.user = user
        return request

    def test_missing_society_id(self):
        """Test that validation fails if society_id is missing in input."""
        request = self._create_request(self.student)
        serializer = JoinSocietySerializer(
            data={},
            context={'request': request}
        )
        self.assertFalse(serializer.is_valid())
        self.assertIn('society_id', serializer.errors)

    def test_valid_society_id_success(self):
        """
        Test that validation passes when:
          - The user is a student,
          - The society exists,
          - The student is not already a member,
          - And there is no pending join request.
        """
        
        self.society.society_members.remove(self.student)
        self.student.societies.remove(self.society)

        request = self._create_request(self.student)
        serializer = JoinSocietySerializer(
            data={'society_id': self.society.id},
            context={'request': request}
        )
        
        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['society_id'], self.society.id)

    def test_non_student_user(self):
        """Test that validation fails when the request.user is not a student."""
        request = self._create_request(self.admin_user)
        serializer = JoinSocietySerializer(
            data={'society_id': self.society.id},
            context={'request': request}
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("Only students can join societies", str(exc.exception))

    def test_society_does_not_exist(self):
        """Test that validation fails when the society does not exist."""
        request = self._create_request(self.student)
        serializer = JoinSocietySerializer(
            data={'society_id': 9999},  
            context={'request': request}
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("Society does not exist", str(exc.exception))

    def test_already_member(self):
        """Test that validation fails if the student is already a member of the society."""
        
        request = self._create_request(self.student)
        serializer = JoinSocietySerializer(
            data={'society_id': self.society.id},
            context={'request': request}
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("You are already a member of this society", str(exc.exception))

    def test_pending_request_exists(self):
        """
        Test that validation fails if there is already a pending join request for the student.
        """
        
        self.society.society_members.remove(self.student)
        self.student.societies.remove(self.society)

        
        SocietyRequest.objects.create(
            from_student=self.student,
            society=self.society,
            intent="JoinSoc",
            approved=False
        )

        request = self._create_request(self.student)
        serializer = JoinSocietySerializer(
            data={'society_id': self.society.id},
            context={'request': request}
        )
        with self.assertRaises(ValidationError) as exc:
            serializer.is_valid(raise_exception=True)
        self.assertIn("You already have a pending request to join this society", str(exc.exception))

    def test_save_returns_society(self):
        """
        Test that the save() method returns the Society instance.
        (Note: In your flow, the view creates a SocietyRequest instead.)
        """
        
        self.society.society_members.remove(self.student)
        self.student.societies.remove(self.society)

        request = self._create_request(self.student)
        serializer = JoinSocietySerializer(
            data={'society_id': self.society.id},
            context={'request': request}
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        society_returned = serializer.save()
        self.assertEqual(society_returned, self.society)