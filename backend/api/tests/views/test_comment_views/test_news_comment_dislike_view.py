from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from api.models import User, Student, Society, SocietyNews, NewsComment

class TestNewsCommentDislikeView(APITestCase):
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
        
        # Create society with required fields
        self.society = Society.objects.create(
            name='Test Society',
            description='A test society',
            category='Academic',
            president=self.student,
            approved_by=self.admin_user
        )
        
        self.society.members.add(self.student)
        
        # Create news post
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title='Test News',
            content='This is a test news post',
            author=self.student
        )
        
        # Create comment
        self.comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student,
            content='Test comment',
            parent_comment=None
        )
        
        self.client = APIClient()
        self.url = reverse('news_comment_dislike', args=[self.comment.id])
    
    def test_dislike_comment_unauthenticated(self):
        """Test that unauthenticated users cannot dislike comments."""
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_dislike_comment_non_member(self):
        """Test that non-members cannot dislike comments."""
        self.client.force_authenticate(user=self.other_student)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You must be a member of this society to dislike comments", str(response.data))
    
    def test_dislike_comment_member(self):
        """Test that members can dislike comments."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "disliked")
        self.assertEqual(response.data["likes_count"], 0)
        self.assertEqual(response.data["dislikes_count"], 1)
        self.assertTrue(self.comment.dislikes.filter(id=self.student.id).exists())
    
    def test_undislike_comment_member(self):
        """Test that members can undislike comments they previously disliked."""
        self.comment.dislikes.add(self.student)
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "undisliked")
        self.assertEqual(response.data["likes_count"], 0)
        self.assertEqual(response.data["dislikes_count"], 0)
        
        self.assertFalse(self.comment.dislikes.filter(id=self.student.id).exists())
    
    def test_dislike_toggling_like(self):
        """Test that disliking a comment removes a previous like."""
        self.comment.likes.add(self.student)
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "disliked")
        self.assertEqual(response.data["likes_count"], 0)
        self.assertEqual(response.data["dislikes_count"], 1)
        
        self.assertTrue(self.comment.dislikes.filter(id=self.student.id).exists())
        self.assertFalse(self.comment.likes.filter(id=self.student.id).exists())
    
    def test_dislike_nonexistent_comment(self):
        """Test disliking a non-existent comment."""
        self.client.force_authenticate(user=self.student)
        url = reverse('news_comment_dislike', args=[9999])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Comment not found", str(response.data))
    
    def test_dislike_count_multiple_users(self):
        """Test that multiple users can dislike a comment and counts are accurate."""
        self.society.members.add(self.other_student)
        
        self.comment.dislikes.add(self.student)
        
        self.client.force_authenticate(user=self.other_student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["dislikes_count"], 2)
        
        # Verify both dislikes exist
        self.assertTrue(self.comment.dislikes.filter(id=self.student.id).exists())
        self.assertTrue(self.comment.dislikes.filter(id=self.other_student.id).exists())
    
    def test_multiple_interactions(self):
        """Test a sequence of like/dislike interactions to ensure counts remain accurate."""
        self.client.force_authenticate(user=self.student)
        
        like_url = reverse('news_comment_like', args=[self.comment.id])
        self.client.post(like_url)
        self.assertTrue(self.comment.likes.filter(id=self.student.id).exists())
        self.assertFalse(self.comment.dislikes.filter(id=self.student.id).exists())
        
        response = self.client.post(self.url)
        self.assertFalse(self.comment.likes.filter(id=self.student.id).exists())
        self.assertTrue(self.comment.dislikes.filter(id=self.student.id).exists())
        self.assertEqual(response.data["likes_count"], 0)
        self.assertEqual(response.data["dislikes_count"], 1)
        
        response = self.client.post(self.url)
        
        self.assertFalse(self.comment.likes.filter(id=self.student.id).exists())
        self.assertFalse(self.comment.dislikes.filter(id=self.student.id).exists())
        self.assertEqual(response.data["likes_count"], 0)
        self.assertEqual(response.data["dislikes_count"], 0)