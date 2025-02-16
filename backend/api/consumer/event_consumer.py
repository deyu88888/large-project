import json
from channels.generic.websocket import AsyncWebsocketConsumer
# from asgiref.sync import async_to_sync
# from .models import Event
# from .serializers import EventSerializer


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

    # async def receive(self, text_data):
    #     data = json.loads(text_data)
    #     event_id = data.get("event_id")
    #     status = data.get("status")

    #     event = Event.objects.filter(id=event_id).first()
    #     if event:
    #         event.status = status
    #         event.save()
    #         serializer = EventSerializer(event)

    #         await self.channel_layer.group_send(
    #             self.room_group_name,
    #             {
    #                 "type": "event_update",
    #                 "event": serializer.data,
    #             },
    #         )

    async def event_update(self, event):
        await self.send(text_data=json.dumps(event["data"]))