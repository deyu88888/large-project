from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from api.models import User, Student, Notification


class TestStudentInboxView(APITestCase):
    """Tests for the StudentInboxView"""

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
        
        
        self.important_notification1 = Notification.objects.create(
            header="Important Notification 1",
            body="This is important notification 1",
            for_user=self.student_user,
            send_time=timezone.now() - timedelta(hours=1),
            is_read=False,
            is_important=True
        )
        
        self.important_notification2 = Notification.objects.create(
            header="Important Notification 2",
            body="This is important notification 2",
            for_user=self.student_user,
            send_time=timezone.now() - timedelta(minutes=30),
            is_read=True,  
            is_important=True
        )
        
        
        self.regular_notification = Notification.objects.create(
            header="Regular Notification",
            body="This is a regular notification",
            for_user=self.student_user,
            send_time=timezone.now() - timedelta(minutes=15),
            is_read=False,
            is_important=False  
        )
        
        
        self.other_important_notification = Notification.objects.create(
            header="Other Important Notification",
            body="This is an important notification for another student",
            for_user=self.other_student_user,
            send_time=timezone.now() - timedelta(minutes=45),
            is_read=False,
            is_important=True
        )
        
        
        self.future_important_notification = Notification.objects.create(
            header="Future Important",
            body="This important notification is scheduled for the future",
            for_user=self.student_user,
            send_time=timezone.now() + timedelta(days=1),
            is_read=False,
            is_important=True
        )
        
        
        self.client = APIClient()
        self.url = reverse('student_inbox')
        
    def test_get_inbox_unauthenticated(self):
        """Test that unauthenticated users cannot access the inbox"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_get_inbox_authenticated(self):
        """Test that authenticated students can get their important notifications"""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        
        self.assertEqual(len(data), 2)
        
        
        notification_ids = [n['id'] for n in data]
        self.assertIn(self.important_notification1.id, notification_ids)
        self.assertIn(self.important_notification2.id, notification_ids)
        self.assertNotIn(self.future_important_notification.id, notification_ids)
        self.assertNotIn(self.regular_notification.id, notification_ids)
        self.assertNotIn(self.other_important_notification.id, notification_ids)
        
        
        notification_1_data = next((n for n in data if n['id'] == self.important_notification1.id), None)
        self.assertIsNotNone(notification_1_data)
        self.assertEqual(notification_1_data['header'], "Important Notification 1")
        self.assertEqual(notification_1_data['body'], "This is important notification 1")
        self.assertFalse(notification_1_data['is_read'])
        self.assertTrue(notification_1_data['is_important'])
        
    def test_get_inbox_other_student(self):
        """Test that students only see their own important notifications"""
        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.other_important_notification.id)
        
    def test_delete_notification(self):
        """Test deleting a notification"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('student-inbox-delete', args=[self.important_notification1.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        
        with self.assertRaises(Notification.DoesNotExist):
            Notification.objects.get(id=self.important_notification1.id)
        
        
        response = self.client.get(self.url)
        data = response.json()
        notification_ids = [n['id'] for n in data]
        self.assertNotIn(self.important_notification1.id, notification_ids)
        self.assertIn(self.important_notification2.id, notification_ids)
        
    def test_delete_nonexistent_notification(self):
        """Test deleting a nonexistent notification"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('student-inbox-delete', args=[99999])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_delete_other_student_notification(self):
        """Test that students cannot delete other students' notifications"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('student-inbox-delete', args=[self.other_important_notification.id])
        
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)