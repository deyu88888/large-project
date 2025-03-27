from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from api.models import Society, Student, User
import json


class TestSocietyMembersListView(TestCase):
    """
    Test suite for SocietyMembersListView which lists members of a society
    """

    def setUp(self):
        """
        Set up test data for the tests
        """
        self.client = APIClient()
        
        
        self.admin_user = User.objects.create_user(
            username='admin_user',
            email='admin@example.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        
        
        self.student1 = Student.objects.create(
            username='student1',
            email='student1@example.com',
            password='password123',
            first_name='Student',
            last_name='One',
            major='Computer Science'
        )
        
        self.student2 = Student.objects.create(
            username='student2',
            email='student2@example.com',
            password='password123',
            first_name='Student',
            last_name='Two',
            major='Engineering'
        )
        
        self.student3 = Student.objects.create(
            username='student3',
            email='student3@example.com',
            password='password123',
            first_name='Student',
            last_name='Three',
            major='Physics'
        )
        
        
        self.society1 = Society.objects.create(
            name='Test Society 1',
            description='This is test society 1',
            president=self.student1,
            status='Approved',
            approved_by=self.admin_user
        )
        
        self.society2 = Society.objects.create(
            name='Test Society 2',
            description='This is test society 2',
            president=self.student2,
            status='Approved',
            approved_by=self.admin_user
        )
        
        
        self.society1.society_members.add(self.student1, self.student2)
        self.society2.society_members.add(self.student2)
        
        
        refresh = RefreshToken.for_user(self.admin_user)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        
        
        self.url_society1_members = reverse('society-members', kwargs={'society_id': self.society1.id})
        self.url_society2_members = reverse('society-members', kwargs={'society_id': self.society2.id})
        self.url_nonexistent_society = reverse('society-members', kwargs={'society_id': 9999})

    def test_get_society_members_success(self):
        """
        Test that the view returns a 200 OK status code for a valid society
        """
        response = self.client.get(self.url_society1_members)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_society_members_nonexistent_society(self):
        """
        Test that the view returns a 404 NOT FOUND status code for a nonexistent society
        """
        response = self.client.get(self.url_nonexistent_society)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_society_members_correct_data(self):
        """
        Test that the view returns the correct members for a society
        """
        response = self.client.get(self.url_society1_members)
        data = json.loads(response.content)
        
        
        self.assertEqual(len(data), 2)
        
        
        member_ids = [member['id'] for member in data]
        
        
        self.assertIn(self.student1.id, member_ids)
        self.assertIn(self.student2.id, member_ids)
        self.assertNotIn(self.student3.id, member_ids)

    def test_get_society_members_empty_society(self):
        """
        Test that the view returns an empty list for a society with no members
        """
        
        empty_society = Society.objects.create(
            name='Empty Society',
            description='This society has no members',
            status='Approved',
            approved_by=self.admin_user,
            president=self.student3  
        )
        
        
        empty_society.society_members.clear()
        
        url = reverse('society-members', kwargs={'society_id': empty_society.id})
        response = self.client.get(url)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        data = json.loads(response.content)
        self.assertEqual(len(data), 0)

    def test_get_society_members_serialized_fields(self):
        """
        Test that the view returns all expected fields from the StudentSerializer
        """
        response = self.client.get(self.url_society1_members)
        data = json.loads(response.content)
        
        
        self.assertTrue(len(data) > 0)
        
        
        member = data[0]
        
        
        expected_fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 
            'major', 'societies', 'is_president', 'is_vice_president', 
            'is_event_manager'
        ]
        
        for field in expected_fields:
            self.assertIn(field, member)