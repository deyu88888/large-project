from django.urls import re_path
from .consumers import DashboardConsumer
from .admin_consumer import SocietyConsumer, SocietyRequestConsumer

websocket_urlpatterns = [
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
    re_path(r"ws/admin/society-request/$", SocietyRequestConsumer.as_asgi()),
    re_path(r"ws/admin/society/$", SocietyConsumer.as_asgi()),
]