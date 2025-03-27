from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.utils import timezone
from datetime import timedelta

from api.models import User, Student, Notification


class TestStudentNotificationsView(APITestCase):
    """Tests for the StudentNotificationsView"""

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
        
        
        self.notification1 = Notification.objects.create(
            header="Test Notification 1",
            body="This is test notification 1",
            for_user=self.student_user,
            send_time=timezone.now() - timedelta(hours=1),
            is_read=False,
            is_important=True
        )
        
        self.notification2 = Notification.objects.create(
            header="Test Notification 2",
            body="This is test notification 2",
            for_user=self.student_user,
            send_time=timezone.now() - timedelta(minutes=30),
            is_read=False,
            is_important=False
        )
        
        
        self.other_notification = Notification.objects.create(
            header="Other Notification",
            body="This is a notification for another student",
            for_user=self.other_student_user,
            send_time=timezone.now() - timedelta(minutes=15),
            is_read=False,
            is_important=False
        )
        
        
        self.future_notification = Notification.objects.create(
            header="Future Notification",
            body="This notification is scheduled for the future",
            for_user=self.student_user,
            send_time=timezone.now() + timedelta(days=1),
            is_read=False,
            is_important=False
        )
        
        
        self.client = APIClient()
        self.url = reverse('student_notifications')
        
    def test_get_notifications_unauthenticated(self):
        """Test that unauthenticated users cannot access notifications"""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        
    def test_get_notifications_authenticated(self):
        """Test that authenticated students can get their notifications"""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        
        self.assertEqual(len(data), 2)
        
        
        notification_ids = [n['id'] for n in data]
        self.assertIn(self.notification1.id, notification_ids)
        self.assertIn(self.notification2.id, notification_ids)
        self.assertNotIn(self.future_notification.id, notification_ids)
        self.assertNotIn(self.other_notification.id, notification_ids)
        
        
        notification_1_data = next((n for n in data if n['id'] == self.notification1.id), None)
        self.assertIsNotNone(notification_1_data)
        self.assertEqual(notification_1_data['header'], "Test Notification 1")
        self.assertEqual(notification_1_data['body'], "This is test notification 1")
        self.assertFalse(notification_1_data['is_read'])
        self.assertTrue(notification_1_data['is_important'])
        
    def test_get_notifications_other_student(self):
        """Test that students only see their own notifications"""
        self.client.force_authenticate(user=self.other_student_user)
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        
        
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]['id'], self.other_notification.id)
        
    def test_mark_notification_as_read(self):
        """Test marking a notification as read"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('mark_notification_read', args=[self.notification1.id])
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(response.json()['id'], self.notification1.id)
        self.assertEqual(response.json()['message'], "Notification marked as read.")
        
        
        self.notification1.refresh_from_db()
        self.assertTrue(self.notification1.is_read)
        
        
        response = self.client.get(self.url)
        data = response.json()
        notification_1_data = next((n for n in data if n['id'] == self.notification1.id), None)
        self.assertIsNotNone(notification_1_data)
        self.assertTrue(notification_1_data['is_read'])
        
    def test_mark_nonexistent_notification_as_read(self):
        """Test marking a nonexistent notification as read"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('mark_notification_read', args=[99999])
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_mark_other_student_notification_as_read(self):
        """Test that students cannot mark other students' notifications as read"""
        self.client.force_authenticate(user=self.student_user)
        url = reverse('mark_notification_read', args=[self.other_notification.id])
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_admin_mark_notification_as_read(self):
        """Test that admins cannot mark notifications as read"""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('mark_notification_read', args=[self.notification1.id])
        
        response = self.client.patch(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()['error'], "Only students can mark notifications as read.")