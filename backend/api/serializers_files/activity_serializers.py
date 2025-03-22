from api.models import ActivityLog
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


class ActivityLogSerializer(serializers.ModelSerializer):
    """A serializer for the ActivityLog"""
    timestamp = serializers.DateTimeField(format='%d-%m-%Y %H:%M:%S')
    class Meta:
        model = ActivityLog
        fields = '__all__'


class RecentActivitySerializer(serializers.Serializer):
    """
    Serializer for recent activities on the dashboard.
    """
    description = serializers.CharField(max_length=500)
    timestamp = serializers.DateTimeField()
