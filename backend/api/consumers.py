import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
import logging

# Set up logger
logger = logging.getLogger(__name__)

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Handles WebSocket connection.
        Joins this socket to the 'dashboard' group.
        """
        try:
            logger.info(f"[DashboardConsumer] Attempting to connect WebSocket: {self.channel_name}")
            self.group_name = "dashboard"
            
            # Add WebSocket to the "dashboard" group
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            
            # Accept the connection
            await self.accept()
            logger.info(f"[DashboardConsumer] WebSocket connected successfully: {self.channel_name}, joined group '{self.group_name}'")
        except Exception as e:
            logger.error(f"[DashboardConsumer] Error during WebSocket connection: {e}")
            await self.close()

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
        Instead of directly sending back to just one client,
        we broadcast the message to the 'dashboard' group so all connected
        sockets receive the update.
        """
        try:
            logger.info(f"[DashboardConsumer] Received message on WebSocket: {self.channel_name}, Data: {text_data}")
            data = json.loads(text_data)
            logger.debug(f"[DashboardConsumer] Parsed WebSocket message: {data}")

            message_type = data.get("type")
            if message_type == "dashboard.update":
                # Fetch updated statistics and broadcast to entire group
                stats = await self.get_dashboard_stats()
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "broadcast_dashboard_update",
                        "data": stats,
                    }
                )
            elif message_type == "update_notifications":
                notifications = data.get("notifications", [])
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "broadcast_notifications",
                        "notifications": notifications,
                    }
                )
            elif message_type == "update_events":
                events = data.get("events", [])
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "broadcast_events",
                        "events": events,
                    }
                )
            elif message_type == "update_activities":
                activities = data.get("activities", [])
                await self.channel_layer.group_send(
                    self.group_name,
                    {
                        "type": "broadcast_activities",
                        "activities": activities,
                    }
                )
            else:
                logger.warning(f"[DashboardConsumer] Unknown message type received: {message_type}")
                await self.send(json.dumps({"error": "Unknown message type"}))
        except Exception as e:
            logger.error(f"[DashboardConsumer] Error processing WebSocket message: {e}")
            await self.send(json.dumps({"error": str(e)}))

    # =========================================================
    #  BROADCAST HANDLERS - Called for each group member's socket
    # =========================================================

    async def broadcast_dashboard_update(self, event):
        """
        Broadcasts dashboard stats to all 'dashboard' group members.
        """
        logger.info(f"[DashboardConsumer] Broadcasting dashboard update to {self.channel_name}")
        await self.send(json.dumps({
            "type": "dashboard.update",
            "data": event["data"],
        }))

    async def broadcast_notifications(self, event):
        """
        Broadcasts notifications to all 'dashboard' group members.
        """
        notifications = event["notifications"]
        logger.info(f"[DashboardConsumer] Broadcasting notifications to {self.channel_name}: {notifications}")
        await self.send(json.dumps({
            "type": "update_notifications",
            "notifications": notifications,
        }))

    async def broadcast_events(self, event):
        """
        Broadcasts events to all 'dashboard' group members.
        """
        events = event["events"]
        logger.info(f"[DashboardConsumer] Broadcasting events to {self.channel_name}: {events}")
        await self.send(json.dumps({
            "type": "update_events",
            "events": events,
        }))

    async def broadcast_activities(self, event):
        """
        Broadcasts activities to all 'dashboard' group members.
        """
        activities = event["activities"]
        logger.info(f"[DashboardConsumer] Broadcasting activities to {self.channel_name}: {activities}")
        await self.send(json.dumps({
            "type": "update_activities",
            "activities": activities,
        }))

    @sync_to_async
    def get_dashboard_stats(self):
        """
        Helper method to get the latest dashboard statistics from the database.
        """
        try:
            logger.debug("[DashboardConsumer] Fetching dashboard statistics from the database.")
            from api.models import Society, Event, Student  # Lazy import models here

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