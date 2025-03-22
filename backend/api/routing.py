# api/routing.py
from django.urls import re_path
from .consumer.comment_consumer import CommentConsumer
from .consumer.dashboard_consumer import DashboardConsumer
from .consumer.society_consumer import SocietyConsumer
from .consumer.event_consumer import EventConsumer
from .consumer.echo_consumer import EchoConsumer

websocket_urlpatterns = [
    # Main WebSocket endpoints
    re_path(r"ws/main/$", DashboardConsumer.as_asgi()),
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
    
    # Test endpoint with simpler consumer
    re_path(r"ws/echo/$", EchoConsumer.as_asgi()),
    
    # Other existing endpoints
    re_path(r"ws/admin/society/$", SocietyConsumer.as_asgi()),
    re_path(r"ws/admin/event/$", EventConsumer.as_asgi()),
    re_path(r"ws/event/(?P<event_id>\d+)/$", CommentConsumer.as_asgi()),
    
    # Test endpoint
    re_path(r"ws/test-connection/$", DashboardConsumer.as_asgi()),
]