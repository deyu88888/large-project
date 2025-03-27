from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from api.models import User, Student, Society
from unittest.mock import patch
import json

class TestSocietyRoleManagementView(APITestCase):
    def setUp(self):
        
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            first_name="Admin",
            last_name="User"
        )
        
        
        self.president = Student.objects.create_user(
            username="president_user",
            email="president@example.com",
            password="password123",
            first_name="President",
            last_name="User",
            major="Business"
        )
        
        
        self.student1 = Student.objects.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            major="Computer Science"
        )
        
        
        self.student2 = Student.objects.create_user(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            major="Mathematics"
        )
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.president,
            approved_by=self.admin_user,
            social_media_links={"Email": "society@example.com"}
        )
        
        
        self.president.president_of = self.society
        self.president.save()
        
        
        self.society_members = [self.president, self.student1, self.student2]
        for student in self.society_members:
            student.societies.add(self.society)
        
        
        self.url = reverse('society-roles', args=[self.society.id])
    
    def test_unauthorized_access(self):
        """Test that unauthenticated users cannot access the view"""
        response = self.client.patch(self.url, {'vice_president': self.student1.id})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_non_president_access(self):
        """Test that non-president users cannot manage roles"""
        self.client.force_authenticate(user=self.student1)
        
        with patch('api.views.has_society_management_permission', return_value=False):
            response = self.client.patch(self.url, {'vice_president': self.student2.id})
            
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data, {"error": "Insufficient permissions"})
    
    def test_assign_vice_president(self):
        """Test assigning a vice president"""
        self.client.force_authenticate(user=self.president)
        
        response = self.client.patch(self.url, {'vice_president': self.student1.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.society.refresh_from_db()
        self.student1.refresh_from_db()
        
        
        self.assertEqual(self.society.vice_president, self.student1)
        self.assertTrue(self.student1.is_vice_president)
    
    def test_assign_event_manager(self):
        """Test assigning an event manager"""
        self.client.force_authenticate(user=self.president)
        
        response = self.client.patch(self.url, {'event_manager': self.student2.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.society.refresh_from_db()
        self.student2.refresh_from_db()
        
        
        self.assertEqual(self.society.event_manager, self.student2)
        self.assertTrue(self.student2.is_event_manager)
    
    def test_assign_both_roles(self):
        """Test assigning both roles in one request"""
        self.client.force_authenticate(user=self.president)
        
        response = self.client.patch(self.url, {
            'vice_president': self.student1.id,
            'event_manager': self.student2.id
        })
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.society.refresh_from_db()
        self.student1.refresh_from_db()
        self.student2.refresh_from_db()
        
        
        self.assertEqual(self.society.vice_president, self.student1)
        self.assertEqual(self.society.event_manager, self.student2)
        self.assertTrue(self.student1.is_vice_president)
        self.assertTrue(self.student2.is_event_manager)
    
    def test_cannot_assign_already_filled_role(self):
        """Test that error is returned when trying to assign role that's already filled"""
        self.client.force_authenticate(user=self.president)
        
        
        self.client.patch(self.url, {'vice_president': self.student1.id})
        
        
        response = self.client.patch(self.url, {'vice_president': self.student2.id})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data, {
            "error": "This society already has a Vice President. Remove the current one first."
        })
        
        
        self.society.refresh_from_db()
        
        
        self.assertEqual(self.society.vice_president, self.student1)
    

    def test_remove_vice_president(self):
        """Test removing a vice president"""
        self.client.force_authenticate(user=self.president)
        
        
        self.client.patch(self.url, {'vice_president': self.student1.id})
        
        
        response = self.client.patch(
            self.url,
            data=json.dumps({'vice_president': None}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.society.refresh_from_db()
        self.student1.refresh_from_db()
        
        
        self.assertIsNone(self.society.vice_president)
        self.assertFalse(self.student1.is_vice_president)

    def test_remove_event_manager(self):
        """Test removing an event manager"""
        self.client.force_authenticate(user=self.president)
        
        
        self.client.patch(self.url, {'event_manager': self.student2.id})
        
        
        response = self.client.patch(
            self.url,
            data=json.dumps({'event_manager': None}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.society.refresh_from_db()
        self.student2.refresh_from_db()
        
        
        self.assertIsNone(self.society.event_manager)
        self.assertFalse(self.student2.is_event_manager)
    
    def test_assign_nonexistent_student(self):
        """Test assigning a non-existent student"""
        self.client.force_authenticate(user=self.president)
        
        response = self.client.patch(self.url, {'vice_president': 99999})
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data, {"error": "Student not found"})
    
    def test_assign_same_role_to_same_person(self):
        """Test assigning the same role to the same person (idempotent operation)"""
        self.client.force_authenticate(user=self.president)
        
        
        self.client.patch(self.url, {'vice_president': self.student1.id})
        
        
        response = self.client.patch(self.url, {'vice_president': self.student1.id})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.society.refresh_from_db()
        self.assertEqual(self.society.vice_president, self.student1)

    def tearDown(self):
        
        for society in Society.objects.all():
            if society.icon:
                try:
                    society.icon.delete(save=False)
                except:
                    pass
        
        for student in Student.objects.all():
            if student.icon:
                try:
                    student.icon.delete(save=False)
                except:
                    pass