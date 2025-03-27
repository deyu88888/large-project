from rest_framework.test import APITestCase 
from django.test import RequestFactory
from django.contrib.auth.models import AnonymousUser
from api.models import User, Student, Society
from api.views import IsAdminOrPresident  

class TestIsAdminOrPresidentPermission(APITestCase):
    def setUp(self):
        self.factory = RequestFactory()
        
        
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            first_name="Admin",
            last_name="User"
        )
        
        
        self.super_admin = User.objects.create_user(
            username="super_admin",
            email="superadmin@example.com",
            password="password123",
            role="student", 
            is_super_admin=True,
            first_name="Super",
            last_name="Admin"
        )
        
        
        self.student = Student.objects.create_user(
            username="student_user",
            email="student@example.com",
            password="password123",
            first_name="Student",
            last_name="User",
            major="Computer Science"
        )
        
        
        self.president = Student.objects.create_user(
            username="president_user",
            email="president@example.com",
            password="password123",
            first_name="President",
            last_name="User",
            major="Business"
        )
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.president,
            approved_by=self.admin_user,
            social_media_links={"Email": "society@example.com"}
        )
        
        
        self.president.president_of = self.society
        self.president.save()
        
        
        self.president.refresh_from_db()
        
        
        self.permission = IsAdminOrPresident()

    def test_admin_has_permission(self):
        """Test that admin users have permission"""
        request = self.factory.get('/')
        request.user = self.admin_user
        
        self.assertTrue(self.permission.has_permission(request, None))

    def test_super_admin_has_permission(self):
        """Test that super admin users have permission"""
        request = self.factory.get('/')
        request.user = self.super_admin
        
        self.assertTrue(self.permission.has_permission(request, None))

    def test_president_has_permission(self):
        """Test that society presidents have permission"""
        request = self.factory.get('/')
        request.user = self.president
        
        
        self.assertTrue(self.president.is_president)
        self.assertTrue(self.permission.has_permission(request, None))

    def test_student_has_no_permission(self):
        """Test that regular students don't have permission"""
        request = self.factory.get('/')
        request.user = self.student
        
        self.assertFalse(self.permission.has_permission(request, None))

    def test_unauthenticated_has_no_permission(self):
        """Test that unauthenticated users don't have permission"""
        request = self.factory.get('/')
        request.user = AnonymousUser()  
        
        self.assertFalse(self.permission.has_permission(request, None))