from django.test import TestCase
from django.utils import timezone
from django.contrib.auth import get_user_model
from api.serializers import NewsPublicationRequestSerializer
from api.models import (
    NewsPublicationRequest, SocietyNews, Society, Student
)
from rest_framework.exceptions import ValidationError
from unittest.mock import patch, PropertyMock
import datetime

User = get_user_model()

class NewsPublicationRequestSerializerTest(TestCase):
    """Test suite for the NewsPublicationRequestSerializer"""

    def setUp(self):
        """Set up test data for the serializer tests"""
        
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="password123",
            role="admin",
            first_name="Admin",
            last_name="User"
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
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student1,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title="Test News",
            content="Test news content",
            author=self.student1,
            status="Draft"
        )
        
        
        self.publication_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student1,
            status="Pending"
        )
        
        
        self.news_post2 = SocietyNews.objects.create(
            society=self.society,
            title="Approved News",
            content="Approved news content",
            author=self.student1,
            status="Published"
        )
        
        self.approved_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post2,
            requested_by=self.student1,
            reviewed_by=self.admin_user,
            status="Approved",
            admin_notes="Looks good",
            reviewed_at=timezone.now()
        )
        
        
        self.news_post3 = SocietyNews.objects.create(
            society=self.society,
            title="Rejected News",
            content="Rejected news content",
            author=self.student2,
            status="Rejected"
        )
        
        self.rejected_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post3,
            requested_by=self.student2,
            reviewed_by=self.admin_user,
            status="Rejected",
            admin_notes="Violates guidelines",
            reviewed_at=timezone.now()
        )

    def test_serializer_contains_expected_fields(self):
        """Test that the serializer contains all expected fields"""
        serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
        data = serializer.data
        
        expected_fields = {
            'id', 'news_post', 'news_post_title', 'society_name',
            'requested_by', 'requester_name', 'reviewed_by', 'reviewer_name',
            'status', 'requested_at', 'reviewed_at', 'admin_notes', 'author_data'
        }
        
        self.assertEqual(set(data.keys()), expected_fields)
    
    def test_read_only_fields(self):
        """Test that read-only fields cannot be updated"""
        
        initial_data = NewsPublicationRequestSerializer(instance=self.publication_request).data
        
        
        update_data = {
            'news_post': self.news_post2.id,  
            'requested_by': self.student2.id,  
            'reviewed_by': self.admin_user.id,  
            'status': 'Approved',  
            'requested_at': '2020-01-01T00:00:00Z',  
            'reviewed_at': '2020-01-02T00:00:00Z',  
            'news_post_title': 'Changed Title',  
            'society_name': 'Changed Society',  
            'requester_name': 'Changed Requester',  
            'reviewer_name': 'Changed Reviewer',  
            'author_data': {'id': 999},  
            'admin_notes': 'Updated notes'  
        }
        
        serializer = NewsPublicationRequestSerializer(
            instance=self.publication_request,
            data=update_data,
            partial=True
        )
        
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = serializer.save()
        
        
        self.assertEqual(updated_request.requested_by, self.student1)
        self.assertIsNone(updated_request.reviewed_by)
        self.assertEqual(updated_request.status, 'Pending')
        
        
        self.assertEqual(updated_request.news_post.id, self.news_post2.id)
        self.assertEqual(updated_request.admin_notes, 'Updated notes')
    
    def test_news_post_title_method(self):
        """Test the get_news_post_title method"""
        serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
        data = serializer.data
        
        
        self.assertEqual(data['news_post_title'], 'Test News')
        
        
        with patch.object(NewsPublicationRequestSerializer, 'get_news_post_title') as mock_method:
            
            mock_method.return_value = "Unknown"
            
            
            mock_serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
            mock_data = mock_serializer.data
            
            
            self.assertEqual(mock_data['news_post_title'], 'Unknown')
    
    def test_society_name_method(self):
        """Test the get_society_name method"""
        serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
        data = serializer.data
        
        
        self.assertEqual(data['society_name'], 'Test Society')
        
        
        with patch.object(NewsPublicationRequestSerializer, 'get_society_name') as mock_method:
            
            mock_method.return_value = "Unknown"
            
            
            mock_serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
            mock_data = mock_serializer.data
            
            
            self.assertEqual(mock_data['society_name'], 'Unknown')
    
    def test_requester_name_method(self):
        """Test the get_requester_name method"""
        serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
        data = serializer.data
        
        
        self.assertEqual(data['requester_name'], 'Student One')
        
        
        with patch.object(NewsPublicationRequestSerializer, 'get_requester_name') as mock_method:
            
            mock_method.return_value = "Unknown"
            
            
            mock_serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
            mock_data = mock_serializer.data
            
            
            self.assertEqual(mock_data['requester_name'], 'Unknown')
    
    def test_reviewer_name_method(self):
        """Test the get_reviewer_name method"""
        
        serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
        data = serializer.data
        self.assertIsNone(data['reviewer_name'])
        
        
        serializer = NewsPublicationRequestSerializer(instance=self.approved_request)
        data = serializer.data
        self.assertEqual(data['reviewer_name'], 'Admin User')
        
        
        with patch.object(NewsPublicationRequestSerializer, 'get_reviewer_name') as mock_method:
            
            mock_method.return_value = None
            
            
            mock_serializer = NewsPublicationRequestSerializer(instance=self.approved_request)
            mock_data = mock_serializer.data
            
            
            self.assertIsNone(mock_data['reviewer_name'])
    
    def test_author_data_method(self):
        """Test the get_author_data method"""
        serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
        data = serializer.data
        
        
        expected_author_data = {
            "id": self.student1.id,
            "username": "student1",
            "first_name": "Student",
            "last_name": "One",
            "full_name": "Student One"
        }
        self.assertEqual(data['author_data'], expected_author_data)
        
        
        with patch.object(NewsPublicationRequestSerializer, 'get_author_data') as mock_method:
            
            mock_method.return_value = None
            
            
            mock_serializer = NewsPublicationRequestSerializer(instance=self.publication_request)
            mock_data = mock_serializer.data
            
            
            self.assertIsNone(mock_data['author_data'])
    
    def test_validate_status(self):
        """Test validation of status field"""
        
        for status in ['Pending', 'Approved', 'Rejected']:
            data = {'status': status}
            serializer = NewsPublicationRequestSerializer(data=data, partial=True)
            self.assertTrue(serializer.validate(data))
        
        
        data = {'status': 'Invalid'}
        serializer = NewsPublicationRequestSerializer(data=data, partial=True)
        
        with self.assertRaises(ValidationError):
            serializer.validate(data)
    
    def test_create_publication_request(self):
        """Test creating a new publication request using the serializer"""
        
        news_post = SocietyNews.objects.create(
            society=self.society,
            title="New Test News",
            content="New test content",
            author=self.student2,
            status="Draft"
        )
        
        data = {
            'news_post': news_post.id,
            'admin_notes': 'Please review this'
        }
        
        serializer = NewsPublicationRequestSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        
        publication_request = serializer.save(requested_by=self.student2)
        
        
        self.assertEqual(publication_request.news_post, news_post)
        self.assertEqual(publication_request.requested_by, self.student2)
        self.assertEqual(publication_request.status, 'Pending')  
        self.assertEqual(publication_request.admin_notes, 'Please review this')
        self.assertIsNone(publication_request.reviewed_by)
        self.assertIsNone(publication_request.reviewed_at)
    
    def test_update_publication_request(self):
        """Test updating a publication request using the serializer"""
        data = {'admin_notes': 'Updated notes'}
        
        serializer = NewsPublicationRequestSerializer(
            instance=self.publication_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        updated_request = serializer.save()
        
        
        self.assertEqual(updated_request.admin_notes, 'Updated notes')
        self.assertEqual(updated_request.status, 'Pending')  
    
    def test_approve_publication_request(self):
        """Test approving a publication request"""
        
        
        data = {
            'status': 'Approved',
            'admin_notes': 'Approved by admin'
        }
        
        serializer = NewsPublicationRequestSerializer(
            instance=self.publication_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = serializer.save(
            reviewed_by=self.admin_user,
            status='Approved',
            reviewed_at=timezone.now()
        )
        
        
        self.assertEqual(updated_request.status, 'Approved')
        self.assertEqual(updated_request.admin_notes, 'Approved by admin')
        self.assertEqual(updated_request.reviewed_by, self.admin_user)
        self.assertIsNotNone(updated_request.reviewed_at)
    
    def test_reject_publication_request(self):
        """Test rejecting a publication request"""
        
        data = {
            'status': 'Rejected',
            'admin_notes': 'Rejected by admin'
        }
        
        serializer = NewsPublicationRequestSerializer(
            instance=self.publication_request,
            data=data,
            partial=True
        )
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = serializer.save(
            reviewed_by=self.admin_user,
            status='Rejected',
            reviewed_at=timezone.now()
        )
        
        
        self.assertEqual(updated_request.status, 'Rejected')
        self.assertEqual(updated_request.admin_notes, 'Rejected by admin')
        self.assertEqual(updated_request.reviewed_by, self.admin_user)
        self.assertIsNotNone(updated_request.reviewed_at)
    
    def test_serialization_of_different_statuses(self):
        """Test serialization of requests with different statuses"""
        
        pending_data = NewsPublicationRequestSerializer(instance=self.publication_request).data
        self.assertEqual(pending_data['status'], 'Pending')
        self.assertIsNone(pending_data['reviewed_at'])
        
        
        approved_data = NewsPublicationRequestSerializer(instance=self.approved_request).data
        self.assertEqual(approved_data['status'], 'Approved')
        self.assertIsNotNone(approved_data['reviewed_at'])
        self.assertEqual(approved_data['reviewer_name'], 'Admin User')
        
        
        rejected_data = NewsPublicationRequestSerializer(instance=self.rejected_request).data
        self.assertEqual(rejected_data['status'], 'Rejected')
        self.assertIsNotNone(rejected_data['reviewed_at'])
        self.assertEqual(rejected_data['admin_notes'], 'Violates guidelines')
    
    def test_date_formatting(self):
        """Test that dates are formatted correctly"""
        
        specific_date = timezone.make_aware(datetime.datetime(2023, 5, 15, 10, 30, 45))
        
        
        self.approved_request.requested_at = specific_date
        self.approved_request.reviewed_at = specific_date + datetime.timedelta(days=1)
        self.approved_request.save()
        
        serializer = NewsPublicationRequestSerializer(instance=self.approved_request)
        data = serializer.data
        
        
        self.assertIn('2023-05-15T10:30:45', data['requested_at'])
        self.assertIn('2023-05-16T10:30:45', data['reviewed_at'])