# api/tests/test_consumers_dashboard.py

import json
import pytest
import datetime
from django.test import TestCase, override_settings
from django.utils import timezone
from channels.layers import get_channel_layer
from channels.routing import URLRouter
from channels.testing import WebsocketCommunicator
from django.urls import re_path
from asgiref.sync import sync_to_async
from api.consumers import DashboardConsumer
from api.models import Society, Event, Student
import pytest

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
        connected, subprotocol = await communicator.connect()
        self.assertTrue(connected, "Should connect to the WebSocket successfully.")

        # Optionally read a short time to ensure no message is broadcast automatically
        with self.assertRaises(TimeoutError):
            await communicator.receive_json_from(timeout=0.1)

        await communicator.disconnect()


    async def test_websocket_disconnect(self):
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        await communicator.disconnect()
        # If we got here with no exceptions, the disconnect is fine.

    async def test_dashboard_update_broadcast(self):
        """Check group_send -> broadcast_dashboard_update -> consumer sends message."""
        communicator = WebsocketCommunicator(application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        # Send a group broadcast that triggers broadcast_dashboard_update
        channel_layer = get_channel_layer()
        message_data = {"totalSocieties": 2}
        await channel_layer.group_send("dashboard", {
            "type": "broadcast_dashboard_update",
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

        # The consumer receives it, calls group_send, which triggers broadcast_notifications
        # => we then expect the same message from the consumer
        response = await communicator.receive_json_from()
        self.assertEqual(response, payload)

        await communicator.disconnect()

    async def test_get_dashboard_stats(self):
        """Directly call consumer.get_dashboard_stats() to confirm the DB data."""
        # Create an instance of the consumer
        consumer = DashboardConsumer(scope={"type": "websocket"})
        stats = await consumer.get_dashboard_stats()

        # Based on setUpTestData: 2 societies, 1 event, 1 pending approval, 1 active member
        expected_stats = {
            "totalSocieties": 2,    # we have 2 societies
            "totalEvents": 1,       # we created 1 event
            "pendingApprovals": 1,  # 1 is pending
            "activeMembers": 1,     # 1 Student
        }
        self.assertEqual(stats, expected_stats)