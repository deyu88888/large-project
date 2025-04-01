# api/apps.py
import sys
from django.apps import AppConfig

class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        if "runserver" in sys.argv:
            from .scheduler import start_scheduler
            start_scheduler()