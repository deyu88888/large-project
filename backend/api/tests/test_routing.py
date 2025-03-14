from django.test import TransactionTestCase
from channels.testing import WebsocketCommunicator
from channels.routing import URLRouter
from api.routing import websocket_urlpatterns


class WebSocketRoutingTests(TransactionTestCase):
    """ Test for WebSocket routing """

    def setUp(self):
        """ initialize WebSocket routing """
        self.application = URLRouter(websocket_urlpatterns)

    async def test_dashboard_route(self):
        """ Test if ws/dashboard/ match WebSocket """
        communicator = WebsocketCommunicator(self.application, "/ws/dashboard/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected, "Fail to connect Dashboard WebSocket")
        await communicator.disconnect()

    async def test_society_route(self):
        """ Test if ws/admin/society/ match SocietyConsumer """
        communicator = WebsocketCommunicator(self.application, "/ws/admin/society/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected, "Fail to connect Society WebSocket")
        await communicator.disconnect()

    async def test_event_route(self):
        """ Test if ws/admin/event/ match EventConsumer """
        communicator = WebsocketCommunicator(self.application, "/ws/admin/event/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected, "Fail to connect Event WebSocket")
        await communicator.disconnect()

    async def test_comment_route(self):
        """ Test if ws/event/<event_id>/ match CommentConsumer """
        communicator = WebsocketCommunicator(self.application, "/ws/event/123/")
        connected, _ = await communicator.connect()
        self.assertTrue(connected, "Fail to connect Comment WebSocket")
        await communicator.disconnect()
