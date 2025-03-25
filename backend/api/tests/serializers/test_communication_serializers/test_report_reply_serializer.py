from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.serializers import ReportReplySerializer
from api.models import AdminReportRequest, ReportReply, Student

User = get_user_model()

class ReportReplySerializerTest(TestCase):
    """Test suite for the ReportReplySerializer"""

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
        
        
        self.parent_reply = ReportReply.objects.create(
            report=self.report,
            content="Admin response to the report",
            replied_by=self.admin_user,
            is_admin_reply=True
        )
        
        
        self.child_reply1 = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.parent_reply,
            content="Student response to admin",
            replied_by=self.student1,
            is_admin_reply=False
        )
        
        self.child_reply2 = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.parent_reply,
            content="Another admin response",
            replied_by=self.admin_user,
            is_admin_reply=True
        )
        
        
        self.nested_reply = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.child_reply1,
            content="Nested reply to student's response",
            replied_by=self.admin_user,
            is_admin_reply=True
        )

    def test_serializer_contains_expected_fields(self):
        """Test that the serializer contains all expected fields"""
        serializer = ReportReplySerializer(instance=self.parent_reply)
        data = serializer.data
        
        expected_fields = {
            'id', 'report', 'parent_reply', 'content', 'created_at',
            'replied_by', 'replied_by_username', 'is_admin_reply', 'child_replies'
        }
        
        self.assertEqual(set(data.keys()), expected_fields)
    
    def test_serializer_child_replies_data(self):
        """Test that child_replies returns the correct data"""
        serializer = ReportReplySerializer(instance=self.parent_reply)
        data = serializer.data
        
        
        self.assertEqual(len(data['child_replies']), 2)
        
        
        child_ids = [reply['id'] for reply in data['child_replies']]
        self.assertIn(self.child_reply1.id, child_ids)
        self.assertIn(self.child_reply2.id, child_ids)
        
        
        first_child = data['child_replies'][0]
        second_child = data['child_replies'][1]
        self.assertEqual(first_child['id'], self.child_reply1.id)
        self.assertEqual(second_child['id'], self.child_reply2.id)
    
    def test_nested_child_replies(self):
        """Test that nested replies are properly serialized"""
        serializer = ReportReplySerializer(instance=self.parent_reply)
        data = serializer.data
        
        
        child_reply_data = next(reply for reply in data['child_replies'] if reply['id'] == self.child_reply1.id)
        
        
        self.assertEqual(len(child_reply_data['child_replies']), 1)
        nested_reply_data = child_reply_data['child_replies'][0]
        self.assertEqual(nested_reply_data['id'], self.nested_reply.id)
        self.assertEqual(nested_reply_data['content'], "Nested reply to student's response")
    
    def test_username_field(self):
        """Test that replied_by_username field contains the correct username"""
        serializer = ReportReplySerializer(instance=self.parent_reply)
        data = serializer.data
        
        self.assertEqual(data['replied_by_username'], 'adminuser')
        
        
        child_reply_serializer = ReportReplySerializer(instance=self.child_reply1)
        child_data = child_reply_serializer.data
        
        self.assertEqual(child_data['replied_by_username'], 'student1')
    
    def test_read_only_fields(self):
        """Test that read-only fields cannot be updated"""
        data = {
            'report': self.report.id,
            'content': 'Updated content',
            'replied_by': self.student2.id,  
            'is_admin_reply': False,  
        }
        
        serializer = ReportReplySerializer(instance=self.parent_reply, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_reply = serializer.save()
        
        
        self.assertEqual(updated_reply.content, 'Updated content')
        
        
        self.assertEqual(updated_reply.replied_by, self.admin_user)
        self.assertTrue(updated_reply.is_admin_reply)
    
    def test_create_reply(self):
        """Test creating a new reply using the serializer"""
        data = {
            'report': self.report.id,
            'parent_reply': self.parent_reply.id,
            'content': 'New reply content',
        }
        
        serializer = ReportReplySerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        
        new_reply = serializer.save(
            replied_by=self.student2,
            is_admin_reply=False
        )
        
        
        self.assertEqual(new_reply.report, self.report)
        self.assertEqual(new_reply.parent_reply, self.parent_reply)
        self.assertEqual(new_reply.content, 'New reply content')
        self.assertEqual(new_reply.replied_by, self.student2)
        self.assertFalse(new_reply.is_admin_reply)
    
    def test_update_reply(self):
        """Test updating a reply using the serializer"""
        data = {
            'content': 'Updated content from serializer test',
        }
        
        serializer = ReportReplySerializer(instance=self.child_reply1, data=data, partial=True)
        self.assertTrue(serializer.is_valid())
        updated_reply = serializer.save()
        
        
        self.assertEqual(updated_reply.content, 'Updated content from serializer test')
        
        
        self.assertEqual(updated_reply.report, self.report)
        self.assertEqual(updated_reply.parent_reply, self.parent_reply)
        self.assertEqual(updated_reply.replied_by, self.student1)
        self.assertFalse(updated_reply.is_admin_reply)
    
    def test_serializer_validation_empty_content(self):
        """Test validation when content is empty"""
        data = {
            'report': self.report.id,
            'content': '',  
        }
        
        serializer = ReportReplySerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('content', serializer.errors)
    
    def test_serializer_validation_missing_report(self):
        """Test validation when report is missing"""
        data = {
            'content': 'Reply without report',
        }
        
        serializer = ReportReplySerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('report', serializer.errors)
    
    def test_serializer_data_types(self):
        """Test that serialized data has correct types"""
        serializer = ReportReplySerializer(instance=self.parent_reply)
        data = serializer.data
        
        
        self.assertIsInstance(data['id'], int)
        self.assertIsInstance(data['report'], int)
        self.assertIsNone(data['parent_reply'])  
        self.assertIsInstance(data['content'], str)
        self.assertIsInstance(data['created_at'], str)  
        self.assertIsInstance(data['replied_by'], int)
        self.assertIsInstance(data['replied_by_username'], str)
        self.assertIsInstance(data['is_admin_reply'], bool)
        self.assertIsInstance(data['child_replies'], list)
    
    def test_child_reply_has_correct_parent(self):
        """Test that a child reply correctly identifies its parent"""
        serializer = ReportReplySerializer(instance=self.child_reply1)
        data = serializer.data
        
        self.assertEqual(data['parent_reply'], self.parent_reply.id)
    
    def test_child_replies_ordering(self):
        """Test that child replies are ordered by created_at"""
        
        earlier_time = timezone.now() - timezone.timedelta(days=1)
        early_reply = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.parent_reply,
            content="Earlier reply",
            replied_by=self.student2,
            is_admin_reply=False,
            created_at=earlier_time
        )
        
        ReportReply.objects.filter(id=early_reply.id).update(created_at=earlier_time)
        
        
        early_reply.refresh_from_db()
        
        serializer = ReportReplySerializer(instance=self.parent_reply)
        data = serializer.data
        
        
        self.assertEqual(len(data['child_replies']), 3)
        
        
        self.assertEqual(data['child_replies'][0]['id'], early_reply.id)
        
        
        created_at_values = [reply['created_at'] for reply in data['child_replies']]
        self.assertEqual(created_at_values, sorted(created_at_values))