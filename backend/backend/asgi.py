import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from django.core.asgi import get_asgi_application
from starlette.middleware.cors import CORSMiddleware

django_asgi_app = get_asgi_application()

django_asgi_app = CORSMiddleware(
    django_asgi_app,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

application = django_asgi_app