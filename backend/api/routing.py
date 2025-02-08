import os
import django
# from django.urls import path
from django.urls import re_path
from .consumers import DashboardConsumer
# from .admin_consumer import SocietyRequestConsumer
from .society_consumer import SocietyConsumer

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

websocket_urlpatterns = [
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
    # re_path(r"ws/admin/society-request/$", SocietyRequestConsumer.as_asgi()),
    re_path(r"ws/admin/society/$", SocietyConsumer.as_asgi()),
]