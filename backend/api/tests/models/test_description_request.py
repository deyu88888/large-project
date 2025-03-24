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
        # Create an admin user for approvals
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        
        # Create a student user to be a president
        self.student_user = Student.objects.create(
            username="test_student",
            email="student@example.com",
            password="password123",
            first_name="Test",
            last_name="Student",
            role="student",
            status="Approved"
        )
        
        # Create a second student user for creating requests
        self.request_student = Student.objects.create(
            username="request_student",
            email="request@example.com",
            password="password123",
            first_name="Request",
            last_name="Student",
            role="student",
            status="Approved"
        )
        
        # We're mocking the full_clean method to bypass validation
        # This way we can create a Society without having to set all required fields
        # for our tests which focus on DescriptionRequest, not Society
        mock_full_clean.return_value = None
        
        # Create a society with required fields
        self.society = Society.objects.create(
            name="Test Society",
            description="Original description",
            category="Academic",
            status="Approved",
            president=self.student_user,
            approved_by=self.admin_user
        )
        
        # Create a description request - using request_student, not the president
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
        self.assertEqual(self.description_request.status, "Pending")  # Default status
        self.assertIsNone(self.description_request.reviewed_by)

    def test_string_representation(self):
        """Test the string representation of a description request."""
        expected_string = f"Description update request for {self.society.name} - {self.description_request.status}"
        self.assertEqual(str(self.description_request), expected_string)

    def test_status_choices(self):
        """Test that status must be one of the defined choices."""
        # Test valid statuses
        valid_statuses = ["Pending", "Approved", "Rejected"]
        
        for status in valid_statuses:
            self.description_request.status = status
            self.description_request.save()
            self.assertEqual(self.description_request.status, status)
        
        # Test invalid status (should raise error)
        self.description_request.status = "Invalid"
        with self.assertRaises(ValidationError):
            self.description_request.full_clean()

    def test_required_fields(self):
        """Test that required fields cannot be null or blank."""
        # Test each constraint in separate sub-tests to avoid transaction issues
        
        # Test society field is required
        with self.assertRaises(IntegrityError):
            DescriptionRequest.objects.create(
                requested_by=self.request_student,
                new_description="Missing society field"
            )
            
        # Create a new request with blank description to test validation
        test_request = DescriptionRequest(
            society=self.society,
            requested_by=self.request_student,
            new_description=""  # Empty string
        )
        
        # new_description field is required (use clean_fields for field-level validation)
        with self.assertRaises(ValidationError):
            test_request.clean_fields()
            
    def test_requested_by_required(self):
        """Test that requested_by field is required."""
        # Test in a separate method to avoid transaction issues
        with self.assertRaises(IntegrityError):
            DescriptionRequest.objects.create(
                society=self.society,
                new_description="Missing requested_by field"
            )

    def test_created_at_auto_now_add(self):
        """Test that created_at is automatically set on creation."""
        self.assertIsNotNone(self.description_request.created_at)
        self.assertTrue(isinstance(self.description_request.created_at, timezone.datetime))
        
        # Ensure the created_at is within the last minute (to account for minor test delays)
        time_diff = timezone.now() - self.description_request.created_at
        self.assertTrue(time_diff.total_seconds() < 60)  

    def test_reviewed_by_optional(self):
        """Test that reviewed_by can be null."""
        # Initial state should be null
        self.assertIsNone(self.description_request.reviewed_by)
        
        # Set a reviewer
        self.description_request.reviewed_by = self.admin_user
        self.description_request.save()
        self.assertEqual(self.description_request.reviewed_by, self.admin_user)
        
        # Set back to null
        self.description_request.reviewed_by = None
        self.description_request.save()
        self.assertIsNone(self.description_request.reviewed_by)

    def test_foreign_key_relationships(self):
        """Test the relationships to Society and Student."""
        # Society relationship
        self.assertEqual(self.society.description_requests.count(), 1)
        self.assertEqual(self.society.description_requests.first(), self.description_request)
        
        # Student relationship
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
        # Mock full_clean to bypass validation
        mock_full_clean.return_value = None
        
        # Create a new society and description request
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
        
        # Verify request exists
        self.assertEqual(DescriptionRequest.objects.filter(society=temp_society).count(), 1)
        
        # Delete the society
        society_id = temp_society.id
        temp_society.delete()
        
        # Verify the request was also deleted
        self.assertEqual(DescriptionRequest.objects.filter(society_id=society_id).count(), 0)

    def test_on_delete_cascade_student(self):
        """Test that description requests are deleted when the student is deleted."""
        # Create a new student and description request
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
        
        # Verify request exists
        self.assertEqual(DescriptionRequest.objects.filter(requested_by=temp_student).count(), 1)
        
        # Delete the student
        student_id = temp_student.id
        temp_student.delete()
        
        # Verify the request was also deleted
        self.assertEqual(DescriptionRequest.objects.filter(requested_by_id=student_id).count(), 0)

    def test_on_delete_set_null_reviewer(self):
        """Test that reviewer is set to null when the reviewing user is deleted."""
        # Set a reviewer
        self.description_request.reviewed_by = self.admin_user
        self.description_request.status = "Approved"
        self.description_request.save()
        
        # Verify the reviewer is set
        self.assertEqual(self.description_request.reviewed_by, self.admin_user)
        
        # Delete the admin user
        admin_id = self.admin_user.id
        self.admin_user.delete()
        
        # Refresh from database and check that reviewer is now null
        self.description_request.refresh_from_db()
        self.assertIsNone(self.description_request.reviewed_by)
        
        # Verify the request still exists
        self.assertEqual(DescriptionRequest.objects.filter(id=self.description_request.id).count(), 1)

    def test_status_transitions(self):
        """Test the status transitions of a description request."""
        # Initial status should be Pending
        self.assertEqual(self.description_request.status, "Pending")
        
        # Change to Approved
        self.description_request.status = "Approved"
        self.description_request.reviewed_by = self.admin_user
        self.description_request.save()
        
        # Refresh from database
        self.description_request.refresh_from_db()
        self.assertEqual(self.description_request.status, "Approved")
        self.assertEqual(self.description_request.reviewed_by, self.admin_user)
        
        # Change to Rejected
        self.description_request.status = "Rejected"
        self.description_request.save()
        
        # Refresh from database
        self.description_request.refresh_from_db()
        self.assertEqual(self.description_request.status, "Rejected")

    def test_filter_by_status(self):
        """Test filtering description requests by status."""
        # Create additional requests with different statuses
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
        
        # Filter by status
        pending_requests = DescriptionRequest.objects.filter(status="Pending")
        approved_requests = DescriptionRequest.objects.filter(status="Approved")
        rejected_requests = DescriptionRequest.objects.filter(status="Rejected")
        
        self.assertEqual(pending_requests.count(), 1)
        self.assertEqual(approved_requests.count(), 1)
        self.assertEqual(rejected_requests.count(), 1)
        
        # Verify the filtered content
        self.assertEqual(pending_requests.first().new_description, "Updated society description")
        self.assertEqual(approved_requests.first().new_description, "Approved description")
        self.assertEqual(rejected_requests.first().new_description, "Rejected description")