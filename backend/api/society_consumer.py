from channels.generic.websocket import AsyncWebsocketConsumer
import json

class SocietyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.group_name = "society_updates"

        await self.channel_layer.group_add(
            self.group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.group_name,
            self.channel_name
        )

    async def society_list_update(self, event):
        """
        This function sends updates to the admin panel when a new society is approved.
        """
        await self.send(text_data=json.dumps({
            "message": event["message"],
            "data": event["data"]
        }))
