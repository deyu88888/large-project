from unittest.mock import patch
from django.test import override_settings
from django.urls import reverse
from django.http import QueryDict
from rest_framework import status
from rest_framework.test import APITestCase, APIClient

from api.models import Society, SocietyNews, User, Student

class SocietyNewsListViewTestCase(APITestCase):
    """Tests for SocietyNewsListView"""

    def setUp(self):
        # Create admin user
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password", 
            first_name="Admin",
            last_name="User",
            role="admin"
        )
        
        # Create student users
        self.regular_student = Student.objects.create_user(
            username="regular_student",
            email="regular@example.com",
            password="password",
            first_name="Regular",
            last_name="Student",
            role="student"
        )
        
        self.president_student = Student.objects.create_user(
            username="president_user",
            email="president@example.com",
            password="test1234",
            first_name="Pres",
            last_name="Ident",
            is_president=True,
            major="Test Major"
        )
        
        # Create society with required fields
        self.society = Society.objects.create(
            name="Tech Society",
            president=self.president_student,
            approved_by=self.admin_user,
            status="Approved",
            category="Technology",
            social_media_links={"Email": "tech@example.com"},
        )
        
        # Set up president relationship
        self.president_student.president_of = self.society
        self.president_student.save()
        
        self.regular_student.societies.add(self.society)
        
        # Create some news posts
        self.published_post = SocietyNews.objects.create(
            title='Published News',
            content='Published content',
            society=self.society,
            author=self.president_student,
            status='Published'
        )
        
        self.draft_post = SocietyNews.objects.create(
            title='Draft News',
            content='Draft content',
            society=self.society,
            author=self.president_student,
            status='Draft'
        )
        
        self.client = APIClient()
        self.url = reverse('society_news_list', args=[self.society.id])
        
        self.admin_user.student = self.regular_student
        
        if not hasattr(self.president_student, 'societies'):
            self.president_student.societies = []
        self.president_student.societies.add(self.society)

    def _to_querydict(self, data_dict):
        """
        Convert a dict into a mutable QueryDict.
        """
        qd = QueryDict('', mutable=True)
        for key, value in data_dict.items():
            if isinstance(value, list):
                for item in value:
                    qd.update({key: item})
            else:
                qd.update({key: value})
        return qd

    def _get_error_message(self, response):
        """
        Helper to retrieve the error message from the response.
        Checks in 'detail' or 'error' keys.
        """
        return response.data.get("detail") or response.data.get("error") or ""

    def test_get_news_unauthenticated(self):
        """Test unauthenticated user cannot access."""
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_nonexistent_society(self):
        """Test accessing a nonexistent society returns 404."""
        self.client.force_authenticate(user=self.admin_user)
        url = reverse('society_news_list', args=[9999])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
    def test_create_news_invalid_data(self):
        """Test creating a news post with invalid data returns error."""
        self.client.force_authenticate(user=self.president_student)
        data = {'content': 'Test content for new post'}
        qd = self._to_querydict(data)
        response = self.client.post(self.url, qd, content_type='application/x-www-form-urlencoded')
        self.assertIn(response.status_code, [
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_500_INTERNAL_SERVER_ERROR
        ])

    def test_get_news_authenticated_member_with_management_permission(self):
        """
        Test that a society member with management permissions (e.g., president)
        sees all news posts (draft and published).
        """
        self.client.force_authenticate(user=self.president_student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_titles = [post['title'] for post in response.data]
        self.assertIn(self.published_post.title, returned_titles)
        self.assertIn(self.draft_post.title, returned_titles)
    
    def test_get_news_authenticated_member_without_management_permission(self):
        """
        Test that a regular society member (without management permissions)
        sees only published news posts.
        """
        self.client.force_authenticate(user=self.regular_student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        returned_titles = [post['title'] for post in response.data]
        self.assertIn(self.published_post.title, returned_titles)
        self.assertNotIn(self.draft_post.title, returned_titles)
        
    def test_get_news_not_member(self):
        """
        Test GET returns 403 if the user is not a member of the society.
        """
        non_member = Student.objects.create_user(
            username="non_member",
            email="nonmember@example.com",
            password="password",
            first_name="Non",
            last_name="Member",
            role="student"
        )
        self.client.force_authenticate(user=non_member)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Changed this line to check for the actual error message from permission_denied
        error_message = self._get_error_message(response)
        self.assertEqual(error_message, "You do not have permission to perform this action.")
        
    def test_get_news_exception(self):
        """
        Test GET returns 500 if an exception occurs while processing news posts.
        """
        self.client.force_authenticate(user=self.president_student)
        with patch('api.views.has_society_management_permission', side_effect=Exception("Test Exception")):
            with patch('api.views.SocietyNews.objects.filter', side_effect=Exception("Test Exception")):
                with patch('traceback.print_exc'):
                    response = self.client.get(self.url)
                    self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
                    error_message = self._get_error_message(response)
                    self.assertIn("An error occurred", error_message)

    def test_post_not_student(self):
        """
        Test POST returns 403 if the user does not have a student attribute.
        """
        non_student = User.objects.create_user(
            username="non_student",
            email="nonstudent@example.com",
            password="password",
            first_name="Non",
            last_name="Student",
            role="admin"
        )
        self.client.force_authenticate(user=non_student)
        data = {
            'title': 'New Post',
            'content': 'Content of the new post'
        }
        qd = self._to_querydict(data)
        response = self.client.post(self.url, qd, content_type='application/x-www-form-urlencoded')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        error_message = self._get_error_message(response)
        self.assertIn("Only society presidents and vice presidents", error_message)
    
    def test_post_no_management_permission(self):
        """
        Test POST returns 403 if a student without management permissions tries to create a news post.
        """
        self.client.force_authenticate(user=self.regular_student)
        data = {
            'title': 'New Post',
            'content': 'Content of the new post'
        }
        qd = self._to_querydict(data)
        response = self.client.post(self.url, qd, content_type='application/x-www-form-urlencoded')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        error_message = self._get_error_message(response)
        self.assertIn("Only society presidents and vice presidents", error_message)