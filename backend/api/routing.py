from django.urls import re_path
from .consumers import DashboardConsumer
<<<<<<< Updated upstream
=======
# from .admin_consumer import SocietyRequestConsumer
>>>>>>> Stashed changes
from .society_consumer import SocietyConsumer

websocket_urlpatterns = [
    re_path(r"ws/dashboard/$", DashboardConsumer.as_asgi()),
<<<<<<< Updated upstream
=======
    # re_path(r"ws/admin/society-request/$", SocietyRequestConsumer.as_asgi()),
>>>>>>> Stashed changes
    re_path(r"ws/admin/society/$", SocietyConsumer.as_asgi()),
]