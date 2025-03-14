import json
from channels.testing import WebsocketCommunicator
from channels.layers import get_channel_layer
from api.consumer.comment_consumer import CommentConsumer
from django.test import TestCase

class CommentConsumerTest(TestCase):
    async def test_new_comment(self):
        event_id = "test_event"
        communicator = WebsocketCommunicator(
            CommentConsumer.as_asgi(),
            f"/ws/comments/{event_id}/"
        )
        communicator.scope["url_route"] = {"kwargs": {"event_id": event_id}}

        connected, _ = await communicator.connect()
        self.assertTrue(connected)

        comment_data = {"user": "Alice", "message": "Hello"}
        channel_layer = get_channel_layer()
        await channel_layer.group_send(
            f"event_{event_id}",
            {
                "type": "new_comment",
                "comment_data": comment_data
            }
        )

        response = await communicator.receive_json_from()
        expected_response = {"type": "NEW_COMMENT", "payload": comment_data}
        self.assertEqual(response, expected_response)

        await communicator.disconnect()
