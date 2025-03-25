from django.test import TestCase, TransactionTestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.contrib.auth import get_user_model
from django.test.utils import setup_test_environment
from unittest.mock import patch

from api.models import Society, Student, DescriptionRequest, User

class DescriptionRequestModelTest(TransactionTestCase):
    """
    Test cases for the DescriptionRequest model.
    """
    
    @patch('api.models.Society.full_clean')
    def setUp(self, mock_full_clean):
        """Set up test data for all test methods."""
        
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        
        
        self.student_user = Student.objects.create(
            username="test_student",
            email="student@example.com",
            password="password123",
            first_name="Test",
            last_name="Student",
            role="student",
            status="Approved"
        )
        
        
        self.request_student = Student.objects.create(
            username="request_student",
            email="request@example.com",
            password="password123",
            first_name="Request",
            last_name="Student",
            role="student",
            status="Approved"
        )
        
        
        
        
        mock_full_clean.return_value = None
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="Original description",
            category="Academic",
            status="Approved",
            president=self.student_user,
            approved_by=self.admin_user
        )
        
        
        self.description_request = DescriptionRequest.objects.create(
            society=self.society,
            requested_by=self.request_student,
            new_description="Updated society description"
        )

    def test_description_request_creation(self):
        """Test that a description request can be created with valid data."""
        self.assertEqual(DescriptionRequest.objects.count(), 1)
        self.assertEqual(self.description_request.society, self.society)
        self.assertEqual(self.description_request.requested_by, self.request_student)
        self.assertEqual(self.description_request.new_description, "Updated society description")
        self.assertEqual(self.description_request.status, "Pending")  
        self.assertIsNone(self.description_request.reviewed_by)

    def test_string_representation(self):
        """Test the string representation of a description request."""
        expected_string = f"Description update request for {self.society.name} - {self.description_request.status}"
        self.assertEqual(str(self.description_request), expected_string)

    def test_status_choices(self):
        """Test that status must be one of the defined choices."""
        
        valid_statuses = ["Pending", "Approved", "Rejected"]
        
        for status in valid_statuses:
            self.description_request.status = status
            self.description_request.save()
            self.assertEqual(self.description_request.status, status)
        
        
        self.description_request.status = "Invalid"
        with self.assertRaises(ValidationError):
            self.description_request.full_clean()

    def test_required_fields(self):
        """Test that required fields cannot be null or blank."""
        
        
        
        with self.assertRaises(IntegrityError):
            DescriptionRequest.objects.create(
                requested_by=self.request_student,
                new_description="Missing society field"
            )
            
        
        test_request = DescriptionRequest(
            society=self.society,
            requested_by=self.request_student,
            new_description=""  
        )
        
        
        with self.assertRaises(ValidationError):
            test_request.clean_fields()
            
    def test_requested_by_required(self):
        """Test that requested_by field is required."""
        
        with self.assertRaises(IntegrityError):
            DescriptionRequest.objects.create(
                society=self.society,
                new_description="Missing requested_by field"
            )

    def test_created_at_auto_now_add(self):
        """Test that created_at is automatically set on creation."""
        self.assertIsNotNone(self.description_request.created_at)
        self.assertTrue(isinstance(self.description_request.created_at, timezone.datetime))
        
        
        time_diff = timezone.now() - self.description_request.created_at
        self.assertTrue(time_diff.total_seconds() < 60)  

    def test_reviewed_by_optional(self):
        """Test that reviewed_by can be null."""
        
        self.assertIsNone(self.description_request.reviewed_by)
        
        
        self.description_request.reviewed_by = self.admin_user
        self.description_request.save()
        self.assertEqual(self.description_request.reviewed_by, self.admin_user)
        
        
        self.description_request.reviewed_by = None
        self.description_request.save()
        self.assertIsNone(self.description_request.reviewed_by)

    def test_foreign_key_relationships(self):
        """Test the relationships to Society and Student."""
        
        self.assertEqual(self.society.description_requests.count(), 1)
        self.assertEqual(self.society.description_requests.first(), self.description_request)
        
        
        self.assertEqual(self.request_student.description_requests.count(), 1)
        self.assertEqual(self.request_student.description_requests.first(), self.description_request)

    def test_multiple_requests_same_society(self):
        """Test that multiple description requests can be created for the same society."""
        second_request = DescriptionRequest.objects.create(
            society=self.society,
            requested_by=self.request_student,
            new_description="Another updated description"
        )
        
        self.assertEqual(self.society.description_requests.count(), 2)
        self.assertIn(second_request, self.society.description_requests.all())

    @patch('api.models.Society.full_clean')
    def test_on_delete_cascade_society(self, mock_full_clean):
        """Test that description requests are deleted when the society is deleted."""
        
        mock_full_clean.return_value = None
        
        
        temp_society = Society.objects.create(
            name="Temporary Society",
            description="A society that will be deleted",
            category="General",
            president=self.student_user,
            approved_by=self.admin_user
        )
        
        DescriptionRequest.objects.create(
            society=temp_society,
            requested_by=self.request_student,
            new_description="New description for temp society"
        )
        
        
        self.assertEqual(DescriptionRequest.objects.filter(society=temp_society).count(), 1)
        
        
        society_id = temp_society.id
        temp_society.delete()
        
        
        self.assertEqual(DescriptionRequest.objects.filter(society_id=society_id).count(), 0)

    def test_on_delete_cascade_student(self):
        """Test that description requests are deleted when the student is deleted."""
        
        temp_student = Student.objects.create(
            username="temp_student",
            email="temp_student@example.com",
            password="password123",
            first_name="Temp",
            last_name="Student",
            role="student",
            status="Approved"
        )
        
        DescriptionRequest.objects.create(
            society=self.society,
            requested_by=temp_student,
            new_description="New description from temp student"
        )
        
        
        self.assertEqual(DescriptionRequest.objects.filter(requested_by=temp_student).count(), 1)
        
        
        student_id = temp_student.id
        temp_student.delete()
        
        
        self.assertEqual(DescriptionRequest.objects.filter(requested_by_id=student_id).count(), 0)

    def test_on_delete_set_null_reviewer(self):
        """Test that reviewer is set to null when the reviewing user is deleted."""
        
        self.description_request.reviewed_by = self.admin_user
        self.description_request.status = "Approved"
        self.description_request.save()
        
        
        self.assertEqual(self.description_request.reviewed_by, self.admin_user)
        
        
        admin_id = self.admin_user.id
        self.admin_user.delete()
        
        
        self.description_request.refresh_from_db()
        self.assertIsNone(self.description_request.reviewed_by)
        
        
        self.assertEqual(DescriptionRequest.objects.filter(id=self.description_request.id).count(), 1)

    def test_status_transitions(self):
        """Test the status transitions of a description request."""
        
        self.assertEqual(self.description_request.status, "Pending")
        
        
        self.description_request.status = "Approved"
        self.description_request.reviewed_by = self.admin_user
        self.description_request.save()
        
        
        self.description_request.refresh_from_db()
        self.assertEqual(self.description_request.status, "Approved")
        self.assertEqual(self.description_request.reviewed_by, self.admin_user)
        
        
        self.description_request.status = "Rejected"
        self.description_request.save()
        
        
        self.description_request.refresh_from_db()
        self.assertEqual(self.description_request.status, "Rejected")

    def test_filter_by_status(self):
        """Test filtering description requests by status."""
        
        DescriptionRequest.objects.create(
            society=self.society,
            requested_by=self.request_student,
            new_description="Approved description",
            status="Approved",
            reviewed_by=self.admin_user
        )
        
        DescriptionRequest.objects.create(
            society=self.society,
            requested_by=self.request_student,
            new_description="Rejected description",
            status="Rejected",
            reviewed_by=self.admin_user
        )
        
        
        pending_requests = DescriptionRequest.objects.filter(status="Pending")
        approved_requests = DescriptionRequest.objects.filter(status="Approved")
        rejected_requests = DescriptionRequest.objects.filter(status="Rejected")
        
        self.assertEqual(pending_requests.count(), 1)
        self.assertEqual(approved_requests.count(), 1)
        self.assertEqual(rejected_requests.count(), 1)
        
        
        self.assertEqual(pending_requests.first().new_description, "Updated society description")
        self.assertEqual(approved_requests.first().new_description, "Approved description")
        self.assertEqual(rejected_requests.first().new_description, "Rejected description")