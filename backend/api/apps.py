# api/apps.py
import sys
from django.apps import AppConfig


def is_daphne_running():
    return any("daphne" in arg.lower() for arg in sys.argv)


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):

        if is_daphne_running() or "runserver" in sys.argv:
            from .scheduler import start_scheduler
            start_scheduler()