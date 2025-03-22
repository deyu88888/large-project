import datetime
from api.models import AdminReportRequest, Award, AwardStudent, BroadcastMessage, SiteSettings, User, Student, Society, Event, \
    Notification, Request, SocietyRequest, SocietyShowreel, SocietyShowreelRequest, EventRequest, UserRequest, \
    Comment, DescriptionRequest, ActivityLog, ReportReply, SocietyNews, NewsComment, NewsPublicationRequest
from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from django.utils.translation import gettext_lazy as _
from django.utils.dateformat import format as django_format
from django.utils.timezone import localtime


class SiteSettingsSerializer(serializers.ModelSerializer):
    """
    Serializer for the SiteSettings model.  Used for the website introduction.
    """
    class Meta:
        model = SiteSettings
        fields = ('introduction_title', 'introduction_content')
        read_only_fields = ('introduction_title', 'introduction_content')



class SocietyShowreelSerializer(serializers.ModelSerializer):
    """
    Serializer for the SocietyShowreel model
    """

    class Meta:
        """SocietyShowreelSerializer meta data"""
        model = SocietyShowreel
        fields= ('photo', 'caption')


class SocietySerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Society model """
    showreel_images = SocietyShowreelSerializer(many=True, required=False)
    president = StudentSerializer(read_only=True)
    president_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, source='president'
    )
    vice_president = StudentSerializer(read_only=True)
    vice_president_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, source='vice_president', required=False
    )
    event_manager = StudentSerializer(read_only=True)
    event_manager_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, source='event_manager', required=False
    )
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    icon = serializers.SerializerMethodField()

    class Meta:
        """SocietySerializer meta data"""
        model = Society
        fields = [
            'id', 'name', 'description', 'society_members', 'approved_by',
            'status', 'category', 'social_media_links', 'showreel_images',
            'membership_requirements', 'upcoming_projects_or_plans', 'icon','tags','president_id',
            'vice_president', 'event_manager','event_manager_id', 'vice_president_id',
            'president',
        ]
        extra_kwargs = {
            'society_members': {'required': False},  # Allows empty or missing data
            'social_media_links': {'required': False},
            'membership_requirements': {'required': False},
            'upcoming_projects_or_plans': {'required': False},
        }

    def get_icon(self, obj):
        """Return full URL for the icon image"""
        if obj.icon:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.icon.url) if request else obj.icon.url
        return None

    def validate_social_media_links(self, value):
        """ Ensure social media links include valid URLs """
        if value:
            for key, link in value.items():
                if not link.startswith("http"):
                    raise serializers.ValidationError(f"{key} link must be a valid URL.")
        return value

    def create(self, validated_data):
        """ Use passing in JSON dict data to create a new Society """
        photos_data = validated_data.pop('showreel_images', [])
        members_data = validated_data.pop('society_members', [])
        tags_data = validated_data.pop('tags', [])


        society = Society.objects.create(**validated_data)

        if members_data:
            society.society_members.set(members_data)
        for photo_data in photos_data:
            SocietyShowreel.objects.create(society=society, **photo_data)

        society.tags = tags_data  # Assign tags
        society.save()
        return society

    def update(self, instance, validated_data):
        """ Use passing in a Society and JSON dict data to update a Society """
        photos_data = validated_data.pop('showreel_images', [])
        members_data = validated_data.pop('society_members', [])
        tags_data = validated_data.pop('tags', [])

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.showreel_images.all().delete()
        if members_data:
            instance.society_members.set(members_data)
        for photo_data in photos_data:
            SocietyShowreel.objects.create(society=instance, **photo_data)

        instance.tags = tags_data  # Assign updated tags
        instance.save()
        return instance


class LeaveSocietySerializer(serializers.Serializer):
    """
    Serializer for leaving a society.
    """

    def __init__(self, *args, **kwargs):
        # Expect society_id to be passed in the context, not request.data
        self.society_id = kwargs.pop('society_id', None)
        super().__init__(*args, **kwargs)

    def validate(self, data):
        """
        Validate if the user can leave the given society.
        """
        request_user = self.context['request'].user

        # Ensure the user is a student
        if not hasattr(request_user, 'student'):
            raise serializers.ValidationError({"error": "Only students can leave societies."})

        # Ensure society_id is provided (from the URL)
        society_id = self.society_id
        if society_id is None:
            raise serializers.ValidationError({"error": "society_id is required."})

        # Check if the society exists
        try:
            society = Society.objects.get(id=society_id)
        except Society.DoesNotExist:
            raise serializers.ValidationError({"error": "Society does not exist."})

        # Check if the user is actually a member of the society
        if not society.society_members.filter(id=request_user.id).exists():
            raise serializers.ValidationError({"error": "You are not a member of this society."})

        return {"society": society}

    def save(self):
        """
        Remove the student from the society.
        """
        request_user = self.context['request'].user
        society = self.validated_data["society"]

        # Remove the user from the society
        request_user.student.societies.remove(society)

        return society


class JoinSocietySerializer(serializers.Serializer):
    society_id = serializers.IntegerField()

    def validate_society_id(self, value):
        request_user = self.context['request'].user
        if not hasattr(request_user, 'student'):
            raise serializers.ValidationError("Only students can join societies.")

        try:
            society = Society.objects.get(id=value)
        except Society.DoesNotExist:
            raise serializers.ValidationError("Society does not exist.")

        if society.society_members.filter(id=request_user.id).exists():
            raise serializers.ValidationError("You are already a member of this society.")

        # Check if there's already a pending request
        pending_request = SocietyRequest.objects.filter(
            from_student=request_user.student,
            society=society,
            intent="JoinSoc",
            approved=False
        ).exists()

        if pending_request:
            raise serializers.ValidationError("You already have a pending request to join this society.")

        return value

    def save(self):
        # This method is no longer used for directly adding students to societies.
        # The view now creates a SocietyRequest instead.
        society_id = self.validated_data['society_id']
        society = Society.objects.get(id=society_id)
        return society


class StartSocietyRequestSerializer(serializers.ModelSerializer):
    """Serializer for creating a new society request."""

    description = serializers.CharField(max_length=500)
    category = serializers.CharField(max_length=50)
    requested_by = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), required=True)

    class Meta:
        model = Society
        fields = ["id", "name", "description", "category", "requested_by", "status"]
        read_only_fields = ["status"]

    def validate(self, data):
        # Check if a society with the same name already exists
        if Society.objects.filter(name=data["name"]).exists():
            raise serializers.ValidationError("A society with this name already exists.")
        return data

    def create(self, validated_data):
        """Handle creating a society request (save as a draft society)."""
        return Society.objects.create(
            name=validated_data["name"],
            roles={"description": validated_data["description"], "category": validated_data["category"]},
            president=validated_data["requested_by"],
            status="Pending"
        )


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
        request_obj = self.context.get("request")
        if not request_obj:
            raise serializers.ValidationError("Request is required in serializer context.")
        user = request_obj.user
        if not hasattr(user, "student"):
            raise serializers.ValidationError("Only students can request society updates.")
        
        # Set the required from_student field from the current user's student instance.
        validated_data["from_student"] = user.student
        
        # Optionally, set default intent and approved flag if not provided.
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
    # Use SerializerMethodField to always include 'event' in the output.
    event = serializers.SerializerMethodField()
    # Make 'approved' writable
    approved = serializers.BooleanField(required=False)

    class Meta:
        """EventRequestSerializer meta data"""
        model = EventRequest
        fields = [
            "id", "event", "title", "description", "location", "date",
            "start_time", "duration", "hosted_by", "from_student",
            "intent", "approved", "requested_at",
        ]
        # These fields are set automatically and should not be provided in input.
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
        # Ensure that 'hosted_by' is provided via extra kwargs (e.g. from the view)
        hosted_by = validated_data.get("hosted_by") or self.context.get("hosted_by")
        if hosted_by is None:
            raise serializers.ValidationError({"hosted_by": "This field is required."})

        request = self.context.get("request")
        if not request:
            raise serializers.ValidationError("Request is required in serializer context.")
        user = request.user

        if not hasattr(user, "student"):
            raise serializers.ValidationError("Only students can request event creation.")

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
        # Allow updating the 'approved' field (and others) as provided.
        instance.approved = validated_data.get("approved", instance.approved)
        instance.title = validated_data.get("title", instance.title)
        instance.description = validated_data.get("description", instance.description)
        instance.location = validated_data.get("location", instance.location)
        instance.date = validated_data.get("date", instance.date)
        instance.start_time = validated_data.get("start_time", instance.start_time)
        instance.duration = validated_data.get("duration", instance.duration)
        instance.save()
        return instance


# api/serializers.py (snippet)

class AwardSerializer(serializers.ModelSerializer):
    """
    Serializer for the Award model
    """
    class Meta:
        model = Award
        fields = '__all__'


class AwardStudentSerializer(serializers.ModelSerializer):
    """
    Serializer for the AwardStudent model
    """
    award = AwardSerializer(read_only=True)
    student = StudentSerializer(read_only=True)
    student_id = serializers.PrimaryKeyRelatedField(
        source='student',
        queryset=Student.objects.all(),
        write_only=True
    )
    award_id = serializers.PrimaryKeyRelatedField(
        source='award',
        queryset=Award.objects.all(),
        write_only=True
    )

    class Meta:
        model = AwardStudent
        fields = ['id', 'award', 'student', 'student_id', 'award_id', 'awarded_at']
        
class PendingMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for pending membership requests.
    """
    student_id = serializers.IntegerField(source="from_student.id")
    first_name = serializers.CharField(source="from_student.first_name")
    last_name = serializers.CharField(source="from_student.last_name")
    username = serializers.CharField(source="from_student.username")

    class Meta:
        """UserRequest meta data"""
        model = UserRequest
        fields = ["id", "student_id", "first_name", "last_name", "username", "approved"]
        
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
        replies = ReportReply.objects.filter(report=obj, parent_reply=None).order_by('created_at')
        return ReportReplySerializer(replies, many=True).data


class DescriptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DescriptionRequest
        fields = ['id', 'society', 'new_description', 'status', 'reviewed_by', 'created_at', 'updated_at']


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
        return obj.news_post.title if obj.news_post else "Unknown"

    def get_society_name(self, obj):
        return obj.news_post.society.name if obj.news_post and obj.news_post.society else "Unknown"

    def get_requester_name(self, obj):
        return obj.requested_by.full_name if obj.requested_by else "Unknown"

    def get_reviewer_name(self, obj):
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