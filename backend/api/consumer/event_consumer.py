# TODO: intial refactoring complete
# TODO: remove this file? not in use

import json
from channels.generic.websocket import AsyncWebsocketConsumer


class EventConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = "events"
        self.room_group_name = f"events_updates"

        await self.channel_layer.group_add(
            self.room_group_name, 
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name, 
            self.channel_name
        )

    async def event_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))