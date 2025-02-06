import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import logging

# Set up logger
logger = logging.getLogger(__name__)

class DashboardConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.group_name = "dashboard"

    async def connect(self):
        """Handles WebSocket connection and joins groups."""
        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.channel_layer.group_add("award_notifications", self.channel_name)  # Add to awards group too
            await self.accept()
            logger.info(f"[DashboardConsumer] WebSocket connected: {self.channel_name}, joined groups: '{self.group_name}', 'award_notifications'")
        except Exception as e:
            logger.error(f"[DashboardConsumer] Connection error: {e}")
            await self.close()

    async def disconnect(self, close_code):
        """Handles WebSocket disconnection."""
        try:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
            await self.channel_layer.group_discard("award_notifications", self.channel_name)
            logger.info(f"[DashboardConsumer] Disconnected: {self.channel_name}")
        except Exception as e:
            logger.error(f"[DashboardConsumer] Disconnection error: {e}")

    async def receive(self, text_data):
        """Handles incoming WebSocket messages from clients."""
        try:
            data = json.loads(text_data)
            message_type = data.get("type")

            if message_type == "dashboard.update":
                stats = await self.get_dashboard_stats()
                await self.channel_layer.group_send(
                    self.group_name,
                    {"type": "dashboard_update", "data": stats}
                )
            elif message_type in ["update_notifications", "update_events", "update_activities"]:
                await self.channel_layer.group_send(self.group_name, {**data, "type": message_type})
            else:
                await self.send(json.dumps({"error": "Unknown message type"}))
        except json.JSONDecodeError as e:
            await self.send(json.dumps({"error": "Invalid JSON"}))
        except Exception as e:
            await self.send(json.dumps({"error": str(e)}))

    # Broadcast handlers

    async def dashboard_update(self, event):
        """Sends updated dashboard statistics."""
        await self.send(json.dumps({"type": "dashboard.update", "data": event["data"]}))

    async def update_notifications(self, event):
        """Sends notification updates."""
        await self.send(json.dumps({"type": "update_notifications", "notifications": event.get("notifications", [])}))

    async def update_events(self, event):
        """Sends event updates."""
        await self.send(json.dumps({"type": "update_events", "events": event.get("events", [])}))

    async def update_activities(self, event):
        """Sends activity updates."""
        await self.send(json.dumps({"type": "update_activities", "activities": event.get("activities", [])}))

    async def send_award_notification(self, event):
        """Handles and sends award notifications."""
        await self.send(json.dumps({"type": "award_notification", "message": event["message"]}))

    @sync_to_async
    def get_dashboard_stats(self):
        """Fetches dashboard statistics from the database."""
        try:
            from api.models import Society, Event, Student
            return {
                "totalSocieties": Society.objects.count(),
                "totalEvents": Event.objects.count(),
                "pendingApprovals": Society.objects.filter(status="Pending").count(),
                "activeMembers": Student.objects.count(),
            }
        except Exception as e:
            logger.error(f"Error fetching dashboard stats: {e}")
            return {"totalSocieties": 0, "totalEvents": 0, "pendingApprovals": 0, "activeMembers": 0}
