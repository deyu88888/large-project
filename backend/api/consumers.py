import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from api.models import Society, Event, Student

class DashboardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        """
        Handles a new WebSocket connection.
        """
        # Accept the connection
        await self.accept()

    async def disconnect(self, close_code):
        """
        Handles WebSocket disconnection.
        """
        pass  # Cleanup tasks if needed

    async def receive(self, text_data):
        """
        Handles incoming WebSocket messages.
        """
        try:
            # Parse incoming data (if required)
            data = json.loads(text_data)

            # Call a helper method to fetch updated statistics
            stats = await self.get_dashboard_stats()

            # Send the updated statistics back to the WebSocket client
            await self.send(text_data=json.dumps(stats))
        except Exception as e:
            # Send error message to the client
            await self.send(json.dumps({"error": str(e)}))

    @sync_to_async
    def get_dashboard_stats(self):
        """
        Helper method to get the latest dashboard statistics.
        """
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