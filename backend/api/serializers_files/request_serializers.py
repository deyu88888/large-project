import datetime
import json

from api.models import AdminReportRequest, Society, Event, EventModule, Request, SocietyRequest, SocietyShowreelRequest, \
    EventRequest, UserRequest, DescriptionRequest, ReportReply, NewsPublicationRequest
from api.serializers_files.serializers_utility import is_user_student, get_report_reply_chain
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from api.serializers import EventModuleSerializer


def is_request_provided(context):
    """Validates that request is provided"""
    request = context.get("request")
    if not request:
        raise serializers.ValidationError("Request is required in serializer context.")

class RequestSerializer(serializers.ModelSerializer):
    """
    Abstract serializer for the Request model
    """
    class Meta:
        """RequestSerializer meta data"""
        model = Request
        fields = [
            'id', 'from_student', 'requested_at',
            'approved', 'intent'
        ]
        extra_kwargs = {
            'from_student': {'required': True},
        }

    def create(self, validated_data):
        """ Create a notification entry according to json data """
        return self.Meta.model.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """ Update 'instance' object according to provided json data """
        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.save()
        return instance

class SocietyShowreelRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for the SocietyShowreelRequest model
    """
    class Meta:
        """SocietyShowreelRequestSerializer meta data"""
        model = SocietyShowreelRequest
        fields= ('photo', 'caption')

class SocietyRequestSerializer(RequestSerializer):
    """
    Serializer for the SocietyRequest model
    """
    showreel_images_request = SocietyShowreelRequestSerializer(many=True, required=False)

    class Meta:
        """SocietyRequestSerializer meta data"""
        model = SocietyRequest
        fields = (
            RequestSerializer.Meta.fields
            + ['name', 'description', 'roles', 'president', 'category', 'icon',
            'social_media_links', 'membership_requirements',
            'upcoming_projects_or_plans', 'society', 'showreel_images_request']
        )

    def create(self, validated_data):
        photos_data = validated_data.pop('showreel_images_request', [])

        # Retrieve the request from context
        is_request_provided(self.context)
        user = is_user_student(
            self.context,
            "Only students can request society updates."
        )

        # Set the required from_student field from the current user's student instance.
        validated_data["from_student"] = user.student

        validated_data.setdefault("intent", "UpdateSoc")
        validated_data.setdefault("approved", False)

        society_request = SocietyRequest.objects.create(**validated_data)

        for photo_data in photos_data:
            SocietyShowreelRequest.objects.create(society=society_request, **photo_data)

        return society_request

    def update(self, instance, validated_data):
        photos_data = validated_data.pop('showreel_images_request', [])

        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        instance.showreel_images_request.all().delete()

        for photo_data in photos_data:
            SocietyShowreelRequest.objects.create(society=instance, **photo_data)

        return instance


class UserRequestSerializer(RequestSerializer):
    """
    Serializer for the UserRequest model
    """

    class Meta:
        """UserRequestSerializer meta data"""
        model = UserRequest
        fields = RequestSerializer.Meta.fields + ['major', 'icon']
        extra_kwargs = RequestSerializer.Meta.extra_kwargs


class EventRequestSerializer(serializers.ModelSerializer):
    extra_modules = EventModuleSerializer(many=True, required=False)
    participant_modules = EventModuleSerializer(many=True, required=False)
    event = serializers.SerializerMethodField()
    approved = serializers.BooleanField(required=False)

    class Meta:
        """EventRequestSerializer meta data"""
        model = EventRequest
        fields = [
            "id", "event", "hosted_by", "from_student", "intent",
            "approved", "requested_at", "extra_modules", "participant_modules"
        ]
        read_only_fields = ["from_student", "intent", "hosted_by", "event", "requested_at"]

    def get_event(self, obj):
        """Returns the id of the event the request is made for"""
        return obj.event.id if obj.event else None

    def _parse_json_field(self, field_name, default="[]"):
        raw_data = self.context["request"].data.get(field_name, default)
        try:
            return json.loads(raw_data)
        except json.JSONDecodeError:
            raise serializers.ValidationError({field_name: "Invalid JSON format."})

    def _create_modules(self, event, modules_data, is_participant_only, file_prefix):
        request_obj = self.context["request"]
        for index, module_data in enumerate(modules_data):
            module_data["text_value"] = module_data.pop("textValue", "")
            file_key = f"{file_prefix}_{index}"
            if file_key in request_obj.FILES:
                module_data["file_value"] = request_obj.FILES[file_key]
            EventModule.objects.create(
                event=event,
                is_participant_only=is_participant_only,
                **module_data
            )

    def create(self, validated_data):
        request_obj = self.context["request"]
        hosted_by = self.context.get("hosted_by")
        if not hosted_by:
            raise serializers.ValidationError({"hosted_by": "This field is required."})

        user = request_obj.user
        if not hasattr(user, "student"):
            raise serializers.ValidationError("Only students can request event creation.")
        student = user.student

        event_data = {
            "title": request_obj.data.get("title", ""),
            "main_description": request_obj.data.get("main_description", ""),
            "cover_image": request_obj.FILES.get("cover_image"),
            "location": request_obj.data.get("location", ""),
            "date": request_obj.data.get("date"),
            "start_time": request_obj.data.get("start_time"),
            "duration": request_obj.data.get("duration"),
            "hosted_by": hosted_by,
            "status": "Pending"
        }
        duration_str = event_data.get("duration")
        if duration_str and isinstance(duration_str, str):
            try:
                h, m, s = map(int, duration_str.split(":"))
                event_data["duration"] = datetime.timedelta(hours=h, minutes=m, seconds=s)
            except ValueError:
                raise serializers.ValidationError({"duration": "Invalid duration format. Expected HH:MM:SS."})

        event = Event.objects.create(**event_data)

        extra_modules_data = self._parse_json_field("extra_modules")
        participant_modules_data = self._parse_json_field("participant_modules")
        self._create_modules(event, extra_modules_data, is_participant_only=False, file_prefix="extra_module_file")
        self._create_modules(event, participant_modules_data, is_participant_only=True, file_prefix="participant_module_file")

        event_request = EventRequest.objects.create(
            hosted_by=hosted_by,
            from_student=student,
            intent="CreateEve",
            approved=False,
            event=event
        )
        return event_request

    def update(self, instance, validated_data):
        request_obj = self.context["request"]
        event = instance.event

        event.title = request_obj.data.get("title", event.title)
        event.main_description = request_obj.data.get("main_description", event.main_description)
        event.cover_image = request_obj.FILES.get("cover_image", event.cover_image)
        event.location = request_obj.data.get("location", event.location)
        event.date = request_obj.data.get("date", event.date)
        event.start_time = request_obj.data.get("start_time", event.start_time)

        duration_str = request_obj.data.get("duration")
        if duration_str:
            try:
                hours, minutes, seconds = map(int, duration_str.split(":"))
                event.duration = datetime.timedelta(hours=hours, minutes=minutes, seconds=seconds)
            except Exception:
                raise serializers.ValidationError({"duration": "Invalid format. Use HH:MM:SS."})

        event.status = "Pending"
        event.save()

        event.modules.all().delete()
        extra_modules_data = self._parse_json_field("extra_modules")
        participant_modules_data = self._parse_json_field("participant_modules")
        self._create_modules(event, extra_modules_data, is_participant_only=False, file_prefix="extra_module_file")
        self._create_modules(event, participant_modules_data, is_participant_only=True,
                             file_prefix="participant_module_file")

        instance.approved = None
        instance.save()
        return instance

class ReportReplySerializer(serializers.ModelSerializer):
    """
    Serializer for the ReportReply model
    """
    replied_by_username = serializers.CharField(source='replied_by.username', read_only=True)
    child_replies = serializers.SerializerMethodField()

    class Meta:
        """Metadata for ReportReplySerializer"""
        model = ReportReply
        fields = ['id', 'report', 'parent_reply', 'content', 'created_at', 
                  'replied_by', 'replied_by_username', 'is_admin_reply', 'child_replies']
        extra_kwargs = {
            'replied_by': {'read_only': True},
            'is_admin_reply': {'read_only': True}
        }

    def get_child_replies(self, obj):
        """Gets the chain of replies to a report"""
        children = get_report_reply_chain(obj)
        return ReportReplySerializer(children, many=True).data
    
class AdminReportRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for the AdminReportRequest model
    """
    from_student_username = serializers.CharField(source='from_student.username', read_only=True)
    top_level_replies = serializers.SerializerMethodField()

    class Meta:
        """AdminReportRequest meta data"""
        model = AdminReportRequest
        fields = ["id", "report_type", "subject", "details", "requested_at", "from_student", "from_student_username", "top_level_replies", "email"]
        extra_kwargs = {"from_student": {"read_only": True}}  # Auto-assign the user

    def get_top_level_replies(self, obj):
        """Get the 'roots' of the comment section"""
        replies = ReportReply.objects.filter(report=obj, parent_reply=None).order_by('created_at')
        return ReportReplySerializer(replies, many=True).data

class NewsPublicationRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for tracking news publication requests from society presidents
    """
    news_post_title = serializers.SerializerMethodField()
    society_name = serializers.SerializerMethodField()
    requester_name = serializers.SerializerMethodField()
    reviewer_name = serializers.SerializerMethodField()
    author_data = serializers.SerializerMethodField()

    class Meta:
        model = NewsPublicationRequest
        fields = [
            'id', 'news_post', 'news_post_title', 'society_name',
            'requested_by', 'requester_name', 'reviewed_by', 'reviewer_name',
            'status', 'requested_at', 'reviewed_at', 'admin_notes', 'author_data'
        ]
        read_only_fields = [
            'requested_at',
            'reviewed_at',
            'requested_by',
            'reviewed_by',
            'status',
            'news_post_title',
            'society_name',
            'requester_name',
            'reviewer_name',
            'author_data',
        ]

    def get_news_post_title(self, obj):
        """Gets the title of the news post"""
        return obj.news_post.title if obj.news_post else "Unknown"

    def get_society_name(self, obj):
        """Gets the name of the society making the news post"""
        return obj.news_post.society.name if obj.news_post and obj.news_post.society else "Unknown"

    def get_requester_name(self, obj):
        """Gets the fullname of the person wishing to publish this news"""
        return obj.requested_by.full_name if obj.requested_by else "Unknown"

    def get_reviewer_name(self, obj):
        """Get the fullname of the admin who reviewed the news"""
        return obj.reviewed_by.full_name if obj.reviewed_by else None

    def get_author_data(self, obj):
        """Get basic author information"""
        if not obj.news_post or not obj.news_post.author:
            return None

        return {
            "id": obj.news_post.author.id,
            "username": obj.news_post.author.username,
            "first_name": obj.news_post.author.first_name,
            "last_name": obj.news_post.author.last_name,
            "full_name": obj.news_post.author.full_name,
        }

    def validate(self, data):
        """Validate publication request"""
        if 'status' in data and data['status'] not in ['Pending', 'Approved', 'Rejected']:
            raise serializers.ValidationError({"status": "Status must be Pending, Approved, or Rejected"})

        return data
    
class DescriptionRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for society description change requests
    """

    class Meta:
        """Serializer metadata for DescriptionRequestSerializer"""
        model = DescriptionRequest
        fields = ['id', 'society', 'new_description', 'status', 'reviewed_by', 'created_at', 'updated_at']

