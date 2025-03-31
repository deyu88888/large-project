from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework.response import Response
from api.models import Student, Society, User
from rest_framework_simplejwt.tokens import RefreshToken
from unittest.mock import patch


class JoinedSocietiesViewTestCase(TestCase):
    """Unit tests for the JoinedSocietiesView."""

    def setUp(self):
        # Create a test admin
        self.admin = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="adminpassword",
            first_name="Admin",
            last_name="User",
        )

        # Create test students
        self.student1 = Student.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
        )
        self.student2 = Student.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
        )
        
        # Create a third student to be the president of the third society
        self.student3 = Student.objects.create_user(
            username="student3",
            email="student3@example.com",
            password="password123",
            first_name="Student",
            last_name="Three",
        )

        # Create test societies
        self.society1 = Society.objects.create(
            name="Science Club",
            president=self.student1,
            approved_by=self.admin,
            status="Approved"
        )
        self.society2 = Society.objects.create(
            name="Math Club",
            president=self.student2,
            approved_by=self.admin,
            status="Approved"
        )
        self.society3 = Society.objects.create(
            name="Art Club",
            president=self.student3,
            approved_by=self.admin,
            status="Approved"
        )

        # Add student1 to society1
        self.student1.societies_belongs_to.add(self.society1)
        
        # Add student2 to society1 and society3
        self.student2.societies_belongs_to.add(self.society1)
        self.student2.societies_belongs_to.add(self.society3)

        # Set up API client
        self.client = APIClient()
        self.student1_token = self._generate_token(self.student1)
        self.student2_token = self._generate_token(self.student2)
        self.student3_token = self._generate_token(self.student3)
        
        # Create a non-student user
        self.non_student_user = User.objects.create_user(
            username="non_student",
            email="nonst@example.com",
            password="password123",
            first_name="Non",
            last_name="Student",
            role="staff"
        )
        self.non_student_token = self._generate_token(self.non_student_user)
        
        # Set up URLs
        self.joined_societies_url = "/api/society/joined/"
        self.leave_society_url = lambda society_id: f"/api/society/leave/{society_id}/"
        
    def _generate_token(self, user):
        """Generate a JWT token for the user."""
        refresh = RefreshToken.for_user(user)
        return f"Bearer {refresh.access_token}"

    # GET Tests
    def test_get_joined_societies_unauthenticated(self):
        """Test that unauthenticated users cannot access joined societies."""
        response = self.client.get(self.joined_societies_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_joined_societies_non_student(self):
        """Test that non-student users receive an error when trying to get joined societies."""
        self.client.credentials(HTTP_AUTHORIZATION=self.non_student_token)
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            error_response = Response({"error": "User is not a student."}, status=status.HTTP_403_FORBIDDEN)
            mock_get_student.return_value = (None, error_response)
            
            response = self.client.get(self.joined_societies_url)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_get_joined_societies_student1(self):
        """Test retrieving joined societies for student1 (1 society)."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            mock_get_student.return_value = (self.student1, None)
            
            mock_societies = self.student1.societies_belongs_to.all()
            response = self.client.get(self.joined_societies_url)
            
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(len(response.data) > 0)
    
    def test_get_joined_societies_student2(self):
        """Test retrieving joined societies for student2 (2 societies)."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student2_token)
        
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            mock_get_student.return_value = (self.student2, None)
            
            response = self.client.get(self.joined_societies_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertTrue(len(response.data) > 0)
    
    def test_get_joined_societies_student3(self):
        """Test retrieving joined societies for student3 who hasn't explicitly joined societies."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student3_token)
        
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            mock_get_student.return_value = (self.student3, None)
            response = self.client.get(self.joined_societies_url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_leave_society_unauthenticated(self):
        """Test that unauthenticated users cannot leave societies."""
        response = self.client.delete(self.leave_society_url(self.society1.id))
        self.assertIn(response.status_code, [
            status.HTTP_401_UNAUTHORIZED, 
            status.HTTP_403_FORBIDDEN
        ])
    
    def test_leave_society_non_student(self):
        """Test that non-student users receive an error when trying to leave a society."""
        self.client.credentials(HTTP_AUTHORIZATION=self.non_student_token)
        
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            error_response = Response({"error": "User is not a student."}, status=status.HTTP_403_FORBIDDEN)
            mock_get_student.return_value = (None, error_response)
            
            response = self.client.delete(self.leave_society_url(self.society1.id))
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_leave_nonexistent_society(self):
        """Test trying to leave a society that doesn't exist."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            mock_get_student.return_value = (self.student1, None)
            
            response = self.client.delete(self.leave_society_url(9999))
            
            self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_leave_society_not_member(self):
        """Test trying to leave a society the student isn't a member of."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            mock_get_student.return_value = (self.student1, None)
            
            response = self.client.delete(self.leave_society_url(self.society2.id))
            
            self.assertIn(response.status_code, [
                status.HTTP_400_BAD_REQUEST,
                status.HTTP_404_NOT_FOUND
            ])
    
    def test_leave_society_with_role(self):
        """Test that a student with a role (president) cannot leave the society."""
        self.student1.is_president = True
        self.student1.president_of = self.society1
        self.student1.save()
        
        if not self.student1.societies_belongs_to.filter(id=self.society1.id).exists():
            self.student1.societies_belongs_to.add(self.society1)
        
        self.assertTrue(self.student1.is_president)
        self.assertEqual(self.student1.president_of, self.society1)
        self.assertEqual(self.society1.president, self.student1)
        self.assertTrue(self.student1.societies_belongs_to.filter(id=self.society1.id).exists())
        
        self.client.credentials(HTTP_AUTHORIZATION=self.student1_token)
        
        response = self.client.delete(self.leave_society_url(self.society1.id))
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        self.assertTrue(self.student1.societies_belongs_to.filter(id=self.society1.id).exists())
    
    def test_leave_society_success(self):
        """Test successfully leaving a society."""
        self.client.credentials(HTTP_AUTHORIZATION=self.student2_token)
        
        with patch('api.views.get_student_if_user_is_student') as mock_get_student:
            mock_get_student.return_value = (self.student2, None)
            
            with patch('api.views.student_has_no_role') as mock_has_no_role:
                mock_has_no_role.return_value = None
                
                response = self.client.delete(self.leave_society_url(self.society1.id))
                
                self.assertEqual(response.status_code, status.HTTP_200_OK)
                self.assertTrue('message' in response.data or 'success' in response.data)