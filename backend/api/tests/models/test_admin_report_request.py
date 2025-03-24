from django.test import TransactionTestCase
from django.utils import timezone
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from unittest.mock import patch, MagicMock
import datetime

from api.models import User, Student, Society, AdminReportRequest


class AdminReportRequestModelTest(TransactionTestCase):
    """
    Test cases for the AdminReportRequest model.
    This uses TransactionTestCase to ensure proper transaction handling for tests that may cause database errors.
    """
    
    @patch('api.models.Society.full_clean')
    def setUp(self, mock_full_clean):
        """Set up test data for all test methods."""
        # Create an admin user
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        
        # Create student users - one regular student and one society president
        self.regular_student = Student.objects.create(
            username="regular_student",
            email="student@example.com",
            password="password123",
            first_name="Regular",
            last_name="Student",
            role="student",
            status="Approved"
        )
        
        self.president_student = Student.objects.create(
            username="president_student",
            email="president@example.com",
            password="password123",
            first_name="President",
            last_name="Student",
            role="student",
            status="Approved",
            is_president=True
        )
        
        # Mock Society.full_clean to bypass validation
        mock_full_clean.return_value = None
        
        # Create a society with the president
        self.society = Society.objects.create(
            name="Test Society",
            description="Test Society Description",
            category="Academic",
            status="Approved",
            president=self.president_student,
            approved_by=self.admin_user
        )
        
        # Update president's society relationship
        self.president_student.president_of = self.society
        self.president_student.save()
        
        # Create report from regular student
        self.student_report = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="System Issue",
            subject="Website Error",
            details="I encountered an error while trying to view events."
        )
        
        # Create report from society president
        self.president_report = AdminReportRequest.objects.create(
            intent="CreateEve",
            from_student=self.president_student,
            report_type="Society Issue",
            subject="Member Management Issue",
            details="Cannot remove inactive members from the society.",
            is_from_society_officer=True
        )

    def test_report_creation(self):
        """Test that reports can be created with valid data."""
        # Verify total count
        self.assertEqual(AdminReportRequest.objects.count(), 2)
        
        # Test student report fields
        self.assertEqual(self.student_report.from_student, self.regular_student)
        self.assertEqual(self.student_report.report_type, "System Issue")
        self.assertEqual(self.student_report.subject, "Website Error")
        self.assertEqual(self.student_report.details, "I encountered an error while trying to view events.")
        self.assertFalse(self.student_report.is_from_society_officer)
        self.assertEqual(self.student_report.intent, "CreateSoc")
        
        # Test president report fields
        self.assertEqual(self.president_report.from_student, self.president_student)
        self.assertEqual(self.president_report.report_type, "Society Issue")
        self.assertEqual(self.president_report.subject, "Member Management Issue")
        self.assertEqual(self.president_report.details, "Cannot remove inactive members from the society.")
        self.assertTrue(self.president_report.is_from_society_officer)
        self.assertEqual(self.president_report.intent, "CreateEve")

    def test_report_string_representation(self):
        """Test the string representation of reports."""
        expected_student_string = f"System Issue - Website Error (From {self.regular_student.username})"
        expected_president_string = f"Society Issue - Member Management Issue (From {self.president_student.username})"
        
        self.assertEqual(str(self.student_report), expected_student_string)
        self.assertEqual(str(self.president_report), expected_president_string)

    def test_report_types(self):
        """Test that report_type must be one of the defined choices."""
        # Test all valid report types
        valid_types = ["Misconduct", "System Issue", "Society Issue", "Event Issue", "Other"]
        
        for i, report_type in enumerate(valid_types):
            report = AdminReportRequest.objects.create(
                intent="CreateSoc",
                from_student=self.regular_student,
                report_type=report_type,
                subject=f"Test Subject {i}",
                details=f"Test details for {report_type}"
            )
            self.assertEqual(report.report_type, report_type)
        
        # Test invalid report type (should raise validation error)
        invalid_report = AdminReportRequest(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Invalid Type",
            subject="Invalid Subject",
            details="This should fail validation"
        )
        
        with self.assertRaises(ValidationError):
            invalid_report.full_clean()

    def test_intent_choices(self):
        """Test that intent must be one of the defined choices from the parent Request model."""
        # Test valid intents
        valid_intents = ["CreateSoc", "UpdateSoc", "CreateEve", "UpdateEve", "CreateUse", "UpdateUse", "JoinSoc"]
        
        for i, intent in enumerate(valid_intents):
            report = AdminReportRequest.objects.create(
                intent=intent,
                from_student=self.regular_student,
                report_type="Other",
                subject=f"Intent Test {i}",
                details=f"Testing intent: {intent}"
            )
            self.assertEqual(report.intent, intent)
        
        # Test invalid intent
        invalid_report = AdminReportRequest(
            intent="InvalidIntent",
            from_student=self.regular_student,
            report_type="Other",
            subject="Invalid Intent",
            details="This should fail validation"
        )
        
        with self.assertRaises(ValidationError):
            invalid_report.full_clean()

    def test_required_fields(self):
        """Test that required fields cannot be null or blank."""
        # Test subject is required
        with self.assertRaises(ValidationError):
            report = AdminReportRequest(
                intent="CreateSoc",
                from_student=self.regular_student,
                report_type="Other",
                subject="",  # Empty subject
                details="Test details"
            )
            report.full_clean()
        
        # Test details is required
        with self.assertRaises(ValidationError):
            report = AdminReportRequest(
                intent="CreateSoc",
                from_student=self.regular_student,
                report_type="Other",
                subject="Test Subject",
                details=""  # Empty details
            )
            report.full_clean()
        
        # Test report_type is required
        with self.assertRaises(ValidationError):
            report = AdminReportRequest(
                intent="CreateSoc",
                from_student=self.regular_student,
                subject="Test Subject",
                details="Test details"
            )
            report.full_clean()
    
    def test_from_student_foreign_key(self):
        """Test that from_student is required and relates to Student model."""
        # Test from_student is required
        with self.assertRaises(IntegrityError):
            AdminReportRequest.objects.create(
                intent="CreateSoc",
                report_type="Other",
                subject="Missing Student",
                details="This should fail due to missing student"
            )
    
    def test_auto_now_add_timestamp(self):
        """Test that requested_at is automatically set on creation."""
        # Ensure timestamp is set
        self.assertIsNotNone(self.student_report.requested_at)
        self.assertTrue(isinstance(self.student_report.requested_at, datetime.datetime))
        
        # Verify the timestamp is recent (within the last minute)
        time_diff = timezone.now() - self.student_report.requested_at
        self.assertTrue(time_diff.total_seconds() < 60)
        
        # Create a new report to verify auto_now_add works
        new_report = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Other",
            subject="Timestamp Test",
            details="Testing auto_now_add"
        )
        
        self.assertIsNotNone(new_report.requested_at)
        self.assertTrue((timezone.now() - new_report.requested_at).total_seconds() < 60)

    def test_is_from_society_officer_default(self):
        """Test that is_from_society_officer defaults to False."""
        new_report = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Other",
            subject="Default Test",
            details="Testing is_from_society_officer default"
        )
        
        self.assertFalse(new_report.is_from_society_officer)

    def test_on_delete_cascade_student(self):
        """Test that reports are deleted when the student is deleted."""
        # Count reports from regular student
        initial_count = AdminReportRequest.objects.filter(from_student=self.regular_student).count()
        self.assertGreaterEqual(initial_count, 1)
        
        # Create a temporary student
        temp_student = Student.objects.create(
            username="temp_student",
            email="temp@example.com",
            password="password123",
            first_name="Temp",
            last_name="Student",
            role="student",
            status="Approved"
        )
        
        # Create reports with this student
        temp_report1 = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=temp_student,
            report_type="Other",
            subject="Temp Report 1",
            details="This should be deleted with the student"
        )
        
        temp_report2 = AdminReportRequest.objects.create(
            intent="UpdateSoc",
            from_student=temp_student,
            report_type="Other",
            subject="Temp Report 2",
            details="This should also be deleted"
        )
        
        # Verify reports exist
        self.assertEqual(AdminReportRequest.objects.filter(from_student=temp_student).count(), 2)
        
        # Delete the student
        student_id = temp_student.id
        temp_student.delete()
        
        # Verify reports were deleted
        self.assertEqual(AdminReportRequest.objects.filter(from_student_id=student_id).count(), 0)
        
        # Ensure other reports are untouched
        self.assertEqual(AdminReportRequest.objects.filter(from_student=self.regular_student).count(), initial_count)

    def test_filter_by_report_type(self):
        """Test filtering reports by report_type."""
        # Create additional reports with different types
        AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Misconduct",
            subject="Misconduct Report",
            details="Testing filtering by report type"
        )
        
        AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.president_student,
            report_type="Event Issue",
            subject="Event Report",
            details="Testing filtering by report type"
        )
        
        # Filter by each report type
        misconduct_reports = AdminReportRequest.objects.filter(report_type="Misconduct")
        system_issue_reports = AdminReportRequest.objects.filter(report_type="System Issue")
        society_issue_reports = AdminReportRequest.objects.filter(report_type="Society Issue")
        event_issue_reports = AdminReportRequest.objects.filter(report_type="Event Issue")
        
        # Verify counts
        self.assertEqual(misconduct_reports.count(), 1)
        self.assertEqual(system_issue_reports.count(), 1)
        self.assertEqual(society_issue_reports.count(), 1)
        self.assertEqual(event_issue_reports.count(), 1)
        
        # Verify content
        self.assertEqual(misconduct_reports.first().subject, "Misconduct Report")
        self.assertEqual(system_issue_reports.first().subject, "Website Error")
        self.assertEqual(society_issue_reports.first().subject, "Member Management Issue")
        self.assertEqual(event_issue_reports.first().subject, "Event Report")

    def test_filter_by_society_officer(self):
        """Test filtering reports by is_from_society_officer flag."""
        # Get counts before adding more data
        officer_reports = AdminReportRequest.objects.filter(is_from_society_officer=True)
        regular_reports = AdminReportRequest.objects.filter(is_from_society_officer=False)
        
        initial_officer_count = officer_reports.count()
        initial_regular_count = regular_reports.count()
        
        # Add more test data
        AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.president_student,
            report_type="Other",
            subject="Officer Report 2",
            details="Another report from an officer",
            is_from_society_officer=True
        )
        
        AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Other",
            subject="Regular Report 2",
            details="Another report from a regular student"
        )
        
        # Filter again
        officer_reports = AdminReportRequest.objects.filter(is_from_society_officer=True)
        regular_reports = AdminReportRequest.objects.filter(is_from_society_officer=False)
        
        # Verify counts increased
        self.assertEqual(officer_reports.count(), initial_officer_count + 1)
        self.assertEqual(regular_reports.count(), initial_regular_count + 1)
        
        # Verify the new reports are in the right category
        self.assertTrue(any(r.subject == "Officer Report 2" for r in officer_reports))
        self.assertTrue(any(r.subject == "Regular Report 2" for r in regular_reports))

    def test_ordering_by_requested_at(self):
        """Test ordering reports by requested_at timestamp."""
        # Get all reports and order by requested_at
        reports = AdminReportRequest.objects.all().order_by('requested_at')
        
        # Create a report with a future timestamp (we need to mock this since auto_now_add is used)
        future_report = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Other",
            subject="Future Report",
            details="This report has a future timestamp"
        )
        
        # Manually update the timestamp to be in the future (bypassing auto_now_add)
        future_time = timezone.now() + datetime.timedelta(days=1)
        AdminReportRequest.objects.filter(pk=future_report.pk).update(requested_at=future_time)
        future_report.refresh_from_db()
        
        # Get reports ordered by ascending and descending timestamps
        asc_reports = AdminReportRequest.objects.all().order_by('requested_at')
        desc_reports = AdminReportRequest.objects.all().order_by('-requested_at')
        
        # Verify ascending order (oldest first)
        self.assertNotEqual(future_report.pk, asc_reports.first().pk)
        self.assertEqual(future_report.pk, asc_reports.last().pk)
        
        # Verify descending order (newest first)
        self.assertEqual(future_report.pk, desc_reports.first().pk)
        self.assertNotEqual(future_report.pk, desc_reports.last().pk)

    def test_subject_max_length(self):
        """Test that subject respects max_length constraint."""
        # Test subject at max length (100 chars)
        max_length_subject = "A" * 100
        valid_report = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Other",
            subject=max_length_subject,
            details="Testing max length"
        )
        
        self.assertEqual(len(valid_report.subject), 100)
        
        # Test subject exceeding max length
        too_long_subject = "A" * 101
        invalid_report = AdminReportRequest(
            intent="CreateSoc",
            from_student=self.regular_student,
            report_type="Other",
            subject=too_long_subject,
            details="Testing max length"
        )
        
        with self.assertRaises(ValidationError):
            invalid_report.full_clean()

    def test_inheritance_from_request(self):
        """Test that AdminReportRequest properly inherits from the Request model."""
        # Verify the request has attributes from both AdminReportRequest and the parent Request model
        self.assertTrue(hasattr(self.student_report, 'report_type'))  # From AdminReportRequest
        self.assertTrue(hasattr(self.student_report, 'subject'))      # From AdminReportRequest
        self.assertTrue(hasattr(self.student_report, 'details'))      # From AdminReportRequest
        
        self.assertTrue(hasattr(self.student_report, 'intent'))       # From Request
        self.assertTrue(hasattr(self.student_report, 'requested_at')) # From Request
        self.assertTrue(hasattr(self.student_report, 'from_student')) # From Request
        
        # Test that intent is stored and retrieved correctly
        self.assertEqual(self.student_report.intent, "CreateSoc")