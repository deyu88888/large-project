# api/consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import logging
# from .models import SiteSettings  # Import the SiteSettings model


# Set up logger
logger = logging.getLogger(__name__)

class DashboardConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.group_name = "dashboard"

    async def connect(self):
        """
        Handles WebSocket connection.
        Joins this socket to the 'dashboard' group and sends initial data.
        """
        try:
            self.channel_layer = self.channel_layer
            self.group_name = "dashboard"

            if not hasattr(self, "channel_name"):
                self.channel_name = f"dashboard_{id(self)}"

            await self.channel_layer.group_add("award_notifications", self.channel_name)  # Add to awards group too

            # Add WebSocket to the "dashboard" group
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            # Accept the connection
            await self.accept()
            logger.info(f"[DashboardConsumer] WebSocket connected: {self.channel_name}, group: '{self.group_name}'")

            # --- Send initial data (including SiteSettings) ---
            await self.send_initial_data()
            
        except Exception as e:
            logger.error(f"[DashboardConsumer] Connection error: {e}")
            await self.close()

    async def send_initial_data(self):
        """
        Sends initial data (dashboard stats and site settings) to the newly connected client.
        """
        # Fetch dashboard statistics
        stats = await self.get_dashboard_stats()
        await self.send(text_data=json.dumps({
            'type': 'dashboard.update',
            'data': stats
        }))

        # Fetch and send SiteSettings (introduction) - Modified
        site_settings = await self.get_site_settings()
        await self.send(text_data=json.dumps({
            "type": "update_introduction",
            "introduction": {  # Send as a dictionary
                "title": site_settings.introduction_title,
                "content": site_settings.introduction_content.splitlines()  # Split into paragraphs
            }
        }))
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

    # Add a handler for update_introduction (optional, for later updates)
    async def update_introduction(self, event):
        """
        Handles the 'update_introduction' message (if you send it from the backend later).
        """
        logger.info(f"[DashboardConsumer] Broadcasting introduction update: {event.get('introduction')}")
        await self.send(text_data=json.dumps({
            "type": "update_introduction",
            "introduction": event["introduction"],  # Send the introduction data
        }))


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

    @sync_to_async  # Use sync_to_async for database access
    def get_site_settings(self):
        """
        Fetches the SiteSettings (singleton) from the database.
        """
        from .models import SiteSettings  # Do not import globally!
        logger.debug("[DashboardConsumer] Fetching site settings.")
        return SiteSettings.load()  # Use the .load() method