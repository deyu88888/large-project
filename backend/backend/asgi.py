# backend/asgi.py
import os
import django

# Set Django settings module and initialize Django FIRST
# before importing any models or apps
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

# NOW import everything else that depends on Django
from django.core.asgi import get_asgi_application
from starlette.middleware.cors import CORSMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack

# Import WebSocket routes AFTER Django is fully initialized
from api.routing import websocket_urlpatterns

# Initialize Django ASGI application for HTTP requests
django_asgi_app = get_asgi_application()

# Wrap the ASGI app with Starlette's CORSMiddleware
django_asgi_app = CORSMiddleware(
    django_asgi_app,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the ASGI application
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})