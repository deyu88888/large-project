import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import logging
from .models import SiteSettings  # Import the SiteSettings model


# Set up logger
logger = logging.getLogger(__name__)

class DashboardConsumer(AsyncWebsocketConsumer):

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.channel_layer = None
        self.group_name = None
        self.channel_name = None

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

            # Add WebSocket to the "dashboard" group
            await self.channel_layer.group_add(self.group_name, self.channel_name)

            # Accept the connection
            await self.accept()
            logger.info(f"[DashboardConsumer] WebSocket connected: {self.channel_name}, group: '{self.group_name}'")

            # --- Send initial data (including SiteSettings) ---
            await self.send_initial_data()

        except Exception as e:
            logger.error(f"[DashboardConsumer] Error during WebSocket connection: {e}")
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
        """
        Handles WebSocket disconnection.
        Removes this socket from the 'dashboard' group.
        """
        try:
            logger.info(f"[DashboardConsumer] Disconnecting WebSocket: {self.channel_name}, Close Code: {close_code}")
            await self.channel_layer.group_discard(self.group_name, self.channel_name)
        except Exception as e:
            logger.error(f"[DashboardConsumer] Error during WebSocket disconnection: {e}")

    async def receive(self, text_data):
        """
        Handles incoming WebSocket messages from any client (React or wscat).
        Processes `dashboard.update` and other update types.
        """
        try:
            logger.info(f"[DashboardConsumer] Received message on WebSocket: {self.channel_name}, Data: {text_data}")
            data = json.loads(text_data)
            logger.debug(f"[DashboardConsumer] Parsed WebSocket message: {data}")

            message_type = data.get("type")
            if message_type == "dashboard.update":
                # Use provided data if available; fetch from database otherwise
                if "data" in data:
                    logger.info("[DashboardConsumer] Broadcasting manual update received via WebSocket.")
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "dashboard_update",
                            "data": data["data"],
                        }
                    )
                else:
                    logger.info("[DashboardConsumer] Fetching updated statistics from the database.")
                    stats = await self.get_dashboard_stats()
                    await self.channel_layer.group_send(
                        self.group_name,
                        {
                            "type": "dashboard_update",
                            "data": stats,
                        }
                    )
            elif message_type in ["update_notifications", "update_events", "update_activities"]:
                logger.info(f"[DashboardConsumer] Broadcasting update for {message_type}.")
                await self.channel_layer.group_send(
                    self.group_name,
                    {**data, "type": f"{message_type}"}
                )
            else:
                logger.warning(f"[DashboardConsumer] Unknown message type received: {message_type}")
                await self.send(json.dumps({"error": "Unknown message type"}))
        except json.JSONDecodeError as e:
            logger.error(f"[DashboardConsumer] JSON Decode Error: {e}")
            await self.send(json.dumps({"error": "Invalid JSON format"}))
        except Exception as e:
            logger.error(f"[DashboardConsumer] Error processing WebSocket message: {e}")
            await self.send(json.dumps({"error": str(e)}))

    # =========================================================
    #  BROADCAST HANDLERS - Called for each group member's socket
    # =========================================================

    async def dashboard_update(self, event):
        """
        Handles the 'dashboard.update' message type.
        Sends the updated statistics to the client.
        """
        logger.info(f"[DashboardConsumer] Broadcasting dashboard update: {event['data']}")
        await self.send(json.dumps({
            "type": "dashboard.update",
            "data": event["data"],
        }))

    async def update_notifications(self, event):
        """
        Handles 'update_notifications' event.
        Broadcasts notifications to all group members.
        """
        notifications = event.get("notifications", [])
        logger.info(f"[DashboardConsumer] Broadcasting notifications: {notifications}")
        await self.send(json.dumps({
            "type": "update_notifications",
            "notifications": notifications,
        }))

    async def update_events(self, event):
        """
        Handles 'update_events' event.
        Broadcasts events to all group members.
        """
        events = event.get("events", [])
        logger.info(f"[DashboardConsumer] Broadcasting events: {events}")
        await self.send(json.dumps({
            "type": "update_events",
            "events": events,
        }))

    async def update_activities(self, event):
        """
        Handles 'update_activities' event.
        Broadcasts activities to all group members.
        """
        activities = event.get("activities", [])
        logger.info(f"[DashboardConsumer] Broadcasting activities: {activities}")
        await self.send(json.dumps({
            "type": "update_activities",
            "activities": activities,
        }))

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
        """
        Helper method to get the latest dashboard statistics from the database.
        """
        try:
            logger.debug("[DashboardConsumer] Fetching dashboard statistics from the database.")
            from api.models import Society, Event, Student

            total_societies = Society.objects.count()
            total_events = Event.objects.count()
            pending_approvals = Society.objects.filter(status="Pending").count()
            active_members = Student.objects.count()

            stats = {
                "totalSocieties": total_societies,
                "totalEvents": total_events,
                "pendingApprovals": pending_approvals,
                "activeMembers": active_members,
            }
            logger.info(f"[DashboardConsumer] Dashboard statistics fetched: {stats}")
            return stats
        except Exception as e:
            logger.error(f"[DashboardConsumer] Error fetching dashboard statistics: {e}")
            return {
                "totalSocieties": 0,
                "totalEvents": 0,
                "pendingApprovals": 0,
                "activeMembers": 0,
            }
    @sync_to_async  # Use sync_to_async for database access
    def get_site_settings(self):
        """
        Fetches the SiteSettings (singleton) from the database.
        """
        logger.debug("[DashboardConsumer] Fetching site settings.")
        return SiteSettings.load()  # Use the .load() method