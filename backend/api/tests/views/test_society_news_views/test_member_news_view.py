from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone

from api.models import User, Student, Society, SocietyNews
from api.serializers import SocietyNewsSerializer

User = get_user_model()

class MemberNewsViewTests(TestCase):
    def setUp(self):
        """Set up test environment with necessary data."""
        self.admin_user = User.objects.create_user(
            username='admin123', 
            email='admin@example.com', 
            password='password',
            role='admin'
        )
        
        self.user_without_student = User.objects.create_user(
            username='regular_user', 
            email='regular@example.com', 
            password='password',
            role='student'
        )
        
        self.student_user = Student.objects.create(
            username='student123', 
            email='student@example.com', 
            password='password',
            first_name='Test',
            last_name='Student'
        )
        
        self.society1 = Society.objects.create(
            name='Society 1',
            description='First test society',
            category='Academic',
            president=self.student_user,
            approved_by=self.admin_user
        )
        
        self.society2 = Society.objects.create(
            name='Society 2',
            description='Second test society',
            category='Sports',
            president=self.student_user,
            approved_by=self.admin_user
        )
        
        self.society1.members.add(self.student_user)
        
        # Stagger creation times to test ordering
        self.published_news1 = SocietyNews.objects.create(
            society=self.society1,
            title='Published News 1',
            content='First published news',
            status='Published',
            is_pinned=False,
            author=self.student_user,
            created_at=timezone.now() - timezone.timedelta(days=2)
        )
        
        self.published_news2 = SocietyNews.objects.create(
            society=self.society1,
            title='Published News 2',
            content='Second published news',
            status='Published',
            is_pinned=True,
            author=self.student_user,
            created_at=timezone.now() - timezone.timedelta(days=3)
        )
        
        self.draft_news = SocietyNews.objects.create(
            society=self.society1,
            title='Draft News',
            content='Draft news content',
            status='Draft',
            author=self.student_user
        )
        
        self.published_news_society2 = SocietyNews.objects.create(
            society=self.society2,
            title='Society 2 Published News',
            content='Published news from society 2',
            status='Published',
            author=self.student_user,
            created_at=timezone.now() - timezone.timedelta(days=1)
        )
        
        self.client = APIClient()
    
    def test_member_news_view_authenticated_student(self):
        """
        Test member news view for a student who is a member of societies.
        """
        self.client.force_authenticate(user=self.student_user)
        response = self.client.get(reverse('member_news_feed'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        serializer = SocietyNewsSerializer(
            [self.published_news2, self.published_news1], 
            many=True, 
            context={'request': response.wsgi_request}
        )
        
        self.assertEqual(response.data, serializer.data)
    
    def test_member_news_view_unauthenticated(self):
        """
        Test member news view for an unauthenticated user.
        """
        response = self.client.get(reverse('member_news_feed'))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_member_news_view_user_without_student(self):
        """
        Test member news view for a user without a student profile.
        """
        self.client.force_authenticate(user=self.user_without_student)
        response = self.client.get(reverse('member_news_feed'))
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertTrue(any(
            "Only students can access this view" in str(message) 
            for message in response.data.values()
        ))
    
    def test_member_news_view_no_societies(self):
        """
        Test member news view for a student who is not a member of any societies.
        """
        new_student = Student.objects.create(
            username='new_student', 
            email='new@example.com', 
            password='password'
        )
        
        self.client.force_authenticate(user=new_student)
        response = self.client.get(reverse('member_news_feed'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)
    
    def test_member_news_view_ordering(self):
        """
        Test that news posts are ordered by pinned status and creation time.
        """
        third_news = SocietyNews.objects.create(
            society=self.society1,
            title='Third Published News',
            content='Third published news',
            status='Published',
            is_pinned=False,
            author=self.student_user,
            created_at=timezone.now() - timezone.timedelta(days=0.5)
        )
        
        self.client.force_authenticate(user=self.student_user)
        
        response = self.client.get(reverse('member_news_feed'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        response_data = response.data
        
        self.assertTrue(response_data[0]['is_pinned'])
        self.assertEqual(response_data[0]['id'], self.published_news2.id)
        
        self.assertIn(third_news.id, [item['id'] for item in response_data[1:]])
        self.assertIn(self.published_news1.id, [item['id'] for item in response_data[1:]])

if __name__ == '__main__':
    unittest.main()