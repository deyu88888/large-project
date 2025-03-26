from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from rest_framework.test import APIRequestFactory
from api.serializers import AdminReportRequestSerializer, ReportReplySerializer
from api.models import AdminReportRequest, ReportReply, Student
import datetime

User = get_user_model()

class AdminReportRequestSerializerTest(TestCase):
    """Test suite for the AdminReportRequestSerializer"""

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
        
        self.student2 = Student.objects.create(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            role="student",
            status="Approved"
        )
        
        
        self.report = AdminReportRequest.objects.create(
            from_student=self.student1,
            report_type="System Issue",
            subject="Test Report",
            details="This is a test report",
            intent="UpdateUse"
        )
        
        
        self.reply1 = ReportReply.objects.create(
            report=self.report,
            content="First reply to the report",
            replied_by=self.admin_user,
            is_admin_reply=True
        )
        
        self.reply2 = ReportReply.objects.create(
            report=self.report,
            content="Student response to report",
            replied_by=self.student1,
            is_admin_reply=False
        )
        
        
        self.nested_reply = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.reply1,
            content="Nested reply to admin's response",
            replied_by=self.student1,
            is_admin_reply=False
        )
        
        
        self.factory = APIRequestFactory()

    def _create_request(self, user):
        """Helper to create a request with the given user"""
        request = self.factory.get('/')
        request.user = user
        return request

    def test_serializer_contains_expected_fields(self):
        """Test that the serializer contains all expected fields"""
        serializer = AdminReportRequestSerializer(instance=self.report)
        data = serializer.data
        
        expected_fields = {
            'id', 'report_type', 'subject', 'details', 'requested_at', 
            'from_student', 'from_student_username', 'top_level_replies',
            'email'
        }
        
        self.assertEqual(set(data.keys()), expected_fields)
    
    def test_serializer_field_values(self):
        """Test that the serializer returns the correct values for fields"""
        serializer = AdminReportRequestSerializer(instance=self.report)
        data = serializer.data
        
        self.assertEqual(data['report_type'], "System Issue")
        self.assertEqual(data['subject'], "Test Report")
        self.assertEqual(data['details'], "This is a test report")
        self.assertEqual(data['from_student'], self.student1.id)
        self.assertEqual(data['from_student_username'], 'student1')
    
    def test_top_level_replies_data(self):
        """Test that top_level_replies returns only the direct replies"""
        serializer = AdminReportRequestSerializer(instance=self.report)
        data = serializer.data
        
        
        self.assertEqual(len(data['top_level_replies']), 2)
        
        
        reply_ids = [reply['id'] for reply in data['top_level_replies']]
        self.assertEqual(reply_ids[0], self.reply1.id)
        self.assertEqual(reply_ids[1], self.reply2.id)
        
        
        nested_reply_ids = [reply['id'] for reply in data['top_level_replies']]
        self.assertNotIn(self.nested_reply.id, nested_reply_ids)
    
    def test_nested_replies_in_parent(self):
        """Test that nested replies are included in their parents' child_replies"""
        serializer = AdminReportRequestSerializer(instance=self.report)
        data = serializer.data
        
        
        first_reply_data = data['top_level_replies'][0]
        
        
        self.assertIn('child_replies', first_reply_data)
        
        
        nested_reply_ids = [reply['id'] for reply in first_reply_data['child_replies']]
        self.assertIn(self.nested_reply.id, nested_reply_ids)
    
    def test_create_report_request(self):
        """Test creating a new report using the serializer"""
        data = {
            'report_type': 'System Issue',
            'subject': 'New Report Subject',
            'details': 'Details for the new report'
        }
        
        
        request = self._create_request(self.student1)
        context = {'request': request}
        
        serializer = AdminReportRequestSerializer(data=data, context=context)
        self.assertTrue(serializer.is_valid())
        
        
        report = serializer.save(from_student=self.student1, intent='UpdateSoc')
        
        
        self.assertEqual(report.report_type, 'System Issue')
        self.assertEqual(report.subject, 'New Report Subject')
        self.assertEqual(report.details, 'Details for the new report')
        self.assertEqual(report.from_student, self.student1)
        self.assertEqual(report.intent, 'UpdateSoc')
    
    def test_report_with_multiple_replies(self):
        """Test serializing a report with many replies at different levels"""
        
        for i in range(3):
            ReportReply.objects.create(
                report=self.report,
                content=f"Additional reply {i}",
                replied_by=self.student2,
                is_admin_reply=False
            )
        
        
        nested_reply2 = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.reply2,
            content="Nested reply to student's response",
            replied_by=self.admin_user,
            is_admin_reply=True
        )
        
        
        ReportReply.objects.create(
            report=self.report,
            parent_reply=nested_reply2,
            content="Third level reply",
            replied_by=self.student1,
            is_admin_reply=False
        )
        
        serializer = AdminReportRequestSerializer(instance=self.report)
        data = serializer.data
        
        
        self.assertEqual(len(data['top_level_replies']), 5)
        
        
        second_reply = next(reply for reply in data['top_level_replies'] if reply['id'] == self.reply2.id)
        self.assertEqual(len(second_reply['child_replies']), 1)
        
        
        nested_reply = second_reply['child_replies'][0]
        self.assertEqual(len(nested_reply['child_replies']), 1)
    
    def test_update_report_request(self):
        """Test updating a report using the serializer"""
        data = {
            'subject': 'Updated Subject',
            'details': 'Updated details for the report'
        }
        
        
        request = self._create_request(self.student1)
        context = {'request': request}
        
        serializer = AdminReportRequestSerializer(
            instance=self.report,
            data=data, 
            context=context,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_report = serializer.save()
        
        
        self.assertEqual(updated_report.subject, 'Updated Subject')
        self.assertEqual(updated_report.details, 'Updated details for the report')
        
        
        self.assertEqual(updated_report.report_type, 'System Issue')
        self.assertEqual(updated_report.from_student, self.student1)
    
    def test_from_student_read_only(self):
        """Test that from_student is a read-only field"""
        data = {
            'report_type': 'Society Issue',
            'subject': 'Read-only Test',
            'details': 'Testing read-only fields',
            'from_student': self.student2.id  
        }
        
        
        request = self._create_request(self.student1)
        context = {'request': request}
        
        serializer = AdminReportRequestSerializer(
            instance=self.report,
            data=data, 
            context=context,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_report = serializer.save()
        
        
        self.assertEqual(updated_report.from_student, self.student1)
    
    def test_requested_at_formatting(self):
        """Test that requested_at is formatted correctly"""
        
        specific_time = timezone.make_aware(datetime.datetime(2023, 5, 15, 10, 30, 45))
        AdminReportRequest.objects.filter(id=self.report.id).update(requested_at=specific_time)
        
        
        self.report.refresh_from_db()
        
        serializer = AdminReportRequestSerializer(instance=self.report)
        data = serializer.data
        
        
        self.assertIn('2023-05-15T10:30:45', data['requested_at'])
    
    def test_report_with_no_replies(self):
        """Test that a report with no replies has an empty top_level_replies list"""
        
        new_report = AdminReportRequest.objects.create(
            from_student=self.student2,
            report_type="Misconduct",
            subject="No Replies Report",
            details="This report has no replies",
            intent="CreateSoc"
        )
        
        serializer = AdminReportRequestSerializer(instance=new_report)
        data = serializer.data
        
        
        self.assertEqual(data['top_level_replies'], [])
    
    def test_invalid_report_type(self):
        """Test validation when an invalid report_type is provided"""
        data = {
            'report_type': 'Invalid Type',  
            'subject': 'Invalid Report',
            'details': 'Report with invalid type',
            'intent': 'UpdateSoc'
        }
        
        
        request = self._create_request(self.student1)
        context = {'request': request}
        
        serializer = AdminReportRequestSerializer(data=data, context=context)
        
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('report_type', serializer.errors)
    
    def test_missing_required_fields(self):
        """Test validation when required fields are missing"""
        
        data = {
            'report_type': 'System Issue',
            'details': 'Missing subject',
            'intent': 'UpdateSoc'
        }
        
        serializer = AdminReportRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('subject', serializer.errors)
        
        
        data = {
            'report_type': 'System Issue',
            'subject': 'Missing details',
            'intent': 'UpdateSoc'
        }
        
        serializer = AdminReportRequestSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('details', serializer.errors)