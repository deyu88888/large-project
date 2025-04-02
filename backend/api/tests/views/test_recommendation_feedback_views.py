from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase, APIClient
from django.contrib.auth import get_user_model
from django.test.utils import override_settings
import uuid
import time
from api.models import RecommendationFeedback, Society, Student

User = get_user_model()

def create_unique_user(role='student', is_super_admin=False):
    """Helper function to create a user with a unique email"""
    timestamp = int(time.time() * 1000)  # Use milliseconds for even more uniqueness
    unique_id = f"{uuid.uuid4()}_{timestamp}"
    return User.objects.create_user(
        username=f'{role}_{unique_id}'[:30],  # Username has max length
        email=f'{role}_{unique_id}@example.com',
        password='testpassword',
        role=role,
        first_name=f'{role.capitalize()}',
        last_name=f'User {timestamp}',
        is_super_admin=is_super_admin
    )

def create_student_from_user(user):
    """Helper function to create a Student from a User"""
    try:
        # Check if the student already exists
        return Student.objects.get(id=user.id)
    except Student.DoesNotExist:
        # Instead of creating a new Student directly, use a raw SQL query
        # to do this without triggering the unique constraint
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO api_student 
                (user_ptr_id, status, major, is_president, is_vice_president, is_event_manager, icon) 
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                """,
                [user.id, "Pending", "", False, False, False, None]
            )
        return Student.objects.get(id=user.id)


class PostFeedbackTest(APITestCase):
    """Test case for posting feedback"""
    
    def setUp(self):
        # Create student user
        self.student_user = create_unique_user(role='student')
        self.student = create_student_from_user(self.student_user)
        
        # Create a non-student user
        self.non_student_user = create_unique_user(role='regular')
        
        # Create society with a shorter name
        self.society = Society.objects.create(
            name=f'Test_{uuid.uuid4().hex[:8]}',  # Ensure name is under 30 chars
            description='Test Description',
            president=self.student
        )
        
        # Set up API clients
        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)
        
        self.non_student_client = APIClient()
        self.non_student_client.force_authenticate(user=self.non_student_user)
    
    def test_post_feedback_success(self):
        """Test successful creation of feedback"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        data = {
            'rating': 5,
            'comment': 'Excellent society',
            'is_joined': True
        }
        
        response = self.student_client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 5)
        self.assertEqual(response.data['comment'], 'Excellent society')
        self.assertTrue(response.data['is_joined'])
    
    def test_post_feedback_non_student(self):
        """Test that non-students cannot submit feedback"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        data = {
            'rating': 5,
            'comment': 'Excellent society',
            'is_joined': True
        }
        
        response = self.non_student_client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Only students can provide recommendation feedback.')
    
    def test_post_feedback_invalid_society(self):
        """Test feedback submission with invalid society ID"""
        url = '/api/recommendations/9999/feedback/'
        data = {
            'rating': 5,
            'comment': 'Excellent society',
            'is_joined': True
        }
        
        response = self.student_client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Society with id=9999 not found')
    
    def test_post_feedback_invalid_data(self):
        """Test feedback submission with invalid data"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        data = {
            'rating': 7,  # Invalid rating (assuming valid range is 1-5)
            'comment': 'Excellent society',
            'is_joined': True
        }
        
        response = self.student_client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class GetFeedbackTest(APITestCase):
    """Test case for getting feedback"""
    
    def setUp(self):
        # Create student user
        self.student_user = create_unique_user(role='student')
        self.student = create_student_from_user(self.student_user)
        
        # Create another student user
        self.student_user2 = create_unique_user(role='student')
        self.student2 = create_student_from_user(self.student_user2)
        
        # Create non-student user
        self.non_student_user = create_unique_user(role='regular')
        
        # Create society with a shorter name
        self.society = Society.objects.create(
            name=f'Test_{uuid.uuid4().hex[:8]}',  # Ensure name is under 30 chars
            description='Test Description',
            president=self.student
        )
        
        # Create a sample feedback
        self.feedback = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=4,
            comment='Great society',
            is_joined=False
        )
        
        # Set up API clients
        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)
        
        self.student2_client = APIClient()
        self.student2_client.force_authenticate(user=self.student_user2)
        
        self.non_student_client = APIClient()
        self.non_student_client.force_authenticate(user=self.non_student_user)
        
        self.unauthenticated_client = APIClient()
    
    def test_get_specific_feedback(self):
        """Test retrieving specific feedback"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        
        response = self.student_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 4)
        self.assertEqual(response.data['comment'], 'Great society')
    
    def test_get_nonexistent_feedback(self):
        """Test retrieving feedback that doesn't exist"""
        # Use the second student who has no feedback
        url = f'/api/recommendations/{self.society.id}/feedback/'
        
        response = self.student2_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
    
    def test_get_all_feedback(self):
        """Test retrieving all feedback for a student"""
        url = '/api/recommendations/feedback/'
        
        response = self.student_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['society'], self.society.id)
    
    def test_get_feedback_non_student(self):
        """Test that non-students cannot retrieve feedback"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        
        response = self.non_student_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Only students can access recommendation feedback.')
    
    def test_unauthenticated_access(self):
        """Test that unauthenticated users cannot access the views"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        
        response = self.unauthenticated_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UpdateFeedbackTest(APITestCase):
    """Test case for updating feedback"""
    
    def setUp(self):
        # Create student user
        self.student_user = create_unique_user(role='student')
        self.student = create_student_from_user(self.student_user)
        
        # Create another student user
        self.student_user2 = create_unique_user(role='student')
        self.student2 = create_student_from_user(self.student_user2)
        
        # Create non-student user
        self.non_student_user = create_unique_user(role='regular')
        
        # Create society with a shorter name
        self.society = Society.objects.create(
            name=f'Test_{uuid.uuid4().hex[:8]}',  # Ensure name is under 30 chars
            description='Test Description',
            president=self.student
        )
        
        # Create a second society with a shorter name
        self.society2 = Society.objects.create(
            name=f'Test2_{uuid.uuid4().hex[:8]}',  # Ensure name is under 30 chars
            description='Test Description 2',
            president=self.student2
        )
        
        # Create a sample feedback
        self.feedback = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=4,
            comment='Great society',
            is_joined=False
        )
        
        # Set up API clients
        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)
        
        self.non_student_client = APIClient()
        self.non_student_client.force_authenticate(user=self.non_student_user)
    
    def test_update_feedback_success(self):
        """Test successful update of feedback"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        data = {
            'rating': 2,
            'comment': 'Not as good as expected',
        }
        
        response = self.student_client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['rating'], 2)
        self.assertEqual(response.data['comment'], 'Not as good as expected')
        
        # Verify the object was updated in the database
        updated_feedback = RecommendationFeedback.objects.get(pk=self.feedback.pk)
        self.assertEqual(updated_feedback.rating, 2)
    
    def test_update_feedback_non_student(self):
        """Test that non-students cannot update feedback"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        data = {
            'rating': 2,
            'comment': 'Not as good as expected'
        }
        
        response = self.non_student_client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Only students can update recommendation feedback.')
    
    def test_update_nonexistent_feedback(self):
        """Test updating feedback that doesn't exist"""
        # Using a society that the student has no feedback for
        url = f'/api/recommendations/{self.society2.id}/feedback/'
        data = {
            'rating': 2,
            'comment': 'Not as good as expected'
        }
        
        response = self.student_client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['error'], 'Feedback not found')
    
    def test_update_feedback_invalid_data(self):
        """Test updating feedback with invalid data"""
        url = f'/api/recommendations/{self.society.id}/feedback/'
        data = {
            'rating': 7,  # Invalid rating (assuming valid range is 1-5)
        }
        
        response = self.student_client.put(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class AnalyticsTest(APITestCase):
    """Test case for feedback analytics"""
    
    def setUp(self):
        # Create admin user
        self.admin_user = create_unique_user(role='admin')
        
        # Create super admin user
        self.super_admin_user = create_unique_user(role='regular', is_super_admin=True)
        
        # Create student user
        self.student_user = create_unique_user(role='student')
        self.student = create_student_from_user(self.student_user)
        
        # Create another student user
        self.student_user2 = create_unique_user(role='student')
        self.student2 = create_student_from_user(self.student_user2)
        
        # Create society with a shorter name
        self.society = Society.objects.create(
            name=f'Test_{uuid.uuid4().hex[:8]}',  # Ensure name is under 30 chars
            description='Test Description',
            president=self.student
        )
        
        # Create feedback entries
        self.feedback1 = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=5,
            comment='Great society',
            is_joined=True
        )
        
        self.feedback2 = RecommendationFeedback.objects.create(
            student=self.student2,
            society=self.society,
            rating=3,
            comment='Average society',
            is_joined=False
        )
        
        # Set up API clients
        self.admin_client = APIClient()
        self.admin_client.force_authenticate(user=self.admin_user)
        
        self.super_admin_client = APIClient()
        self.super_admin_client.force_authenticate(user=self.super_admin_user)
        
        self.student_client = APIClient()
        self.student_client.force_authenticate(user=self.student_user)
        
        self.unauthenticated_client = APIClient()
    
    def test_get_analytics_admin(self):
        """Test that admins can access analytics"""
        url = '/api/recommendations/feedback/analytics/'
        
        response = self.admin_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_feedback'], 2)
        self.assertEqual(response.data['average_rating'], 4.0)  # (5+3)/2
        self.assertEqual(response.data['join_count'], 1)
        self.assertEqual(response.data['conversion_rate'], 50.0)  # 1/2 * 100
    
    def test_get_analytics_super_admin(self):
        """Test that super admins can access analytics"""
        url = '/api/recommendations/feedback/analytics/'
        
        response = self.super_admin_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_feedback'], 2)
    
    def test_get_analytics_non_admin(self):
        """Test that non-admins cannot access analytics"""
        url = '/api/recommendations/feedback/analytics/'
        
        response = self.student_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data['error'], 'Only admins can access feedback analytics.')
    
    def test_get_analytics_unauthenticated(self):
        """Test that unauthenticated users cannot access analytics"""
        url = '/api/recommendations/feedback/analytics/'
        
        response = self.unauthenticated_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_analytics_no_feedback(self):
        """Test analytics with no feedback data"""
        # Delete all existing feedback
        RecommendationFeedback.objects.all().delete()
        
        url = '/api/recommendations/feedback/analytics/'
        response = self.admin_client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['total_feedback'], 0)
        self.assertEqual(response.data['average_rating'], 0)
        self.assertEqual(response.data['join_count'], 0)
        self.assertEqual(response.data['conversion_rate'], 0)