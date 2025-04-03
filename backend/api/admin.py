# api/admin.py
from django.contrib import admin
from .models import SiteSettings


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    """
    Customizes the admin interface for SiteSettings.
    Prevents adding or deleting, enforcing the singleton pattern.
    """

    def has_add_permission(self, request, obj=None):
        """
        Prevent adding new SiteSettings objects.
        """
        return False

    def has_delete_permission(self, request, obj=None):
        """
        Prevent deleting SiteSettings objects.
        """
        return False