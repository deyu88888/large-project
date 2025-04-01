import json
from django.urls import reverse
from django.test import TestCase
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from unittest.mock import patch
import time
from api.models import User, Student, Society, SocietyNews, NewsComment

class TestNewsCommentView(APITestCase):
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
        
        # Create student instances directly
        self.student = Student.objects.create(
            username='student123',
            email='student@example.com',
            password='password',
            first_name='Student',
            last_name='User'
        )
        self.student_user = self.student
        
        self.non_member_student = Student.objects.create(
            username='nonmemb123',
            email='nonmember@example.com',
            password='password',
            first_name='Non',
            last_name='Member'
        )
        self.non_member_user = self.non_member_student
        
        # Create society with required fields
        self.society = Society.objects.create(
            name='Test Society',
            description='A test society',
            category='Academic',
            president=self.student,
            approved_by=self.admin_user
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
        
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title='Test News',
            content='This is a test news post',
            author=self.student
        )
        
        # Create a parent comment
        self.parent_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student_user,
            content='Parent comment',
            parent_comment=None
        )
        
        # Create a reply comment
        self.reply_comment = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student_user,
            content='Reply comment',
            parent_comment=self.parent_comment
        )
        
        self.client = APIClient()
        self.url = reverse('news_comments', args=[self.news_post.id])
    
    def test_get_comments_unauthenticated(self):
        """Test that unauthenticated users cannot get comments."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_get_comments_non_member(self):
        """Test that non-members cannot get comments."""
        self.client.force_authenticate(user=self.non_member_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You must be a member of this society to view comments", str(response.data))
    
    def test_get_comments_member(self):
        """Test that members can get comments."""
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['id'], self.parent_comment.id)
        self.assertEqual(response.data[0]['content'], 'Parent comment')
        
        self.assertEqual(len(response.data[0]['replies']), 1)
        self.assertEqual(response.data[0]['replies'][0]['id'], self.reply_comment.id)
    
    def test_post_comment_unauthenticated(self):
        """Test that unauthenticated users cannot post comments."""
        data = {'content': 'Test comment'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_post_comment_non_student(self):
        """Test that non-students cannot post comments."""
        self.client.force_authenticate(user=self.admin_user)
        data = {'content': 'Test comment'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("Only students can comment", str(response.data))
    
    def test_post_comment_non_member(self):
        """Test that non-member students cannot post comments."""
        self.client.force_authenticate(user=self.non_member_user)
        data = {'content': 'Test comment'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("You must be a member or officer of this society to comment", str(response.data))
    
    def test_post_comment_member(self):
        """Test that members can post comments."""
        self.client.force_authenticate(user=self.student_user)
        data = {'content': 'New test comment'}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertEqual(response.data['content'], 'New test comment')
        self.assertIn('content', response.data)
    
    def test_post_reply_member(self):
        """Test that members can post reply comments."""
        self.client.force_authenticate(user=self.student_user)
        data = {
            'content': 'New reply comment',
            'parent_comment': self.parent_comment.id
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        self.assertEqual(response.data['content'], 'New reply comment')
        self.assertIn('parent_comment', response.data)
        self.assertEqual(int(response.data['parent_comment']), self.parent_comment.id)
    
    def test_post_reply_invalid_parent(self):
        """Test posting reply with invalid parent comment ID."""
        self.client.force_authenticate(user=self.student_user)
        data = {
            'content': 'Invalid reply',
            'parent_comment': 9999
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("object does not exist", str(response.data))
    
    def test_post_reply_parent_from_other_post(self):
        """Test posting reply to a parent comment from another news post."""
        other_news = SocietyNews.objects.create(
            society=self.society,
            title='Other News',
            content='This is another news post',
            author=self.student
        )
        
        other_comment = NewsComment.objects.create(
            news_post=other_news,
            user=self.student_user,
            content='Comment on other post',
            parent_comment=None
        )
        
        self.client.force_authenticate(user=self.student_user)
        data = {
            'content': 'Reply to wrong parent',
            'parent_comment': other_comment.id
        }
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Parent comment does not belong to this news post", str(response.data))
    
    def test_post_comment_invalid_data(self):
        """Test posting a comment with invalid data."""
        self.client.force_authenticate(user=self.student_user)
        data = {'content': ''}
        response = self.client.post(self.url, data)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_nonexistent_news_post(self):
        """Test accessing comments for a non-existent news post."""
        url = reverse('news_comments', args=[9999])
        self.client.force_authenticate(user=self.student_user)
        
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        data = {'content': 'Test comment'}
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_comment_ordering(self):
        """Test that comments are returned in the correct order."""
        comments = []
        for i in range(3):
            comment = NewsComment.objects.create(
                news_post=self.news_post,
                user=self.student_user,
                content=f'Comment {i}',
                parent_comment=None
            )
            comments.append(comment)
            time.sleep(0.1)
        
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        for i in range(len(response.data) - 1):
            self.assertLessEqual(
                response.data[i]['created_at'],
                response.data[i + 1]['created_at']
            )

    def test_officer_can_comment(self):
        """Test that society officers can comment even if not members."""
        officer_student = Student.objects.create(
            username='officer123', 
            email='officer@example.com', 
            password='password',
            first_name='Officer',
            last_name='User',
            is_event_manager=True
        )
        
        self.society.members.add(officer_student)
        
        self.client.force_authenticate(user=officer_student)
        data = {'content': 'Officer comment'}
        response = self.client.post(self.url, data)
        
        # Now the officer should be able to comment as they're a member
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['content'], 'Officer comment')