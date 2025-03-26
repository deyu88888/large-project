from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from api.models import Society, Student, User
import json


class TestPublicSocietiesView(TestCase):
    """
    Test suite for PublicSocietiesView which retrieves a list of all societies
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
        
        
        self.society1 = Society.objects.create(
            name='Academic Society',
            description='This is an academic society',
            president=self.student1,
            status='Approved',
            approved_by=self.admin_user,
            category='Academic'
        )
        
        self.society2 = Society.objects.create(
            name='Sports Society',
            description='This is a sports society',
            president=self.student2,
            status='Approved',
            approved_by=self.admin_user,
            category='Sports'
        )
        
        
        self.society3 = Society.objects.create(
            name='Pending Society',
            description='This society is pending approval',
            president=self.student1,
            status='Pending',
            approved_by=self.admin_user  
        )
        
        
        self.url_public_societies = reverse('all_societies')

    def test_get_societies_without_authentication(self):
        """
        Test that societies can be retrieved without authentication
        """
        
        self.client.credentials()
        
        
        response = self.client.get(self.url_public_societies)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_get_all_societies(self):
        """
        Test that all societies are returned regardless of status
        """
        response = self.client.get(self.url_public_societies)
        data = json.loads(response.content)
        
        
        self.assertEqual(len(data), 3)
        
        
        society_names = [society['name'] for society in data]
        
        
        self.assertIn('Academic Society', society_names)
        self.assertIn('Sports Society', society_names)
        self.assertIn('Pending Society', society_names)

    def test_society_serialization(self):
        """
        Test that societies are properly serialized with all expected fields
        """
        response = self.client.get(self.url_public_societies)
        data = json.loads(response.content)
        
        
        academic_society = next(society for society in data if society['name'] == 'Academic Society')
        
        
        expected_fields = [
            'id', 'name', 'description', 'status', 'category', 
            'president'
        ]
        
        for field in expected_fields:
            self.assertIn(field, academic_society)
        
        
        self.assertEqual(academic_society['name'], 'Academic Society')
        self.assertEqual(academic_society['description'], 'This is an academic society')
        self.assertEqual(academic_society['category'], 'Academic')
        self.assertEqual(academic_society['status'], 'Approved')

    def test_empty_societies_list(self):
        """
        Test behavior when no societies exist
        """
        
        Society.objects.all().delete()
        
        response = self.client.get(self.url_public_societies)
        data = json.loads(response.content)
        
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(data), 0)
        self.assertEqual(data, [])

    def test_society_order(self):
        """
        Test that societies are returned in the expected order (if any ordering is applied)
        """
        
        
        
        response = self.client.get(self.url_public_societies)
        data = json.loads(response.content)
        
        
        society_ids = [society['id'] for society in data]
        
        
        expected_order = list(Society.objects.all().values_list('id', flat=True))
        
        
        self.assertEqual(society_ids, expected_order)