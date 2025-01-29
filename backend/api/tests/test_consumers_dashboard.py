import json
import pytest
from django.test import TestCase, override_settings
from django.utils import timezone
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.urls import re_path
from asgiref.sync import sync_to_async
from api.consumers import DashboardConsumer
from api.models import Society, Event, Student

# Build an in-memory routing for tests
application = URLRouter([
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
])


@override_settings(CHANNEL_LAYERS={"default": {"BACKEND": "channels.layers.InMemoryChannelLayer"}})
class TestDashboardConsumer(TestCase):
    @classmethod
    def setUpTestData(cls):
        """Create initial data in the DB once for all tests."""
        Society.objects.create(name="Approved Society", status="Approved")
        Society.objects.create(name="Pending Society", status="Pending")
        Event.objects.create(title="Event 1", location="Room A")
        Student.objects.create(
            username="john_doe",
            email="john@example.com",
            first_name="John",
            last_name="Doe",
        )

    async def test_websocket_connect(self):
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected, "Should connect to the WebSocket successfully.")

        await communicator.disconnect()

    async def test_websocket_disconnect(self):
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.disconnect()

    async def test_dashboard_update_broadcast(self):
        """Check group_send -> dashboard_update -> consumer sends message."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Send a group broadcast that triggers dashboard_update
        channel_layer = get_channel_layer()
        message_data = {"totalSocieties": 2, "totalEvents": 1, "pendingApprovals": 1, "activeMembers": 1}
        await channel_layer.group_send("dashboard", {
            "type": "dashboard_update",
            "data": message_data
        })

        # Expect a "dashboard.update" message
        response = await communicator.receive_json_from()
        self.assertEqual(
            response,
            {"type": "dashboard.update", "data": message_data}
        )

        await communicator.disconnect()

    async def test_receive_update_notifications(self):
        """Test the consumer's receive -> group_send -> broadcast_notifications flow."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Send a client -> consumer message of type "update_notifications"
        payload = {
            "type": "update_notifications",
            "notifications": [{"id": 1, "message": "New notification"}],
        }
        await communicator.send_json_to(payload)

        # Expect the same payload to be broadcasted back
        response = await communicator.receive_json_from()
        self.assertEqual(response, payload)

        await communicator.disconnect()

    async def test_receive_dashboard_update(self):
        """Test manual dashboard updates sent from the client."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Send a client -> consumer message of type "dashboard.update"
        payload = {
            "type": "dashboard.update",
            "data": {"totalSocieties": 5, "totalEvents": 10, "pendingApprovals": 2, "activeMembers": 50},
        }
        await communicator.send_json_to(payload)

        # Expect the same data to be broadcasted
        response = await communicator.receive_json_from()
        self.assertEqual(response, {
            "type": "dashboard.update",
            "data": payload["data"],
        })

        await communicator.disconnect()

    async def test_get_dashboard_stats(self):
        """Directly call consumer.get_dashboard_stats() to confirm the DB data."""
        consumer = DashboardConsumer(scope={"type": "websocket"})
        stats = await consumer.get_dashboard_stats()

        expected_stats = {
            "totalSocieties": 2,    # 2 societies
            "totalEvents": 1,       # 1 event
            "pendingApprovals": 1,  # 1 pending society
            "activeMembers": 1,     # 1 student
        }
        self.assertEqual(stats, expected_stats)