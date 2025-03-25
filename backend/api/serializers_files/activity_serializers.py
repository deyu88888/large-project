from api.models import ActivityLog
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


class ActivityLogSerializer(serializers.ModelSerializer):
    """Serializer for the Activity Log"""
    timestamp = serializers.DateTimeField(format='%d-%m-%Y %H:%M:%S')
    performed_by = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = [
            'id', 'action_type', 'target_type', 'target_id', 'target_name',
            'target_email', 'reason', 'performed_by', 'timestamp', 'expiration_date',
            'original_data'
        ]

    def get_performed_by(self, obj):
        user = obj.performed_by
        if not user:
            return None
        return {
            "id": user.id,
            "first_name": user.first_name,
            "last_name": user.last_name,
        }


class RecentActivitySerializer(serializers.Serializer):
    """
    Serializer for recent activities on the dashboard.
    """
    description = serializers.CharField(max_length=500)
    timestamp = serializers.DateTimeField()
