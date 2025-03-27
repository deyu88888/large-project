from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.utils import timezone
import sys
from unittest.mock import MagicMock
sys.modules['transformers'] = MagicMock()
sys.modules['transformers.utils.import_utils'] = MagicMock()
sys.modules['transformers.models.bert.tokenization_bert_tf'] = MagicMock()
from freezegun import freeze_time

from api.models import (
    User, Student, Society, SocietyNews, NewsPublicationRequest, Notification
)
import json
import datetime

class TestAdminNewsApprovalView(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create admin user
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            first_name="Admin",
            last_name="User"
        )
        
        # Create second admin user
        self.admin_user2 = User.objects.create_user(
            username="admin_user2",
            email="admin2@example.com",
            password="password123",
            role="admin",
            first_name="Admin2",
            last_name="User"
        )
        
        # Create regular user
        self.regular_user = User.objects.create_user(
            username="regular_user",
            email="regular@example.com",
            password="password123",
            role="student",
            first_name="Regular",
            last_name="User"
        )
        
        # Create student user
        self.student = Student.objects.create_user(
            username="student_user",
            email="student@example.com",
            password="password123",
            first_name="Student",
            last_name="User",
            major="Computer Science"
        )
        
        # Create society
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student,
            approved_by=self.admin_user,
            social_media_links={"Email": "society@example.com"}
        )
        
        self.student.president_of = self.society
        self.student.save()
        
        # Create news posts
        self.news_post = SocietyNews.objects.create(
            title="Test News",
            content="This is test news content",
            society=self.society,
            author=self.student,
            status="Draft"
        )
        
        self.news_post2 = SocietyNews.objects.create(
            title="Another News",
            content="More news content",
            society=self.society,
            author=self.student,
            status="Draft"
        )
        
        # Create publication requests
        self.pending_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student,
            status="Pending"
        )
        
        self.approved_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post2,
            requested_by=self.student,
            status="Approved",
            reviewed_by=self.admin_user2,
            admin_notes="Looks good!"
        )
        
        self.get_detail_url = lambda request_id: reverse('admin_news_approval', args=[request_id])
    
    def test_approve_request_unauthorized(self):
        """Test that unauthorized users cannot approve requests"""
        
        response = self.client.put(
            self.get_detail_url(self.pending_request.id),
            {'status': 'Approved'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_approve_request_non_admin(self):
        """Test that non-admin users cannot approve requests"""
        self.client.force_authenticate(user=self.regular_user)
        
        response = self.client.put(
            self.get_detail_url(self.pending_request.id),
            {'status': 'Approved'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {
            "error": "Only admins can approve or reject publication requests"
        })
    
    def test_approve_nonexistent_request(self):
        """Test handling of non-existent request ID"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.put(
            self.get_detail_url(9999),  
            {'status': 'Approved'},
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {
            "error": "Publication request not found"
        })
    
    def test_approve_with_invalid_action(self):
        """Test validation for invalid action value"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.put(
            self.get_detail_url(self.pending_request.id),
            {'status': 'Invalid_Action'},  
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {
            "error": "Invalid action. Must be 'Approved' or 'Rejected'"
        })
    
    def test_approve_publication_request(self):
        """Test successful approval of a publication request"""
        self.client.force_authenticate(user=self.admin_user)
        
        fixed_time = datetime.datetime(2025, 3, 27, 12, 0, 0, tzinfo=timezone.utc)
        original_now = timezone.now
        
        try:
            timezone.now = lambda: fixed_time
            
            self.assertEqual(self.pending_request.status, "Pending")
            self.assertEqual(self.news_post.status, "Draft")
            
            response = self.client.put(
                self.get_detail_url(self.pending_request.id),
                {
                    'status': 'Approved',
                    'admin_notes': 'Excellent news post!'
                },
                format='json'
            )
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            self.pending_request.refresh_from_db()
            self.news_post.refresh_from_db()
            
            self.assertEqual(self.pending_request.status, "Approved")
            self.assertEqual(self.pending_request.reviewed_by, self.admin_user)
            self.assertEqual(self.pending_request.admin_notes, "Excellent news post!")
            self.assertIsNotNone(self.pending_request.reviewed_at)
            
            self.assertEqual(self.news_post.status, "Published")
            self.assertIsNotNone(self.news_post.published_at)
            
            notification = Notification.objects.filter(
                header="News Publication Approved",
                for_user=self.student
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertTrue(notification.is_important)
            expected_body = f"Your news publication request for '{self.news_post.title}' has been approved."
            self.assertEqual(notification.body, expected_body)
            
        finally:
            timezone.now = original_now
    
    def test_reject_publication_request(self):
        self.client.force_authenticate(user=self.admin_user)
        
        fixed_time = datetime.datetime(2025, 3, 27, 12, 0, 0, tzinfo=timezone.utc)
        original_now = timezone.now
        
        try:
            timezone.now = lambda: fixed_time
            
            response = self.client.put(
                self.get_detail_url(self.pending_request.id),
                {
                    'status': 'Rejected',
                    'admin_notes': 'Needs more details'
                },
                format='json'
            )
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            
            self.pending_request.refresh_from_db()
            self.news_post.refresh_from_db()
            
            self.assertEqual(self.pending_request.status, "Rejected")
            self.assertEqual(self.pending_request.reviewed_by, self.admin_user)
            self.assertEqual(self.pending_request.admin_notes, "Needs more details")
            
            self.assertEqual(self.news_post.status, "Rejected")
            
            notification = Notification.objects.filter(
                header="News Publication Rejected",
                for_user=self.student
            ).first()
            
            self.assertIsNotNone(notification)
            self.assertTrue(notification.is_important)
            expected_body = f"Your news publication request for '{self.news_post.title}' has been rejected. Admin notes: Needs more details"
            self.assertEqual(notification.body, expected_body)
            
        finally:
            timezone.now = original_now
    
    def test_reject_without_admin_notes(self):
        """Test rejection without admin notes"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.put(
            self.get_detail_url(self.pending_request.id),
            {'status': 'Rejected'},  
            format='json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        notification = Notification.objects.filter(
            header="News Publication Rejected",
            for_user=self.student
        ).first()
        
        self.assertIsNotNone(notification)
        expected_body = f"Your news publication request for '{self.news_post.title}' has been rejected."
        self.assertEqual(notification.body, expected_body)

    def tearDown(self):
        # Clean up files
        for society in Society.objects.all():
            if society.icon:
                try:
                    society.icon.delete(save=False)
                except:
                    pass
        
        for student in Student.objects.all():
            if student.icon:
                try:
                    student.icon.delete(save=False)
                except:
                    pass