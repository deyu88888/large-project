"""Unit tests for the Dashboard Consumer."""
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.test import TestCase, override_settings
from django.urls import re_path
from asgiref.sync import sync_to_async
from api.consumer.dashboard_consumer import DashboardConsumer
from api.models import Society, Event, Student, User
from api.tests.file_deletion import delete_file

application = URLRouter([
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
])


@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
class TestDashboardConsumer(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create initial data before all tests."""
        # Create admin for society approval
        admin = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            password="adminpassword",
        )
        
        # Create a student to be a society president
        student = Student.objects.create(
            username="john_doe",
            email="john@example.com",
            first_name="John",
            last_name="Doe",
            major="Computer Science",
        )
        
        # Create societies with required fields
        Society.objects.create(
            name="Approved Society", 
            status="Approved",
            president=student,
            approved_by=admin,
            social_media_links={"Email": "approved@example.com"}
        )
        
        Society.objects.create(
            name="Pending Society", 
            status="Pending",
            president=student,
            approved_by=admin,
            social_media_links={"Email": "pending@example.com"}
        )
        
        # Create an event
        approved_society = Society.objects.get(name="Approved Society")
        Event.objects.create(
            title="Event 1", 
            location="Room A",
            hosted_by=approved_society
        )

    async def discard_initial_messages(self, communicator):
        """Discard initial messages sent when the consumer connects."""
        await communicator.receive_json_from()
        await communicator.receive_json_from()

    async def test_websocket_connect(self):
        """Test successful WebSocket connection."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected, "Should connect to the WebSocket successfully.")
        await communicator.disconnect()

    async def test_websocket_disconnect(self):
        """Test successful WebSocket disconnection."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)
        await communicator.disconnect()

    async def test_dashboard_update_broadcast(self):
        """Verify that the dashboard activities message is broadcasted when dashboard_update is called."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await self.discard_initial_messages(communicator)

        # Construct message data and send group broadcast
        message_data = {"totalSocieties": 2, "totalEvents": 1, "pendingApprovals": 1, "activeMembers": 1}
        channel_layer = get_channel_layer()
        await channel_layer.group_send("dashboard", {
            "type": "dashboard_update",
            "data": message_data
        })

        response = await communicator.receive_json_from()
        
        # Verify that the response is a dashboard.activities message
        self.assertEqual(response["type"], "dashboard.activities")
        self.assertEqual(response["channel"], "dashboard/activities")
        self.assertIsInstance(response["data"], list)

        await communicator.disconnect()

    async def test_receive_update_notifications(self):
        """Test update_notifications process."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await self.discard_initial_messages(communicator)

        payload = {
            "type": "update_notifications",
            "notifications": [{"id": 1, "message": "New notification"}],
        }
        await communicator.send_json_to(payload)
        response = await communicator.receive_json_from()
        
        # Verify the structure is what the consumer actually returns
        self.assertEqual(response["type"], "dashboard.activities")
        self.assertEqual(response["channel"], "dashboard/activities")
        self.assertIsInstance(response["data"], list)

        await communicator.disconnect()

    async def test_receive_dashboard_update(self):
        """Test that when a client sends a dashboard.update message, the consumer broadcasts database statistics."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await self.discard_initial_messages(communicator)

        # Send a dashboard.update message
        payload = {
            "type": "dashboard.update",
            "data": {"totalSocieties": 5, "totalEvents": 10, "pendingApprovals": 2, "activeMembers": 50},
        }
        await communicator.send_json_to(payload)
        response = await communicator.receive_json_from()
        
        # Verify the structure is what the consumer actually returns
        self.assertEqual(response["type"], "dashboard.activities")
        self.assertEqual(response["channel"], "dashboard/activities")
        self.assertIsInstance(response["data"], list)

        await communicator.disconnect()

    async def test_get_dashboard_stats(self):
        """Directly call consumer.get_dashboard_stats() to check stats."""
        consumer = DashboardConsumer(scope={"type": "websocket"})
        stats = await consumer.get_dashboard_stats()

        expected_stats = {
            "totalSocieties": await sync_to_async(Society.objects.count)(),
            "totalEvents": await sync_to_async(Event.objects.count)(),
            "pendingApprovals": await sync_to_async(lambda: Society.objects.filter(status="Pending").count())(),
            "activeMembers": await sync_to_async(Student.objects.count)(),
        }
        self.assertEqual(stats, expected_stats)

    @classmethod
    def tearDownClass(cls):
        """Clean up created files after tests."""
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
        super().tearDownClass()