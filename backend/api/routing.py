import os
import django
# from django.urls import path
from django.urls import re_path
from .consumer.consumers import DashboardConsumer
# from consumer.admin_consumer import SocietyRequestConsumer
from .consumer.society_consumer import SocietyConsumer
from .consumer.event_consumer import EventConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

websocket_urlpatterns = [
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
    # re_path(r"ws/admin/society-request/$", SocietyRequestConsumer.as_asgi()),
    re_path(r"ws/admin/society/$", SocietyConsumer.as_asgi()),
    re_path(r"ws/admin/event/$", EventConsumer.as_asgi()),
]