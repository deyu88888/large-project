from django.test import TestCase
from django.urls import reverse
from django.db.models import Q
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import json
from datetime import timedelta
from django.utils import timezone

from api.models import User, Student, AdminReportRequest, ReportReply


class TestReportReplyNotificationsView(APITestCase):
    """Tests for the ReportReplyNotificationsView"""

    def setUp(self):
        """Set up test data for each test method"""
        
        self.student_user = Student.objects.create_user(
            username='student1',
            email='student1@example.com',
            password='password123',
            first_name='Student',
            last_name='One',
            role='student'
        )
        
        
        self.other_student_user = Student.objects.create_user(
            username='student2',
            email='student2@example.com',
            password='password123',
            first_name='Student',
            last_name='Two',
            role='student'
        )
        
        
        self.admin_user = User.objects.create_user(
            username='admin1',
            email='admin1@example.com',
            password='password123',
            first_name='Admin',
            last_name='One',
            role='admin'
        )
        
        
        self.super_admin_user = User.objects.create_user(
            username='superadmin',
            email='superadmin@example.com',
            password='password123',
            first_name='Super',
            last_name='Admin',
            is_super_admin=True
        )
        
        
        
        self.student_user_base = User.objects.get(pk=self.student_user.pk)
        self.other_student_user_base = User.objects.get(pk=self.other_student_user.pk)
        
        
        self.report1 = AdminReportRequest.objects.create(
            from_student=self.student_user,
            report_type="System Issue",
            subject="Cannot access course materials",
            details="I'm unable to access my course materials since yesterday."
        )
        
        self.report2 = AdminReportRequest.objects.create(
            from_student=self.student_user,
            report_type="Feedback",
            subject="Suggestion for platform",
            details="It would be great if we could have a dark mode."
        )
        
        self.other_student_report = AdminReportRequest.objects.create(
            from_student=self.other_student_user,
            report_type="Other",
            subject="General question",
            details="When will the next semester start?"
        )
        
        
        self.admin_reply = ReportReply.objects.create(
            report=self.report1,
            replied_by=self.admin_user,
            content="We're looking into this issue. Please try clearing your browser cache.",
            created_at=timezone.now() - timedelta(days=1)
        )
        
        self.super_admin_reply = ReportReply.objects.create(
            report=self.report2,
            replied_by=self.super_admin_user,
            content="Thanks for the suggestion! We are considering adding a dark mode in our next update.",
            created_at=timezone.now() - timedelta(hours=5)
        )
        
        self.other_student_reply = ReportReply.objects.create(
            report=self.other_student_report,
            replied_by=self.admin_user,
            content="The next semester will start on September 1st.",
            created_at=timezone.now() - timedelta(hours=2)
        )
        
        
        long_content = "This is a very long reply that should be truncated in the preview. " * 10
        self.long_reply = ReportReply.objects.create(
            report=self.report1,
            replied_by=self.admin_user,
            content=long_content,
            created_at=timezone.now()
        )
        
        
        self.client = APIClient()
        self.url = reverse('report-reply-notifications')
        
    def test_get_notifications_unauthenticated(self):
        """Test that unauthenticated users cannot access notifications"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_get_notifications_authenticated(self):
        """Test that authenticated students can get their report reply notifications"""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        
        self.assertEqual(len(data), 3)
        
        
        self.assertEqual(data[0]['id'], self.long_reply.id)
        self.assertEqual(data[1]['id'], self.super_admin_reply.id)
        self.assertEqual(data[2]['id'], self.admin_reply.id)
        
        
        notification = data[0]
        self.assertEqual(notification['report_id'], self.report1.id)
        self.assertEqual(notification['header'], "New Reply to Your Report")
        self.assertEqual(notification['body'], f"Admin One replied to your report regarding System Issue")
        self.assertFalse(notification['is_read'])
        self.assertEqual(notification['type'], "report_reply")
        
        
        self.assertTrue(notification['content_preview'].endswith('...'))
        self.assertTrue(len(notification['content_preview']) <= 103)  
        
    def test_get_notifications_other_student(self):
        """Test that students only see their own notifications"""
        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.other_student_reply.id)
        
    def test_mark_notification_as_read(self):
        """Test marking a notification as read"""
        
        self.admin_reply.read_by_students.clear()
        
        
        self.client.force_authenticate(user=self.student_user)
        
        
        url = reverse('mark-report-reply-read', args=[self.admin_reply.id])
        mark_response = self.client.patch(url)
        self.assertEqual(mark_response.status_code, status.HTTP_200_OK)
        
        
        self.admin_reply.refresh_from_db()
        self.assertTrue(
            self.admin_reply.read_by_students.filter(id=self.student_user_base.id).exists(),
            "The admin_reply should have the student in read_by_students"
        )
                
    def test_mark_nonexistent_notification_as_read(self):
        """Test marking a nonexistent notification as read"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('mark-report-reply-read', args=[99999])
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_mark_other_student_notification_as_read(self):
        """Test that students cannot mark other students' notifications as read"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('mark-report-reply-read', args=[self.other_student_reply.id])
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_delete_notification(self):
        """Test hiding a notification"""
        
        self.client.force_authenticate(user=self.student_user)
        
        
        initial_response = self.client.get(self.url)
        initial_data = initial_response.json()
        notification_ids = [n['id'] for n in initial_data]
        self.assertIn(self.admin_reply.id, notification_ids, "Admin reply should be visible initially")
        
        
        url = reverse('mark-report-reply-read', args=[self.admin_reply.id])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        
        self.admin_reply.refresh_from_db()
        self.assertTrue(
            self.admin_reply.hidden_for_students.filter(id=self.student_user_base.id).exists(),
            "The admin_reply should have the student in hidden_for_students"
        )
        
        
        response = self.client.get(self.url)
        data = response.json()
        notification_ids = [n['id'] for n in data]
        self.assertNotIn(self.admin_reply.id, notification_ids, "Admin reply should not be visible after hiding")
        
    def test_delete_nonexistent_notification(self):
        """Test hiding a nonexistent notification"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('mark-report-reply-read', args=[99999])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_delete_other_student_notification(self):
        """Test that students cannot hide other students' notifications"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('mark-report-reply-read', args=[self.other_student_reply.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)