from django.urls import reverse
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from api.models import User, Student, Society, SocietyNews, NewsComment

class TestNewsCommentLikeView(APITestCase):
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
        self.url = reverse('news_comment_like', args=[self.comment.id])
    
    def test_like_comment_unauthenticated(self):
        """Test that unauthenticated users cannot like comments."""
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_like_comment_non_member(self):
        """Test that non-members cannot like comments."""
        self.client.force_authenticate(user=self.other_student)
        response = self.client.post(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You must be a member of this society to like comments", str(response.data))
    
    def test_like_comment_member(self):
        """Test that members can like comments."""
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "liked")
        self.assertEqual(response.data["likes_count"], 1)
        self.assertEqual(response.data["dislikes_count"], 0)
        
        self.assertTrue(self.comment.likes.filter(id=self.student.id).exists())
    
    def test_unlike_comment_member(self):
        """Test that members can unlike comments they previously liked."""
        self.comment.likes.add(self.student)
        
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "unliked")
        self.assertEqual(response.data["likes_count"], 0)
        self.assertEqual(response.data["dislikes_count"], 0)
        
        self.assertFalse(self.comment.likes.filter(id=self.student.id).exists())
    
    def test_like_toggling_dislike(self):
        """Test that liking a comment removes a previous dislike."""
        self.comment.dislikes.add(self.student)
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "liked")
        self.assertEqual(response.data["likes_count"], 1)
        self.assertEqual(response.data["dislikes_count"], 0)
        
        self.assertTrue(self.comment.likes.filter(id=self.student.id).exists())
        self.assertFalse(self.comment.dislikes.filter(id=self.student.id).exists())
    
    def test_like_nonexistent_comment(self):
        """Test liking a non-existent comment."""
        self.client.force_authenticate(user=self.student)
        url = reverse('news_comment_like', args=[9999])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("Comment not found", str(response.data))
    
    def test_like_count_multiple_users(self):
        """Test that multiple users can like a comment and counts are accurate."""
        self.society.members.add(self.other_student)
        
        self.comment.likes.add(self.student)
        
        self.client.force_authenticate(user=self.other_student)
        response = self.client.post(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["likes_count"], 2)
        
        # Verify both likes exist
        self.assertTrue(self.comment.likes.filter(id=self.student.id).exists())
        self.assertTrue(self.comment.likes.filter(id=self.other_student.id).exists())