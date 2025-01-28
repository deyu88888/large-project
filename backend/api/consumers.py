import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async


class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Handles a new WebSocket connection.
        """
        # Add the WebSocket to the "dashboard" group
        await self.channel_layer.group_add("dashboard", self.channel_name)
        # Accept the connection
        await self.accept()

    async def disconnect(self, close_code):
        """
        Handles WebSocket disconnection.
        """
        # Remove the WebSocket from the "dashboard" group
        await self.channel_layer.group_discard("dashboard", self.channel_name)

    async def receive(self, text_data):
        """
        Handles incoming WebSocket messages (if required).
        """
        try:
            # Parse incoming data
            data = json.loads(text_data)

            # Call a helper method to fetch updated statistics
            stats = await self.get_dashboard_stats()

            # Send the updated statistics back to the WebSocket client
            await self.send(text_data=json.dumps(stats))
        except Exception as e:
            # Send error message to the client
            await self.send(json.dumps({"error": str(e)}))

    async def dashboard_update(self, event):
        """
        Handles the broadcast of updated statistics.
        """
        # Send the updated data to the WebSocket client
        await self.send(text_data=json.dumps(event["data"]))

    @sync_to_async
    def get_dashboard_stats(self):
        """
        Helper method to get the latest dashboard statistics.
        """
        from api.models import Society, Event, Student  # Lazy import models here

        total_societies = Society.objects.count()
        total_events = Event.objects.count()
        pending_approvals = Society.objects.filter(status="Pending").count()
        active_members = Student.objects.count()

        return {
            "totalSocieties": total_societies,
            "totalEvents": total_events,
            "pendingApprovals": pending_approvals,
            "activeMembers": active_members,
        }
