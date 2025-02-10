import os
import django
from django.core.asgi import get_asgi_application
from starlette.middleware.cors import CORSMiddleware  # Import Starlette's CORSMiddleware
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from channels.auth import AuthMiddlewareStack
from api.routing import websocket_urlpatterns

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()  # Ensure Django is initialized

# Initialize Django ASGI application for HTTP requests
django_asgi_app = get_asgi_application()

# Wrap the ASGI app with Starlette's CORSMiddleware to add CORS headers
django_asgi_app = CORSMiddleware(
    django_asgi_app,
    allow_origins=["http://localhost:3000"],  # Adjust this to your allowed origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define the ASGI application with HTTP and WebSocket support
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AllowedHostsOriginValidator(
        AuthMiddlewareStack(
            URLRouter(websocket_urlpatterns)
        )
    ),
})