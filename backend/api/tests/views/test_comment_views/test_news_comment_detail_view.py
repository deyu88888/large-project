import json
from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from unittest.mock import patch, MagicMock

from api.models import User, Student, Society, SocietyNews, NewsComment
from api.views import has_society_management_permission  # Import the actual function

class TestNewsCommentDetailView(APITestCase):
    def setUp(self):
        """Set up test data for each test."""
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin123',
            email='admin@example.com',
            password='password',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        # Create student users
        self.student = Student.objects.create(
            username='student123',
            email='student@example.com',
            password='password',
            first_name='Student',
            last_name='User'
        )
        
        self.other_student = Student.objects.create(
            username='other123',
            email='other@example.com',
            password='password',
            first_name='Other',
            last_name='Student'
        )
        
        # Create officer student
        self.officer = Student.objects.create(
            username='officer123', 
            email='officer@example.com', 
            password='password',
            first_name='Officer',
            last_name='User',
            is_event_manager=True
        )
        
        # Create society with required fields
        self.society = Society.objects.create(
            name='Test Society',
            description='A test society',
            category='Academic',
            president=self.student,
            approved_by=self.admin_user
        )
        
        # Add students as members
        self.society.members.add(self.student)
        self.society.members.add(self.officer)
        
        # Create news post
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title='Test News',
            content='This is a test news post',
            author=self.student
        )
        
        # Create comments
        self.comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student,
            content='Original comment',
            parent_comment=None
        )
        
        self.other_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.other_student,
            content='Comment by other student',
            parent_comment=None
        )
        
        self.client = APIClient()
        
        self.url = reverse('news_comment_detail', args=[self.comment.id])
        self.other_url = reverse('news_comment_detail', args=[self.other_comment.id])
    
    def test_put_unauthenticated(self):
        """Test that unauthenticated users cannot edit comments."""
        data = {'content': 'Updated comment'}
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_put_not_author(self):
        """Test that non-authors cannot edit comments."""
        self.client.force_authenticate(user=self.other_student)
        data = {'content': 'Updated by non-author'}
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You can only edit your own comments", str(response.data))
    
    def test_put_as_author(self):
        """Test that authors can edit their own comments."""
        self.client.force_authenticate(user=self.student)
        data = {'content': 'Updated by author'}
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['content'], 'Updated by author')
        
        updated_comment = NewsComment.objects.get(id=self.comment.id)
        self.assertEqual(updated_comment.content, 'Updated by author')
    
    def test_put_officer_cannot_edit(self):
        """Test that officers cannot edit others' comments."""
        self.client.force_authenticate(user=self.officer)
        data = {'content': 'Updated by officer'}
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You can only edit your own comments", str(response.data))
    
    def test_put_invalid_data(self):
        """Test validation when updating with invalid data."""
        self.client.force_authenticate(user=self.student)
        data = {'content': ''}
        response = self.client.put(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_put_nonexistent_comment(self):
        """Test updating a non-existent comment."""
        self.client.force_authenticate(user=self.student)
        url = reverse('news_comment_detail', args=[9999])
        data = {'content': 'Updated content'}
        response = self.client.put(url, data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_unauthenticated(self):
        """Test that unauthenticated users cannot delete comments."""
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_as_author(self):
        """Test that authors can delete their own comments."""
        self.client.force_authenticate(user=self.student)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(NewsComment.objects.filter(id=self.comment.id).exists())
    
    def test_delete_as_non_author(self):
        """Test that non-authors cannot delete others' comments."""
        self.client.force_authenticate(user=self.other_student)
        response = self.client.delete(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You can only delete your own comments or moderate as a society officer", str(response.data))
        self.assertTrue(NewsComment.objects.filter(id=self.comment.id).exists())
    
    def test_delete_not_author_not_officer(self):
        """Test that non-authors who are not officers cannot delete comments."""
        self.client.force_authenticate(user=self.other_student)
        response = self.client.delete(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You can only delete your own comments or moderate as a society officer", str(response.data))
    
    def test_delete_nonexistent_comment(self):
        """Test deleting a non-existent comment."""
        self.client.force_authenticate(user=self.student)
        url = reverse('news_comment_detail', args=[9999])
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_alternative_permission_check_methods(self):
        """Test different ways permission checks might be implemented."""
        new_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.other_student,
            content='Another comment by other student',
            parent_comment=None
        )
        
        new_url = reverse('news_comment_detail', args=[new_comment.id])
        self.client.force_authenticate(user=self.other_student)
        response = self.client.delete(new_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(NewsComment.objects.filter(id=new_comment.id).exists())