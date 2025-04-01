from unittest.mock import MagicMock
from django.test import TestCase
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser

from api.views import SocietyMemberOrOfficerPermission
from api.models import User, Student, Society

class TestSocietyMemberOrOfficerPermission(TestCase):
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
        
        # Create student instances
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
        
        # Create a non-student user
        self.non_student_user = User.objects.create_user(
            username='regular123', 
            email='regular@example.com', 
            password='password',
            role='student',
            first_name='Regular',
            last_name='User'
        )
        
        # Create a society
        self.society = Society.objects.create(
            name='Test Society',
            description='A test society',
            category='Academic',
            president=self.member_student,
            approved_by=self.admin_user
        )
        
        self.society.members.add(self.member_student)
        self.view_with_society = MagicMock()
        self.view_with_society.kwargs = {'society_id': self.society.id}
        
        self.view_without_society = MagicMock()
        self.view_without_society.kwargs = {}
        self.permission = SocietyMemberOrOfficerPermission()
        self.factory = APIRequestFactory()
    
    def _create_request_with_user(self, user):
        """Helper method to create a request with a specific user."""
        request = self.factory.get('/')
        request.user = user
        return request
    
    def test_no_society_id(self):
        """Test permission check when society_id is not in view kwargs."""
        request = self._create_request_with_user(self.admin_user)
        result = self.permission.has_permission(request, self.view_without_society)
        self.assertFalse(result)
    
    def test_nonexistent_society(self):
        """Test permission check with non-existent society."""
        view = MagicMock()
        view.kwargs = {'society_id': 9999}
        request = self._create_request_with_user(self.non_member_student)
        result = self.permission.has_permission(request, view)
        self.assertFalse(result)
    
    def test_admin_access(self):
        """Test permission check for an admin user."""
        request = self._create_request_with_user(self.admin_user)
        result = self.permission.has_permission(request, self.view_with_society)
        self.assertTrue(result)
    
    def test_officer_access(self):
        """Test permission check for a society officer."""
        self.society.president = self.officer_student
        self.society.save()
        
        request = self._create_request_with_user(self.officer_student)
        result = self.permission.has_permission(request, self.view_with_society)
        self.assertTrue(result)
    
    def test_member_access(self):
        """Test permission check for a regular society member."""
        request = self._create_request_with_user(self.member_student)
        result = self.permission.has_permission(request, self.view_with_society)
        self.assertTrue(result)
    
    def test_non_member_access(self):
        """Test permission check for a non-member student."""
        request = self._create_request_with_user(self.non_member_student)
        result = self.permission.has_permission(request, self.view_with_society)
        self.assertFalse(result)
    
    def test_user_without_student_profile(self):
        """Test permission check for a user without a student profile."""
        request = self._create_request_with_user(self.non_student_user)
        result = self.permission.has_permission(request, self.view_with_society)
        self.assertFalse(result)
    
    def test_anonymous_user(self):
        """Test permission check for an anonymous user."""
        request = self._create_request_with_user(AnonymousUser())
        result = self.permission.has_permission(request, self.view_with_society)
        self.assertFalse(result)