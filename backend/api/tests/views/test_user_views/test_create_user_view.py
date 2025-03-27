from rest_framework.test import APITestCase, APIRequestFactory
from rest_framework import status
from django.urls import reverse
from api.models import User
from django.contrib.auth.hashers import check_password
from api.views import CreateUserView  


class TestCreateUserView(APITestCase):
    def setUp(self):
        
        self.factory = APIRequestFactory()
        
        
        self.valid_user_data = {
            'username': 'testuser',
            'email': 'test@example.com',
            'password': 'securepassword123',
            'first_name': 'Test',
            'last_name': 'User',
            'role': 'student',
            'major': 'Computer Science'  
        }
        
        
        self.existing_user = User.objects.create_user(
            username='existinguser',
            email='existing@example.com',
            password='password123',
            first_name='Existing',
            last_name='User',
            role='student'
        )
    
    def test_create_valid_user(self):
        """Test creating a user with valid data"""
        
        request = self.factory.post('/api/users/', self.valid_user_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        
        self.assertTrue(User.objects.filter(username='testuser').exists())
        
        
        user = User.objects.get(username='testuser')
        self.assertEqual(user.email, 'test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.last_name, 'User')
        self.assertEqual(user.role, 'student')
        
        
        self.assertTrue(check_password('securepassword123', user.password))
    
    def test_create_user_missing_fields(self):
        """Test error when required fields are missing"""
        
        invalid_data = self.valid_user_data.copy()
        del invalid_data['username']
        request = self.factory.post('/api/users/', invalid_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        
        invalid_data = self.valid_user_data.copy()
        del invalid_data['email']
        request = self.factory.post('/api/users/', invalid_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_user_duplicate_username(self):
        """Test error when username already exists"""
        duplicate_data = self.valid_user_data.copy()
        duplicate_data['username'] = 'existinguser'
        
        request = self.factory.post('/api/users/', duplicate_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_user_duplicate_email(self):
        """Test error when email already exists"""
        duplicate_data = self.valid_user_data.copy()
        duplicate_data['email'] = 'existing@example.com'
        
        request = self.factory.post('/api/users/', duplicate_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_user_invalid_email(self):
        """Test error when email format is invalid"""
        invalid_data = self.valid_user_data.copy()
        invalid_data['email'] = 'not-an-email'
        
        request = self.factory.post('/api/users/', invalid_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_user_short_password(self):
        """Test error when password is too short"""
        invalid_data = self.valid_user_data.copy()
        invalid_data['password'] = 'short'
        
        request = self.factory.post('/api/users/', invalid_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_user_invalid_role(self):
        """Test error when role is invalid"""
        invalid_data = self.valid_user_data.copy()
        invalid_data['role'] = 'invalid_role'
        
        request = self.factory.post('/api/users/', invalid_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_cannot_use_get_method(self):
        """Test that GET requests are not allowed"""
        request = self.factory.get('/api/users/')
        view = CreateUserView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def test_create_user_empty_data(self):
        """Test error when sending empty data"""
        request = self.factory.post('/api/users/', {}, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_create_admin_user(self):
        """Test creating an admin user"""
        admin_data = self.valid_user_data.copy()
        admin_data['role'] = 'admin'
        admin_data['username'] = 'adminuser'
        admin_data['email'] = 'admin@example.com'
        
        request = self.factory.post('/api/users/', admin_data, format='json')
        view = CreateUserView.as_view()
        response = view(request)
        
        
        if response.status_code == status.HTTP_201_CREATED:
            
            user = User.objects.get(username='adminuser')
            self.assertEqual(user.role, 'admin')
        else:
            
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def tearDown(self):
        
        User.objects.filter(username='testuser').delete()
        User.objects.filter(username='adminuser').delete()