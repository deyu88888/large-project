from api.models import AdminReportRequest, Society, Request, SocietyRequest, SocietyShowreelRequest, \
    EventRequest, UserRequest, DescriptionRequest, ReportReply, NewsPublicationRequest
from api.serializers_files.serializers_utility import is_user_student, get_report_reply_chain
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


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
    """
    Serializer for EventRequest model
    """
    title = serializers.CharField(
    required=True,
    allow_blank=False,
    error_messages={'blank': 'Title cannot be blank.'}
    )

    hosted_by = serializers.PrimaryKeyRelatedField(
        queryset=Society.objects.all(),
        required=False
    )
    event = serializers.SerializerMethodField()
    approved = serializers.BooleanField(required=False)

    class Meta:
        """EventRequestSerializer meta data"""
        model = EventRequest
        fields = [
            "id", "event", "title", "description", "location", "date",
            "start_time", "duration", "hosted_by", "from_student",
            "intent", "approved", "requested_at",
        ]
        read_only_fields = ["from_student", "intent", "hosted_by", "event", "requested_at"]

    def get_event(self, obj):
        """Returns the id of the event the request is made for"""
        return obj.event.id if obj.event else None

    def validate_title(self, value):
        """Validates that there is more than whitespace in a title"""
        if not value.strip():
            raise serializers.ValidationError("Title cannot be blank.")
        return value

    def create(self, validated_data):
        hosted_by = validated_data.get("hosted_by") or self.context.get("hosted_by")
        if hosted_by is None:
            raise serializers.ValidationError({"hosted_by": "This field is required."})

        is_request_provided(self.context)

        user = is_user_student(
            self.context,
            "Only students can request event creation."
        )

        student = user.student
        if student.president_of != hosted_by:
            raise serializers.ValidationError("You can only create events for your own society.")

        # Remove keys that are supplied via extra kwargs so they aren't duplicated.
        validated_data.pop("hosted_by", None)
        validated_data.pop("from_student", None)
        validated_data.pop("intent", None)
        validated_data.pop("approved", None)

        # Create the event request with default values.
        event_request = EventRequest.objects.create(
            hosted_by=hosted_by,
            from_student=student,
            intent="CreateEve",
            approved=False,
            **validated_data
        )
        return event_request

    def update(self, instance, validated_data):
        """Allow updating the 'approved' field (and others) as provided."""
        instance.approved = validated_data.get("approved", instance.approved)
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.location = validated_data.get("location", instance.location)
        instance.date = validated_data.get("date", instance.date)
        instance.start_time = validated_data.get("start_time", instance.start_time)
        instance.duration = validated_data.get("duration", instance.duration)
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
        fields = ["id", "report_type", "subject", "details", "requested_at", "from_student", "from_student_username", "top_level_replies"]
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

