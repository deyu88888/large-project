from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.test import TestCase
from django.contrib.auth import get_user_model

from api.models import (
    User, Student, Society, SocietyNews, 
    NewsPublicationRequest, Notification
)
from api.serializers import NewsPublicationRequestSerializer

User = get_user_model()

class AdminNewsApprovalViewTest(APITestCase):
    def setUp(self):
        
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            is_staff=True
        )
        
        
        self.student_user = Student.objects.create_user(
            username="student_user",
            email="student@example.com",
            password="password123",
            role="student",
            first_name="Student",
            last_name="User",
            status="Approved"
        )
        
        
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            status="Approved",
            president=self.student_user,
            approved_by=self.admin_user
        )
        
        
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title="Test News",
            content="This is a test news post",
            author=self.student_user,
            status="Draft"
        )
        
        
        self.publication_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student_user,
            status="Pending"
        )
        
        
        self.news_post2 = SocietyNews.objects.create(
            society=self.society,
            title="Another Test News",
            content="This is another test news post",
            author=self.student_user,
            status="Draft"
        )
        
        self.publication_request2 = NewsPublicationRequest.objects.create(
            news_post=self.news_post2,
            requested_by=self.student_user,
            status="Pending"
        )
        
        
        self.client = APIClient()
        
        
        
        self.get_url = '/api/news/publication-request/'
        self.put_url = lambda request_id: f'/api/news/publication-request/{request_id}/'

    def test_get_pending_requests_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.get_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        
        
        
        self.assertTrue(any(item['news_post_title'] == 'Test News' for item in response.data))
        self.assertTrue(any(item['news_post_title'] == 'Another Test News' for item in response.data))
        self.assertTrue(all(item['status'] == 'Pending' for item in response.data))

    def test_get_pending_requests_as_student(self):
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.get_url)
        
        
        
        if response.status_code == status.HTTP_200_OK:
            
            self.assertEqual(len(response.data), 2)
            for item in response.data:
                self.assertEqual(item['requested_by'], self.student_user.id)
        else:
            
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_get_pending_requests_unauthenticated(self):
        response = self.client.get(self.get_url)
        
        
        
        self.assertTrue(
            response.status_code == status.HTTP_401_UNAUTHORIZED or 
            response.status_code == status.HTTP_403_FORBIDDEN
        )

    def test_approve_request_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'status': 'Approved',
            'admin_notes': 'Looks good!'
        }
        
        response = self.client.put(self.put_url(self.publication_request.id), data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.publication_request.refresh_from_db()
        self.news_post.refresh_from_db()
        
        
        self.assertEqual(self.publication_request.status, 'Approved')
        self.assertEqual(self.news_post.status, 'Published')
        self.assertIsNotNone(self.news_post.published_at)
        self.assertEqual(self.publication_request.admin_notes, 'Looks good!')
        self.assertEqual(self.publication_request.reviewed_by, self.admin_user)
        
        
        notification = Notification.objects.get(for_user=self.student_user)
        self.assertEqual(notification.header, 'News Publication Approved')
        self.assertTrue('has been approved' in notification.body)
        self.assertTrue(notification.is_important)

    def test_reject_request_as_admin(self):
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'status': 'Rejected',
            'admin_notes': 'Content violates guidelines'
        }
        
        response = self.client.put(self.put_url(self.publication_request.id), data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.publication_request.refresh_from_db()
        self.news_post.refresh_from_db()
        
        
        self.assertEqual(self.publication_request.status, 'Rejected')
        self.assertEqual(self.news_post.status, 'Rejected')
        self.assertEqual(self.publication_request.admin_notes, 'Content violates guidelines')
        self.assertEqual(self.publication_request.reviewed_by, self.admin_user)
        
        
        notification = Notification.objects.get(for_user=self.student_user)
        self.assertEqual(notification.header, 'News Publication Rejected')
        self.assertTrue('has been rejected' in notification.body)
        self.assertTrue('Content violates guidelines' in notification.body)
        self.assertTrue(notification.is_important)

    def test_approve_request_as_student(self):
        self.client.force_authenticate(user=self.student_user)
        
        data = {
            'status': 'Approved'
        }
        
        response = self.client.put(self.put_url(self.publication_request.id), data)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        
        self.publication_request.refresh_from_db()
        self.news_post.refresh_from_db()
        self.assertEqual(self.publication_request.status, 'Pending')
        self.assertEqual(self.news_post.status, 'Draft')

    def test_invalid_action(self):
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'status': 'InvalidStatus'
        }
        
        response = self.client.put(self.put_url(self.publication_request.id), data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        
        self.publication_request.refresh_from_db()
        self.news_post.refresh_from_db()
        self.assertEqual(self.publication_request.status, 'Pending')
        self.assertEqual(self.news_post.status, 'Draft')

    def test_nonexistent_request(self):
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'status': 'Approved'
        }
        
        nonexistent_id = 9999
        response = self.client.put(self.put_url(nonexistent_id), data)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_no_pending_requests(self):
        
        NewsPublicationRequest.objects.all().update(status='Approved')
        
        self.client.force_authenticate(user=self.admin_user)
        response = self.client.get(self.get_url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  

    def test_approve_already_approved_request(self):
        
        self.publication_request.status = 'Approved'
        self.publication_request.reviewed_by = self.admin_user
        self.publication_request.reviewed_at = timezone.now()
        self.publication_request.save()
        
        self.news_post.status = 'Published'
        self.news_post.published_at = timezone.now()
        self.news_post.save()
        
        
        self.client.force_authenticate(user=self.admin_user)
        
        data = {
            'status': 'Approved'
        }
        
        response = self.client.put(self.put_url(self.publication_request.id), data)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)