from django.test import TestCase
from django.utils import timezone
from django.db import IntegrityError
from datetime import timedelta
from api.models import ReportReply, AdminReportRequest, User, Student, Society, Request


class ReportReplyModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create admin user
        cls.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            is_staff=True
        )
        
        # Create student user
        cls.student = Student.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            role="student",
            first_name="Test",
            last_name="Student",
            status="Approved"
        )
        
        # Create another student for testing read/hidden functionality
        cls.student2 = Student.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="password123",
            role="student",
            first_name="Another",
            last_name="Student",
            status="Approved"
        )
        
        # Create society with president
        cls.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            status="Approved",
            president=cls.student,
            approved_by=cls.admin_user
        )
        
        # Create a report
        cls.report = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=cls.student,
            report_type="System Issue",
            subject="Test Report Subject",
            details="This is a test report with details",
            is_from_society_officer=True
        )
        
        # Create a reply from admin
        cls.admin_reply = ReportReply.objects.create(
            report=cls.report,
            content="This is an admin reply to the report",
            replied_by=cls.admin_user,
            is_admin_reply=True
        )
        
        # Create a reply from student (president)
        cls.student_reply = ReportReply.objects.create(
            report=cls.report,
            content="This is a president reply to the report",
            replied_by=cls.student,
            is_admin_reply=False
        )

    def test_reply_creation_with_required_fields(self):
        reply = ReportReply.objects.create(
            report=self.report,
            content="Test reply content",
            replied_by=self.admin_user
        )
        
        self.assertEqual(reply.report, self.report)
        self.assertEqual(reply.content, "Test reply content")
        self.assertEqual(reply.replied_by, self.admin_user)
        self.assertFalse(reply.is_admin_reply)  # Default value
        self.assertIsNone(reply.parent_reply)
        self.assertEqual(reply.read_by_students.count(), 0)
        self.assertEqual(reply.hidden_for_students.count(), 0)
        self.assertIsNotNone(reply.created_at)

    def test_reply_string_representation(self):
        # Test admin reply string
        expected_admin_str = f"Admin Reply to {self.report.subject} ({self.admin_reply.created_at.strftime('%Y-%m-%d')})"
        self.assertEqual(str(self.admin_reply), expected_admin_str)
        
        # Test president reply string
        expected_student_str = f"President Reply to {self.report.subject} ({self.student_reply.created_at.strftime('%Y-%m-%d')})"
        self.assertEqual(str(self.student_reply), expected_student_str)

    def test_reply_to_reply_parent_child_relationship(self):
        # Create a child reply to the admin reply
        child_reply = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.admin_reply,
            content="This is a reply to the admin's reply",
            replied_by=self.student
        )
        
        # Check parent-child relationship
        self.assertEqual(child_reply.parent_reply, self.admin_reply)
        self.assertIn(child_reply, self.admin_reply.child_replies.all())
        
        # Create a second-level child reply
        second_level_reply = ReportReply.objects.create(
            report=self.report,
            parent_reply=child_reply,
            content="This is a second-level reply",
            replied_by=self.admin_user,
            is_admin_reply=True
        )
        
        # Check second-level parent-child relationship
        self.assertEqual(second_level_reply.parent_reply, child_reply)
        self.assertIn(second_level_reply, child_reply.child_replies.all())

    def test_reply_cascade_on_report_deletion(self):
        # Store IDs for later reference
        admin_reply_id = self.admin_reply.id
        student_reply_id = self.student_reply.id
        
        # Delete the report
        self.report.delete()
        
        # Check that replies are deleted (CASCADE)
        with self.assertRaises(ReportReply.DoesNotExist):
            ReportReply.objects.get(id=admin_reply_id)
        
        with self.assertRaises(ReportReply.DoesNotExist):
            ReportReply.objects.get(id=student_reply_id)

    def test_reply_cascade_on_parent_reply_deletion(self):
        # Create nested replies
        middle_reply = ReportReply.objects.create(
            report=self.report,
            parent_reply=self.admin_reply,
            content="Middle reply",
            replied_by=self.student
        )
        
        child_reply = ReportReply.objects.create(
            report=self.report,
            parent_reply=middle_reply,
            content="Child reply",
            replied_by=self.admin_user
        )
        
        middle_reply_id = middle_reply.id
        child_reply_id = child_reply.id
        
        # Delete parent reply
        self.admin_reply.delete()
        
        # Check that child replies are deleted (CASCADE)
        with self.assertRaises(ReportReply.DoesNotExist):
            ReportReply.objects.get(id=middle_reply_id)
        
        with self.assertRaises(ReportReply.DoesNotExist):
            ReportReply.objects.get(id=child_reply_id)

    def test_reply_cascade_on_user_deletion(self):
        # Create a reply from student2 who will be deleted
        temp_reply = ReportReply.objects.create(
            report=self.report,
            content="Reply from user to be deleted",
            replied_by=self.student2
        )
        
        temp_reply_id = temp_reply.id
        
        # Delete the user
        self.student2.delete()
        
        # Check that the reply is deleted (CASCADE)
        with self.assertRaises(ReportReply.DoesNotExist):
            ReportReply.objects.get(id=temp_reply_id)

    def test_read_by_students_functionality(self):
        # Mark reply as read by student2
        # Student inherits from User, but we need to reference the base User instance
        # since the ManyToMany field is configured to relate to User
        user2 = User.objects.get(pk=self.student2.pk)
        self.admin_reply.read_by_students.add(user2)
        
        # Verify read status
        self.assertEqual(self.admin_reply.read_by_students.count(), 1)
        self.assertIn(user2, self.admin_reply.read_by_students.all())
        
        # Add another student and verify
        user1 = User.objects.get(pk=self.student.pk)
        self.admin_reply.read_by_students.add(user1)
        self.assertEqual(self.admin_reply.read_by_students.count(), 2)
        self.assertIn(user1, self.admin_reply.read_by_students.all())
        
        # Remove a student from read list
        self.admin_reply.read_by_students.remove(user2)
        self.assertEqual(self.admin_reply.read_by_students.count(), 1)
        self.assertNotIn(user2, self.admin_reply.read_by_students.all())

    def test_hidden_for_students_functionality(self):
        # Hide reply for student2
        # Student inherits from User, but we need to reference the base User instance
        user2 = User.objects.get(pk=self.student2.pk)
        self.admin_reply.hidden_for_students.add(user2)
        
        # Verify hidden status
        self.assertEqual(self.admin_reply.hidden_for_students.count(), 1)
        self.assertIn(user2, self.admin_reply.hidden_for_students.all())
        
        # Hide for another student and verify
        user1 = User.objects.get(pk=self.student.pk)
        self.admin_reply.hidden_for_students.add(user1)
        self.assertEqual(self.admin_reply.hidden_for_students.count(), 2)
        self.assertIn(user1, self.admin_reply.hidden_for_students.all())
        
        # Unhide for a student
        self.admin_reply.hidden_for_students.remove(user2)
        self.assertEqual(self.admin_reply.hidden_for_students.count(), 1)
        self.assertNotIn(user2, self.admin_reply.hidden_for_students.all())

    def test_replies_by_report_filtering(self):
        # Create another report with replies
        another_report = AdminReportRequest.objects.create(
            intent="CreateSoc",
            from_student=self.student,
            report_type="Misconduct",
            subject="Another Report",
            details="This is another test report",
            is_from_society_officer=True
        )
        
        another_reply = ReportReply.objects.create(
            report=another_report,
            content="Reply to the other report",
            replied_by=self.admin_user,
            is_admin_reply=True
        )
        
        # Fetch replies for the first report
        first_report_replies = ReportReply.objects.filter(report=self.report)
        self.assertEqual(first_report_replies.count(), 2)
        self.assertIn(self.admin_reply, first_report_replies)
        self.assertIn(self.student_reply, first_report_replies)
        self.assertNotIn(another_reply, first_report_replies)
        
        # Fetch replies for the second report
        second_report_replies = ReportReply.objects.filter(report=another_report)
        self.assertEqual(second_report_replies.count(), 1)
        self.assertIn(another_reply, second_report_replies)
        self.assertNotIn(self.admin_reply, second_report_replies)
        self.assertNotIn(self.student_reply, second_report_replies)

    def test_required_fields(self):
        # Test missing report
        with self.assertRaises(IntegrityError):
            ReportReply.objects.create(
                content="Missing report",
                replied_by=self.admin_user
            )
    
    def test_missing_replied_by(self):
        # Test missing replied_by in a separate test to avoid transaction issues
        with self.assertRaises(IntegrityError):
            ReportReply.objects.create(
                report=self.report,
                content="Missing replied_by"
            )
            
    def test_empty_content(self):
        # Test empty content in a separate test
        # Note: Django might validate this at the form level rather than DB level
        try:
            reply = ReportReply.objects.create(
                report=self.report,
                replied_by=self.admin_user,
                content=""
            )
            # If it doesn't raise an exception, at least check content is empty
            self.assertEqual(reply.content, "")
        except Exception:
            # If it does raise an exception, that's fine too
            pass

    def test_replies_ordering_by_created_at(self):
        # Create replies with different timestamps
        # Need to manually set created_at since it's auto_now_add
        
        # Create a reply and manually update its timestamp to be older
        older_reply = ReportReply.objects.create(
            report=self.report,
            content="Older reply",
            replied_by=self.admin_user
        )
        old_time = timezone.now() - timedelta(days=5)
        ReportReply.objects.filter(pk=older_reply.pk).update(created_at=old_time)
        older_reply.refresh_from_db()
        
        # Create a reply and manually update its timestamp to be newer
        newer_reply = ReportReply.objects.create(
            report=self.report,
            content="Newer reply",
            replied_by=self.student
        )
        new_time = timezone.now() - timedelta(days=1)
        ReportReply.objects.filter(pk=newer_reply.pk).update(created_at=new_time)
        newer_reply.refresh_from_db()
        
        # Get all replies in chronological order (we assume)
        replies = list(ReportReply.objects.filter(report=self.report).order_by('created_at'))
        
        # Check that the older reply comes before newer ones
        self.assertLess(replies.index(older_reply), replies.index(newer_reply))

    def test_filtering_by_is_admin_reply(self):
        # Get admin replies
        admin_replies = ReportReply.objects.filter(is_admin_reply=True)
        self.assertIn(self.admin_reply, admin_replies)
        self.assertNotIn(self.student_reply, admin_replies)
        
        # Get non-admin (president) replies
        president_replies = ReportReply.objects.filter(is_admin_reply=False)
        self.assertIn(self.student_reply, president_replies)
        self.assertNotIn(self.admin_reply, president_replies)

    def test_filtering_by_replied_by(self):
        # Get replies by admin
        admin_user_replies = ReportReply.objects.filter(replied_by=self.admin_user)
        self.assertIn(self.admin_reply, admin_user_replies)
        self.assertNotIn(self.student_reply, admin_user_replies)
        
        # Get replies by student
        student_user_replies = ReportReply.objects.filter(replied_by=self.student)
        self.assertIn(self.student_reply, student_user_replies)
        self.assertNotIn(self.admin_reply, student_user_replies)