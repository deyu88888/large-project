from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from django.urls import reverse
from api.models import User, Student, Society, Event, BroadcastMessage, SocietyNews
from api.serializers import SocietyNewsSerializer
import json

class TestNewsView(APITestCase):
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

        self.president = Student.objects.create_user(
            username="president_user",
            email="president@example.com",
            password="password123",
            first_name="President",
            last_name="User",
            major="Business"
        )

        self.president_user = User.objects.get(username="president_user")

        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.president,
            approved_by=self.admin_user,
            social_media_links={"Email": "society@example.com"}
        )

        self.president.president_of = self.society
        self.president.save()

        self.president.refresh_from_db()

        self.student.societies.add(self.society)

        self.president.societies.add(self.society)

        self.event = Event.objects.create(
            title="Test Event",
            location="Test Location",
            hosted_by=self.society
        )

        self.student.attended_events.add(self.event)

        for i in range(5):
            Student.objects.create_user(
                username=f"extra_student_{i}",
                email=f"extra{i}@example.com",
                password="password123",
                first_name=f"Extra{i}",
                last_name="Student",
                major="Various"
            )
        self.url = reverse('news')

    def test_news_creation_unauthorized(self):
        """Test that unauthorized users cannot create broadcast messages"""

        response = self.client.post(self.url, {
            'message': 'Test broadcast message',
            'target': ['all']
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(BroadcastMessage.objects.count(), 0)

    def test_news_creation_by_student(self):
        """Test that regular students cannot create broadcast messages"""
        self.client.force_authenticate(user=self.student)

        response = self.client.post(self.url, {
            'message': 'Test broadcast message',
            'target': ['all']
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(BroadcastMessage.objects.count(), 0)

    def test_news_creation_by_admin_all_users(self):
        """Test broadcast creation by admin to all users"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(self.url, {
            'message': 'Test broadcast to all users',
            'target': ['all']
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BroadcastMessage.objects.count(), 1)

        broadcast = BroadcastMessage.objects.first()
        self.assertEqual(broadcast.message, 'Test broadcast to all users')
        self.assertEqual(broadcast.sender, self.admin_user)

        total_users = User.objects.count()
        self.assertEqual(broadcast.recipients.count(), total_users)

    def test_news_creation_by_president_all_users(self):
        """Test broadcast creation by president to all users"""
        self.client.force_authenticate(user=self.president)

        response = self.client.post(self.url, {
            'message': 'Test broadcast from president to all',
            'target': ['all']
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BroadcastMessage.objects.count(), 1)

        broadcast = BroadcastMessage.objects.first()
        self.assertEqual(broadcast.message, 'Test broadcast from president to all')

        self.assertEqual(broadcast.sender, self.president_user)

        total_users = User.objects.count()
        self.assertEqual(broadcast.recipients.count(), total_users)

    def test_news_creation_to_society_members(self):
        """Test broadcast creation to specific society members"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(self.url, {
            'message': 'Society-specific broadcast',
            'societies': [self.society.id],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BroadcastMessage.objects.count(), 1)

        broadcast = BroadcastMessage.objects.first()
        self.assertEqual(broadcast.message, 'Society-specific broadcast')

        self.assertEqual(broadcast.societies.count(), 1)
        self.assertEqual(broadcast.societies.first(), self.society)

        recipients = list(broadcast.recipients.values_list('username', flat=True))
        self.assertIn(self.student_user.username, recipients)

    def test_news_creation_to_event_attendees(self):
        """Test broadcast creation to specific event attendees"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(self.url, {
            'message': 'Event-specific broadcast',
            'events': [self.event.id],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(BroadcastMessage.objects.count(), 1)

        broadcast = BroadcastMessage.objects.first()
        self.assertEqual(broadcast.message, 'Event-specific broadcast')

        self.assertEqual(broadcast.events.count(), 1)
        self.assertEqual(broadcast.events.first(), self.event)

        recipients = list(broadcast.recipients.values_list('username', flat=True))
        self.assertIn(self.student_user.username, recipients)

    def test_news_creation_to_society_and_event(self):
        """Test broadcast to both society members and event attendees"""
        self.client.force_authenticate(user=self.admin_user)
        
        
        event_only_student = Student.objects.create_user(
            username="event_only",
            email="eventonly@example.com",
            password="password123",
            first_name="Event",
            last_name="Only",
            major="Physics"
        )
        event_only_student.attended_events.add(self.event)
        event_only_user = User.objects.get(username="event_only")

        response = self.client.post(self.url, {
            'message': 'Combined broadcast',
            'societies': [self.society.id],
            'events': [self.event.id],
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        broadcast = BroadcastMessage.objects.first()
        self.assertEqual(broadcast.message, 'Combined broadcast')

        self.assertEqual(broadcast.societies.count(), 1)
        self.assertEqual(broadcast.events.count(), 1)

        recipients = list(broadcast.recipients.values_list('username', flat=True))
        self.assertIn(self.student_user.username, recipients)
        self.assertIn(event_only_user.username, recipients)

    def test_news_creation_empty_message(self):
        """Test that empty messages are rejected"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(self.url, {
            'message': '',
            'target': ['all']
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
        self.assertEqual(BroadcastMessage.objects.count(), 0)

    def test_news_creation_missing_audience(self):
        """Test that a broadcast with no defined audience creates no recipients"""
        self.client.force_authenticate(user=self.admin_user)

        response = self.client.post(self.url, {
            'message': 'Broadcast with no audience',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        broadcast = BroadcastMessage.objects.first()
        self.assertEqual(broadcast.message, 'Broadcast with no audience')

        self.assertEqual(broadcast.recipients.count(), 0)
        self.assertEqual(broadcast.societies.count(), 0)
        self.assertEqual(broadcast.events.count(), 0)

    def test_news_list_view(self):
        """Test that SocietyNewsListView lists news correctly"""
        self.client.force_authenticate(user=self.student)
        news = SocietyNews.objects.create(
            society=self.society,
            title="Big news",
            content=f"News related to {self.society}",
            author=self.student,
            tags=self.society.tags,
            status="Published",
        )
        url = reverse(
            "society_news_list",
            kwargs={"society_id": self.society.id}
        )
        response = self.client.get(url)
        expected_data = SocietyNewsSerializer([news], many=True).data
        self.assertTrue(response.data[0]["image_url"].endswith(expected_data[0]["image_url"]))
        self.assertEqual(response.data[0]["id"], expected_data[0]["id"])

    def test_news_detail_view(self):
        """Test that SocietyNewsListView lists news correctly"""
        self.client.force_authenticate(user=self.student)
        news = SocietyNews.objects.create(
            society=self.society,
            title="Big news",
            content=f"News related to {self.society}",
            author=self.student,
            tags=self.society.tags,
            status="Published",
        )
        url = reverse(
            "society_news_detail",
            kwargs={"news_id": news.id}
        )
        response = self.client.get(url)
        expected_data = SocietyNewsSerializer(news).data
        self.assertTrue(response.data["image_url"].endswith(expected_data["image_url"]))
        self.assertEqual(response.data["id"], expected_data["id"])
        self.assertEqual(response.data["content"], expected_data["content"])
        self.assertEqual(response.data["title"], expected_data["title"])

        self.assertTrue(
            response.data["society_data"]["icon"].endswith(expected_data["society_data"]["icon"])
        )
        self.assertEqual(response.data["society_data"]["id"], expected_data["society_data"]["id"])
        self.assertEqual(response.data["society_data"]["name"], expected_data["society_data"]["name"])

    def test_member_feed_view(self):
        """Test that SocietyNewsListView lists news correctly"""
        self.client.force_authenticate(user=self.student)
        news = SocietyNews.objects.create(
            society=self.society,
            title="Big news",
            content=f"News related to {self.society}",
            author=self.student,
            tags=self.society.tags,
            status="Published",
        )
        url = reverse(
            "member_news_feed",
        )
        response = self.client.get(url)
        expected_data = SocietyNewsSerializer([news], many=True).data
        self.assertTrue(response.data[0]["image_url"].endswith(expected_data[0]["image_url"]))
        self.assertEqual(response.data[0]["id"], expected_data[0]["id"])

    def tearDown(self):
        for society in Society.objects.all():
            self.attempt_delete(society.icon)

        for student in Student.objects.all():
            self.attempt_delete(student.icon)

    def attempt_delete(self, icon):
        """Attempts to delete an icon"""
        if not icon:
            return
        try:
            icon.delete(save=False)
        except:
            pass
