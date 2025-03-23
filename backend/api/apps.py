# api/apps.py
from django.apps import AppConfig


class ApiConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'

    def ready(self):
        import api.signals
        import api.views.admin_handle_event_view
        import api.views.admin_handle_society_view
        import api.views.admin_handle_student_view