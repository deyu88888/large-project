# """
# ASGI config for backend project.

# It exposes the ASGI callable as a module-level variable named ``application``.

# For more information on this file, see
# https://docs.djangoproject.com/en/4.2/howto/deployment/asgi/
# """

# import os
# import django
# from django.core.asgi import get_asgi_application
# from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.security.websocket import AllowedHostsOriginValidator
# from channels.auth import AuthMiddlewareStack
# from api.routing import websocket_urlpatterns

# os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
# django.setup()  # Ensure Django is initialized

# # Initialize Django ASGI application for HTTP requests
# django_asgi_app = get_asgi_application()

# # Define the ASGI application with HTTP and WebSocket support
# application = ProtocolTypeRouter({
#     "http": django_asgi_app,
#     "websocket": AllowedHostsOriginValidator(
#         AuthMiddlewareStack(
#             URLRouter(websocket_urlpatterns)
#         )
#     ),
# })

import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
django.setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
import api.routing

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": URLRouter(api.routing.websocket_urlpatterns),
})
