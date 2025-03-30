from django.test import TestCase
from django.utils import timezone
from api.models import User, Student, AdminReportRequest, ReportReply
from api.serializers import ReportReplySerializer
from unittest import mock


class ReportReplySerializerTestCase(TestCase):
    """
    Unit tests for the ReportReplySerializer class
    """
    def setUp(self):
        self.student = Student.objects.create_user(
            username='test_student',
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            password='password123',
            role='student',
            major='Computer Science'
        )
        
        self.admin = User.objects.create_user(
            username='admin_user',
            first_name='Admin',
            last_name='User',
            email='admin@example.com',
            password='password123',
            role='admin'
        )

        self.president = Student.objects.create_user(
            username='president_user',
            first_name='President',
            last_name='User',
            email='president@example.com',
            password='password123',
            role='president',
            major='Business Administration'
        )
        
        self.report_request = AdminReportRequest.objects.create(
            from_student=self.student,
            report_type="Misconduct",
            subject="Test Report Request",
            details="This is a test report request content",
            intent="CreateUse",
            approved=False
        )
        
        self.parent_reply = ReportReply.objects.create(
            report=self.report_request,
            content="This is a parent reply",
            replied_by=self.admin,
            is_admin_reply=True
        )
        
        self.child_reply = ReportReply.objects.create(
            report=self.report_request,
            parent_reply=self.parent_reply,
            content="This is a child reply",
            replied_by=self.president,
            is_admin_reply=False
        )
        
        self.serializer = None
        self.data = {
            "report": self.report_request.id,
            "parent_reply": self.parent_reply.id,
            "content": "This is a new reply"
        }

    def test_reply_serialization(self):
        """Test ReportReplySerializer serialization without mocking"""
        self.serializer = ReportReplySerializer(instance=self.parent_reply)
        data = self.serializer.data
        
        self.assertEqual(data['id'], self.parent_reply.id)
        self.assertEqual(data['report'], self.report_request.id)
        self.assertIsNone(data['parent_reply'])
        self.assertEqual(data['content'], "This is a parent reply")
        self.assertEqual(data['replied_by'], self.admin.id)
        self.assertEqual(data['replied_by_username'], self.admin.username)
        self.assertTrue(data['is_admin_reply'])

    def test_reply_deserialization(self):
        """Test ReportReplySerializer deserialization"""
        request = mock.MagicMock()
        request.user = self.president
        self.serializer = ReportReplySerializer(data=self.data, context={'request': request})
        
        self._assert_serializer_is_valid()
        reply = self.serializer.save(replied_by=self.president)
        
        self.assertEqual(reply.report.id, self.data['report'])
        self.assertEqual(reply.parent_reply.id, self.data['parent_reply'])
        self.assertEqual(reply.content, self.data['content'])
        self.assertEqual(reply.replied_by, self.president)
        self.assertFalse(reply.is_admin_reply)  # Should be False for president
        
    def test_admin_reply_deserialization(self):
        """Test ReportReplySerializer with admin user"""
        request = mock.MagicMock()
        request.user = self.admin
        self.serializer = ReportReplySerializer(data=self.data, context={'request': request})
        
        self._assert_serializer_is_valid()
        reply = self.serializer.save(replied_by=self.admin, is_admin_reply=True)
        
        self.assertEqual(reply.report.id, self.data['report'])
        self.assertEqual(reply.parent_reply.id, self.data['parent_reply'])
        self.assertEqual(reply.content, self.data['content'])
        self.assertEqual(reply.replied_by, self.admin)
        self.assertTrue(reply.is_admin_reply)
        
    def test_nested_replies_serialization(self):
        """Test nested structure in serialization"""
        second_child = ReportReply.objects.create(
            report=self.report_request,
            parent_reply=self.child_reply,
            content="Second level reply",
            replied_by=self.admin,
            is_admin_reply=True
        )
        
        self.serializer = ReportReplySerializer(instance=self.parent_reply)
        data = self.serializer.data
        self.assertIn('child_replies', data)
        
    def test_read_only_fields(self):
        """Test that read-only fields cannot be set during creation"""
        data_with_readonly = self.data.copy()
        data_with_readonly.update({
            'replied_by': self.admin.id,
            'is_admin_reply': True,
            'replied_by_username': 'hacker'
        })
        
        request = mock.MagicMock()
        request.user = self.president
        self.serializer = ReportReplySerializer(data=data_with_readonly, context={'request': request})
        
        self._assert_serializer_is_valid()
        reply = self.serializer.save(replied_by=self.president)
        
        self.assertEqual(reply.replied_by, self.president)
        self.assertFalse(reply.is_admin_reply)
        
    def test_update_reply(self):
        """Test updating a reply"""
        update_data = {
            'content': 'Updated content'
        }
        
        self.serializer = ReportReplySerializer(
            instance=self.child_reply,
            data=update_data,
            partial=True
        )
        
        self._assert_serializer_is_valid()
        updated_reply = self.serializer.save()
        
        self.assertEqual(updated_reply.content, 'Updated content')
        self.assertEqual(updated_reply.report, self.report_request)
        self.assertEqual(updated_reply.parent_reply, self.parent_reply)
        self.assertEqual(updated_reply.replied_by, self.president)
        
        self.child_reply.refresh_from_db()
        self.assertEqual(self.child_reply.content, 'Updated content')
        
    def test_missing_required_fields(self):
        """Test validation for missing required fields"""
        incomplete_data = {
            'content': 'Reply without report'
            # Missing 'report' field
        }
        
        self.serializer = ReportReplySerializer(data=incomplete_data)
        self.assertFalse(self.serializer.is_valid())
        self.assertIn('report', self.serializer.errors)
        
    def test_parent_without_report(self):
        """Test validation when parent_reply is provided but report is not"""
        parent_only_data = {
            'parent_reply': self.parent_reply.id,
            'content': 'Reply with parent but no report'
        }
        
        self.serializer = ReportReplySerializer(data=parent_only_data)
        if self.serializer.is_valid():
            reply = self.serializer.save(replied_by=self.president)
            self.assertEqual(reply.report, self.parent_reply.report)
        
    def test_read_by_students_field(self):
        """Test the read_by_students M2M field"""
        user_instance = User.objects.get(pk=self.student.pk)
        self.parent_reply.read_by_students.add(user_instance)
        
        self.assertTrue(
            self.parent_reply.read_by_students.filter(pk=user_instance.pk).exists(),
            "User should be in read_by_students"
        )
            
    def test_hidden_for_students_field(self):
        """Test the hidden_for_students M2M field"""
        user_instance = User.objects.get(pk=self.student.pk)
        self.parent_reply.hidden_for_students.add(user_instance)
        self.assertTrue(
            self.parent_reply.hidden_for_students.filter(pk=user_instance.pk).exists(),
            "User should be in hidden_for_students"
        )
            
    def test_reply_to_society_officer_report(self):
        """Test replying to a report from a society officer"""
        president_report = AdminReportRequest.objects.create(
            from_student=self.president,
            report_type="Society Issue",
            subject="Society President Report",
            details="This is a report from a society president",
            intent="CreateUse",
            approved=False,
            is_from_society_officer=True
        )
        
        admin_reply_data = {
            "report": president_report.id,
            "content": "Admin response to society officer"
        }
        
        self.serializer = ReportReplySerializer(data=admin_reply_data)
        self._assert_serializer_is_valid()
        reply = self.serializer.save(replied_by=self.admin, is_admin_reply=True)
        
        self.assertEqual(reply.report, president_report)
        self.assertEqual(reply.content, "Admin response to society officer")
        self.assertTrue(reply.is_admin_reply)
        
    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail(f"Test serializer should be valid. Errors: {self.serializer.errors}")