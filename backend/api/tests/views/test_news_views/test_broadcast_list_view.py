from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from django.db.models import Q
from api.models import User, Student, Society, Event, BroadcastMessage
import json

class TestBroadcastListView(APITestCase):
    def setUp(self):
        self.client = APIClient()
        
        
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            first_name="Admin",
            last_name="User"
        )
        
        
        self.student = Student.objects.create_user(
            username="student_user",
            email="student@example.com",
            password="password123",
            first_name="Student",
            last_name="User",
            major="Computer Science"
        )
        
        
        self.student_user = User.objects.get(username="student_user")
        
        self.second_student = Student.objects.create_user(
            username="second_student",
            email="student2@example.com",
            password="password123",
            first_name="Second",
            last_name="Student",
            major="Computer Science"
        )
        self.second_student_user = User.objects.get(username="second_student")
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student,
            approved_by=self.admin_user,
            social_media_links={"Email": "society@example.com"}
        )
        
        
        self.student.president_of = self.society
        self.student.save()
        
        
        self.student.refresh_from_db()
        
        
        self.second_student.societies.add(self.society)
        
        
        self.event = Event.objects.create(
            title="Test Event",
            location="Test Location",
            hosted_by=self.society
        )
        
        
        self.second_student.attended_events.add(self.event)
        
        
        
        self.broadcast_all = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast to all users"
        )
        self.broadcast_all.recipients.set(User.objects.all())
        
        
        self.broadcast_society = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast to society members"
        )
        self.broadcast_society.societies.add(self.society)
        
        self.broadcast_society.recipients.add(self.second_student_user)
        
        
        self.broadcast_event = BroadcastMessage.objects.create(
            sender=self.admin_user,
            message="Broadcast to event attendees"
        )
        self.broadcast_event.events.add(self.event)
        
        self.broadcast_event.recipients.add(self.second_student_user)
        
        
        self.broadcast_admin = BroadcastMessage.objects.create(
            sender=self.student_user,
            message="Broadcast to admin only"
        )
        self.broadcast_admin.recipients.add(self.admin_user)
        
        
        self.url = reverse('get-news')
    
    def test_list_broadcasts_unauthorized(self):
        """Test that unauthorized users cannot list broadcasts"""
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_list_broadcasts_admin(self):
        """Test admin can access their broadcasts"""
        self.client.force_authenticate(user=self.admin_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        self.assertEqual(len(response.data), 2)
        
        message_texts = [item['message'] for item in response.data]
        self.assertIn("Broadcast to all users", message_texts)
        self.assertIn("Broadcast to admin only", message_texts)
        
        
        self.assertNotIn("Broadcast to society members", message_texts)
        self.assertNotIn("Broadcast to event attendees", message_texts)
    
    def test_list_broadcasts_student_society_member(self):
        """Test student who is a society member can see society broadcasts"""
        self.client.force_authenticate(user=self.second_student)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.assertEqual(len(response.data), 3)
        
        message_texts = [item['message'] for item in response.data]
        self.assertIn("Broadcast to all users", message_texts)
        self.assertIn("Broadcast to society members", message_texts)
        self.assertIn("Broadcast to event attendees", message_texts)
        
        
        self.assertNotIn("Broadcast to admin only", message_texts)
    
    def test_list_broadcasts_student_president(self):
        """Test student who is a society president can see relevant broadcasts"""
        self.client.force_authenticate(user=self.student)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        
        
        
        self.student.societies.add(self.society)
        
        response = self.client.get(self.url)
        
        message_texts = [item['message'] for item in response.data]
        self.assertIn("Broadcast to all users", message_texts)
        self.assertIn("Broadcast to society members", message_texts)
        
        
        self.assertNotIn("Broadcast to admin only", message_texts)
        self.assertNotIn("Broadcast to event attendees", message_texts)
    
    def test_empty_broadcasts(self):
        """Test for a user with no broadcasts"""
        
        new_user = User.objects.create_user(
            username="new_user",
            email="newuser@example.com",
            password="password123",
            role="student",
            first_name="New",
            last_name="User"
        )
        
        self.client.force_authenticate(user=new_user)
        
        response = self.client.get(self.url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 0)  

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