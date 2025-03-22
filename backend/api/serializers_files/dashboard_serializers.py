from api.models import Notification
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


class DashboardStatisticSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics.
    """
    total_societies = serializers.IntegerField()
    total_events = serializers.IntegerField()
    pending_approvals = serializers.IntegerField()
    active_members = serializers.IntegerField()

class DashboardNotificationSerializer(serializers.ModelSerializer):
    """
    Updated Notification serializer to include read/unread tracking for the dashboard.
    """
    student_name = serializers.CharField(source="for_user.full_name", read_only=True)

    class Meta:
        """Dashboard notification meta data"""
        model = Notification
        fields = [
            'id',
            'body',
            'is_read',
            'header',
            'student_name'
        ]
        # Removed 'timestamp' since the model does not have it
