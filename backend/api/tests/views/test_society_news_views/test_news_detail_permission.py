import unittest
from unittest.mock import patch, MagicMock
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser

from api.views import NewsDetailPermission
from api.models import User, Student, Society, SocietyNews

class TestNewsDetailPermission(TestCase):
    def setUp(self):
        """Set up test environment with necessary data."""
        self.admin_user = User.objects.create_user(
            username='admin123', 
            email='admin@example.com', 
            password='password',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        self.member_student = Student.objects.create(
            username='member123', 
            email='member@example.com', 
            password='password',
            first_name='Member',
            last_name='Student'
        )
        
        self.officer_student = Student.objects.create(
            username='officer123', 
            email='officer@example.com', 
            password='password',
            first_name='Officer',
            last_name='Student',
            is_event_manager=True
        )
        
        self.non_member_student = Student.objects.create(
            username='nonmember123', 
            email='nonmember@example.com', 
            password='password',
            first_name='NonMember',
            last_name='Student'
        )
        
        self.non_student_user = User.objects.create_user(
            username='regular123', 
            email='regular@example.com', 
            password='password',
            role='student',
            first_name='Regular',
            last_name='User'
        )
        
        self.society = Society.objects.create(
            name='Test Society',
            description='A test society',
            category='Academic',
            president=self.officer_student,
            approved_by=self.admin_user
        )
        
        self.society.members.add(self.member_student)
        
        self.published_news = SocietyNews.objects.create(
            society=self.society,
            title='Published News',
            content='This is a published news post',
            author=self.officer_student,
            status='Published'
        )
        
        self.draft_news = SocietyNews.objects.create(
            society=self.society,
            title='Draft News',
            content='This is a draft news post',
            author=self.officer_student,
            status='Draft'
        )
        
        self.permission = NewsDetailPermission()
        self.factory = APIRequestFactory()
        
    def _create_request_with_user(self, user, method='GET'):
        """Helper method to create a request with a specific user and method."""
        if method == 'GET':
            request = self.factory.get('/')
        elif method == 'PUT':
            request = self.factory.put('/')
        elif method == 'DELETE':
            request = self.factory.delete('/')
        else:
            request = self.factory.get('/')
            
        request.user = user
        request.method = method
        return request
    
    def test_unauthenticated_user(self):
        """Test permission check for unauthenticated user."""
        request = self._create_request_with_user(AnonymousUser())
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        result = self.permission.has_permission(request, view)
        self.assertFalse(result)
    
    def test_admin_access_published(self):
        """Test admin access to published news."""
        request = self._create_request_with_user(self.admin_user)
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch.object(User, 'is_admin', return_value=True):
            result = self.permission.has_permission(request, view)
            self.assertTrue(result)
    
    def test_admin_access_draft(self):
        """Test admin access to draft news."""
        request = self._create_request_with_user(self.admin_user)
        view = MagicMock()
        view.kwargs = {'news_id': self.draft_news.id}
        
        with patch.object(User, 'is_admin', return_value=True):
            result = self.permission.has_permission(request, view)
            self.assertTrue(result)
    
    def test_admin_delete_access(self):
        """Test admin access to delete news."""
        request = self._create_request_with_user(self.admin_user, method='DELETE')
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch.object(User, 'is_admin', return_value=True):
            result = self.permission.has_permission(request, view)
            self.assertTrue(result)
    
    def test_no_news_id(self):
        """Test permission check when news_id is not in view kwargs."""
        request = self._create_request_with_user(self.member_student)
        view = MagicMock()
        view.kwargs = {}
        
        result = self.permission.has_permission(request, view)
        self.assertFalse(result)
    
    def test_nonexistent_news(self):
        """Test permission check with non-existent news."""
        request = self._create_request_with_user(self.member_student)
        view = MagicMock()
        view.kwargs = {'news_id': 9999}
        result = self.permission.has_permission(request, view)
        self.assertFalse(result)
    
    def test_member_access_published(self):
        """Test society member access to published news."""
        request = self._create_request_with_user(self.member_student)
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch('api.views.is_society_member', return_value=True):
            result = self.permission.has_permission(request, view)
            self.assertTrue(result)
    
    def test_member_access_draft(self):
        """Test society member access to draft news (should be denied)."""
        request = self._create_request_with_user(self.member_student)
        view = MagicMock()
        view.kwargs = {'news_id': self.draft_news.id}
        
        with patch('api.views.is_society_member', return_value=True):
            with patch('api.views.has_society_management_permission', return_value=False):
                result = self.permission.has_permission(request, view)
                self.assertFalse(result)
    
    def test_member_edit_access(self):
        """Test society member access to edit news (should be denied)."""
        request = self._create_request_with_user(self.member_student, method='PUT')
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch('api.views.is_society_member', return_value=True):
            with patch('api.views.has_society_management_permission', return_value=False):
                result = self.permission.has_permission(request, view)
                self.assertFalse(result)
    
    def test_officer_access_published(self):
        """Test society officer access to published news."""
        mock_user = MagicMock()
        mock_user.is_authenticated = True
        mock_user.student = self.officer_student
        
        request = self._create_request_with_user(mock_user)
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch('api.views.is_society_member', return_value=True):
            with patch('api.views.has_society_management_permission', return_value=True):
                result = self.permission.has_permission(request, view)
                self.assertTrue(result)
    
    def test_officer_access_draft(self):
        """Test society officer access to draft news."""
        mock_user = MagicMock()
        mock_user.is_authenticated = True
        mock_user.student = self.officer_student
        
        request = self._create_request_with_user(mock_user)
        view = MagicMock()
        view.kwargs = {'news_id': self.draft_news.id}
        
        with patch('api.views.is_society_member', return_value=True):
            with patch('api.views.has_society_management_permission', return_value=True):
                result = self.permission.has_permission(request, view)
                self.assertTrue(result)
    
    def test_officer_edit_access(self):
        """Test society officer access to edit news."""
        mock_user = MagicMock()
        mock_user.is_authenticated = True
        mock_user.student = self.officer_student
        
        request = self._create_request_with_user(mock_user, method='PUT')
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch('api.views.is_society_member', return_value=True):
            with patch('api.views.has_society_management_permission', return_value=True):
                result = self.permission.has_permission(request, view)
                self.assertTrue(result)
    
    def test_officer_delete_access(self):
        """Test society officer access to delete news."""
        mock_user = MagicMock()
        mock_user.is_authenticated = True
        mock_user.student = self.officer_student
        
        request = self._create_request_with_user(mock_user, method='DELETE')
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch('api.views.is_society_member', return_value=True):
            with patch('api.views.has_society_management_permission', return_value=True):
                result = self.permission.has_permission(request, view)
                self.assertTrue(result)
    
    def test_non_member_access_published(self):
        """Test non-member access to published news (should be denied)."""
        request = self._create_request_with_user(self.non_member_student)
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        with patch('api.views.is_society_member', return_value=False):
            result = self.permission.has_permission(request, view)
            self.assertFalse(result)
    
    def test_non_member_access_draft(self):
        """Test non-member access to draft news (should be denied)."""
        request = self._create_request_with_user(self.non_member_student)
        view = MagicMock()
        view.kwargs = {'news_id': self.draft_news.id}
        
        with patch('api.views.is_society_member', return_value=False):
            result = self.permission.has_permission(request, view)
            self.assertFalse(result)
    
    def test_non_student_access(self):
        """Test access for a user without a student profile (should be denied)."""
        request = self._create_request_with_user(self.non_student_user)
        view = MagicMock()
        view.kwargs = {'news_id': self.published_news.id}
        
        # For a non-student, is_society_member might still be called
        with patch('api.views.is_society_member', return_value=False):
            result = self.permission.has_permission(request, view)
            self.assertFalse(result)
    
    def test_officer_from_different_society(self):
        """Test access for an officer from a different society (should be denied)."""
        other_society = Society.objects.create(
            name='Other Society',
            description='Another society',
            category='Sports',
            president=self.non_member_student,
            approved_by=self.admin_user
        )
        
        other_news = SocietyNews.objects.create(
            society=other_society,
            title='Other Society News',
            content='News from another society',
            author=self.non_member_student,
            status='Published'
        )
        
        # Officer from original society tries to access/edit news from other society
        request = self._create_request_with_user(self.officer_student, method='PUT')
        view = MagicMock()
        view.kwargs = {'news_id': other_news.id}
        
        # For cross-society access, is_society_member should be False
        with patch('api.views.is_society_member', return_value=False):
            with patch('api.views.has_society_management_permission', return_value=False):
                result = self.permission.has_permission(request, view)
                self.assertFalse(result)

if __name__ == '__main__':
    unittest.main()