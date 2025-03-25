from api.models import SiteSettings
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from api.serializers_files.user_serializers import *
from api.serializers_files.activity_serializers import *
from api.serializers_files.award_serializers import *
from api.serializers_files.communication_serializers import *
from api.serializers_files.dashboard_serializers import *
from api.serializers_files.event_serializers import *
from api.serializers_files.recommendation_feedback_serializers import *
from api.serializers_files.request_serializers import *
from api.serializers_files.society_serializers import *


class SiteSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for the SiteSettings model.  Used for the website introduction.
    """
    class Meta:
        model = SiteSettings
        fields = ('introduction_title', 'introduction_content')
        read_only_fields = ('introduction_title', 'introduction_content')