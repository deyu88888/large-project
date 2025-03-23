import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from api.models import (
    User, Student, Society, SocietyNews, 
    NewsPublicationRequest
)
from api.serializers import NewsPublicationRequestSerializer


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def admin_user():
    admin = User.objects.create_user(
        username='adminuser',
        email='admin@example.com',
        password='adminpassword',
        first_name='Admin',
        last_name='User',
        role='admin',
        is_staff=True
    )
    return admin


@pytest.fixture
def student_user():
    # Create a student directly (one-phase creation)
    student = Student.objects.create(
        username='studentuser',
        email='student@example.com',
        password='studentpassword',
        first_name='Student',
        last_name='User',
        role='student'
    )
    
    return student


@pytest.fixture
def another_student():
    # Create another student directly
    student = Student.objects.create(
        username='anotherstudent',
        email='another@example.com',
        password='studentpassword',
        first_name='Another',
        last_name='Student',
        role='student'
    )
    
    return student


@pytest.fixture
def society(student_user, admin_user):
    society = Society.objects.create(
        name='Test Society',
        description='Society for testing',
        president=student_user,
        approved_by=admin_user,
        status='Approved'
    )
    return society


@pytest.fixture
def news_post(society, student_user):
    news = SocietyNews.objects.create(
        society=society,
        title='Test News Post',
        content='This is a test news post content',
        author=student_user,
        status='Draft'
    )
    return news


@pytest.fixture
def pending_publication_request(news_post, student_user):
    return NewsPublicationRequest.objects.create(
        news_post=news_post,
        requested_by=student_user,
        status='Pending'
    )


@pytest.mark.django_db
class TestNewsPublicationRequestView:
    """
    Tests for the NewsPublicationRequestView
    """
    
    def test_post_create_publication_request_success(self, api_client, student_user, news_post):
        """Test successful creation of a publication request"""
        # Authenticate as the student who is the author
        api_client.force_authenticate(user=student_user)
        
        # Use the correct URL path from urls.py
        url = '/api/news/publication-request/'
        data = {'news_post': news_post.id}
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_201_CREATED
        assert NewsPublicationRequest.objects.count() == 1
        
        # Verify the response data
        publication_request = NewsPublicationRequest.objects.first()
        assert publication_request.news_post.id == news_post.id
        assert publication_request.requested_by.id == student_user.id
        assert publication_request.status == 'Pending'
        
        # Check serialized fields are present in response
        assert 'news_post_title' in response.data
        assert 'society_name' in response.data
        assert 'requester_name' in response.data
    
    def test_post_non_student_denied(self, api_client, admin_user, news_post):
        """Test that non-students cannot create publication requests"""
        # Authenticate as an admin user (not a student)
        api_client.force_authenticate(user=admin_user)
        
        url = '/api/news/publication-request/'
        data = {'news_post': news_post.id}
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert NewsPublicationRequest.objects.count() == 0
        assert "Only students can submit publication requests" in response.data['error']
    
    def test_post_missing_news_post_id(self, api_client, student_user):
        """Test that missing news_post parameter returns an error"""
        api_client.force_authenticate(user=student_user)
        
        url = '/api/news/publication-request/'
        data = {}  # No news_post ID
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "News post ID is required" in response.data['error']
    
    def test_post_news_post_not_found(self, api_client, student_user):
        """Test with non-existent news post ID"""
        api_client.force_authenticate(user=student_user)
        
        url = '/api/news/publication-request/'
        data = {'news_post': 99999}  # Non-existent ID
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_404_NOT_FOUND
        assert "News post not found" in response.data['error']
    
    def test_post_no_permission(self, api_client, another_student, news_post):
        """Test that a student without proper permissions cannot create a publication request"""
        # Authenticate as a different student (not the author or society officer)
        api_client.force_authenticate(user=another_student)
        
        url = '/api/news/publication-request/'
        data = {'news_post': news_post.id}
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "You do not have permission to publish this news post" in response.data['error']
    
    def test_post_existing_request(self, api_client, student_user, news_post, pending_publication_request):
        """Test that duplicate pending requests are rejected"""
        # A pending request already exists (from the fixture)
        api_client.force_authenticate(user=student_user)
        
        url = '/api/news/publication-request/'
        data = {'news_post': news_post.id}
        
        response = api_client.post(url, data, format='json')
        
        assert response.status_code == status.HTTP_400_BAD_REQUEST
        assert "A publication request for this news post is already pending" in response.data['error']
        
        # Verify only one request exists
        assert NewsPublicationRequest.objects.count() == 1
    
    def test_post_non_draft_status(self, api_client, student_user, society):
        """Test creating a request for a post that is not in Draft status"""
        # Create a news post with a non-Draft status
        news = SocietyNews.objects.create(
            society=society,
            title='Non-Draft News',
            content='This post is already pending approval',
            author=student_user,
            status='PendingApproval'  # Note: not Draft
        )
        
        api_client.force_authenticate(user=student_user)
        
        url = '/api/news/publication-request/'
        data = {'news_post': news.id}
        
        response = api_client.post(url, data, format='json')
        
        # Should succeed now that the "must be Draft" check was removed
        assert response.status_code == status.HTTP_201_CREATED
        
        # Verify the request was created
        assert NewsPublicationRequest.objects.filter(news_post=news).exists()
    
    def test_get_student_own_requests(self, api_client, student_user, pending_publication_request):
        """Test that students can see their own publication requests"""
        api_client.force_authenticate(user=student_user)
        
        url = '/api/news/publication-request/'
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == pending_publication_request.id
        
        # Check that serialized fields from the serializer are present
        assert 'news_post_title' in response.data[0]
        assert 'society_name' in response.data[0]
        assert 'requester_name' in response.data[0]
    
    def test_get_admin_pending_requests(self, api_client, admin_user, pending_publication_request):
        """Test that admins can see pending publication requests"""
        api_client.force_authenticate(user=admin_user)
        
        url = '/api/news/publication-request/'
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1
        assert response.data[0]['id'] == pending_publication_request.id
    
    def test_get_admin_all_requests(self, api_client, admin_user, news_post, student_user):
        """Test that admins can see all publication requests regardless of status"""
        # Create requests with different statuses
        pending = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user,
            status='Pending'
        )
        
        approved = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user,
            status='Approved',
            reviewed_by=admin_user,
            reviewed_at="2023-01-01T12:00:00Z"
        )
        
        rejected = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user,
            status='Rejected',
            reviewed_by=admin_user,
            reviewed_at="2023-01-02T12:00:00Z",
            admin_notes="This post violates guidelines"
        )
        
        api_client.force_authenticate(user=admin_user)
        
        # With all_statuses=true
        url = '/api/news/publication-request/?all_statuses=true'
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 3  # All three requests
        
        # Verify we get serialized fields for all entries
        for entry in response.data:
            assert 'news_post_title' in entry
            assert 'society_name' in entry
            assert 'requester_name' in entry
        
        # Check that reviewer name is correctly included for reviewed requests
        reviewed_requests = [r for r in response.data if r['status'] in ['Approved', 'Rejected']]
        for entry in reviewed_requests:
            assert entry['reviewer_name'] is not None
            assert 'admin_notes' in entry
            
        # Check that the rejected request has admin notes
        rejected_request = next(r for r in response.data if r['status'] == 'Rejected')
        assert rejected_request['admin_notes'] == "This post violates guidelines"
        
        # Without all_statuses parameter (default behavior)
        url = '/api/news/publication-request/'
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_200_OK
        assert len(response.data) == 1  # Only pending requests
        assert response.data[0]['id'] == pending.id
    
    def test_get_unauthorized_user(self, api_client):
        """Test that unauthorized users cannot access publication requests"""
        # Not authenticating the client
        
        url = '/api/news/publication-request/'
        
        response = api_client.get(url)
        
        # Should get 401 Unauthorized since we're not authenticated
        assert response.status_code == status.HTTP_401_UNAUTHORIZED
    
    def test_get_non_admin_non_student(self, api_client):
        """Test with a user who is neither admin nor student"""
        # Create a regular user (not admin, not student)
        regular_user = User.objects.create_user(
            username='regularuser',
            email='regular@example.com',
            password='password',
            role='user'  # Not 'student' or 'admin'
        )
        
        api_client.force_authenticate(user=regular_user)
        
        url = '/api/news/publication-request/'
        
        response = api_client.get(url)
        
        assert response.status_code == status.HTTP_403_FORBIDDEN
        assert "Unauthorized" in response.data['error']