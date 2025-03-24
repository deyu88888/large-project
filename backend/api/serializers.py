import datetime
import json

from api.models import AdminReportRequest, Award, AwardStudent, BroadcastMessage, SiteSettings, User, Student, Society, \
    Event, \
    Notification, Request, SocietyRequest, SocietyShowreel, SocietyShowreelRequest, EventRequest, UserRequest, \
    Comment, DescriptionRequest, ActivityLog, ReportReply, SocietyNews, NewsComment, NewsPublicationRequest, EventModule
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


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the base User model.
    """
    is_following = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name',
            'last_name', 'email', 'is_active', 'role', 'following',
            'is_following', 'following_count', 'followers_count',
            'is_super_admin', 'is_staff', 'is_superuser'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8},
            'username': {'validators': [UniqueValidator(queryset=User.objects.all())]},
            'email': {'validators': [UniqueValidator(queryset=User.objects.all())]},
        }

    def get_is_following(self, obj):
        """Check if the user is following."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.following.filter(id=obj.id).exists()
        return False

    def get_followers_count(self, obj):
        return obj.followers.count()

    def get_following_count(self, obj):
        return obj.following.count()

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance


class StudentSerializer(UserSerializer):
    """
    Serializer for the Student model.
    """
    societies = serializers.PrimaryKeyRelatedField(many=True, queryset=Society.objects.all())
    president_of = serializers.PrimaryKeyRelatedField(queryset=Society.objects.all(), allow_null=True, required=False)
    vice_president_of_society = serializers.SerializerMethodField()
    event_manager_of_society = serializers.SerializerMethodField()
    major = serializers.CharField(required=True)
    is_president = serializers.BooleanField(read_only=True)
    #awards = AwardStudentSerializer(source='award_students', many=True, read_only=True) this will work when files are seperated
    is_vice_president = serializers.BooleanField(read_only=True)
    is_event_manager = serializers.BooleanField(read_only=True)
    icon = serializers.SerializerMethodField()


    class Meta(UserSerializer.Meta):
        model = Student
        fields = UserSerializer.Meta.fields + ['major', 'societies', 'president_of', 'is_president',
                                               'award_students', 'vice_president_of_society', 'is_vice_president',
                                               'event_manager_of_society', 'is_event_manager', 'icon']
        read_only_fields = ["is_president", "is_vice_president", "is_event_manager", "award_students"]


    def get_event_manager_of_society(self, obj):
        """Get the ID of the society where the student is event manager"""
        try:
            # Check if it's a RelatedManager
            if hasattr(obj.event_manager_of_society, 'all'):
                society = obj.event_manager_of_society.first()
                if society:
                    return society.id

            # If it's not a RelatedManager but a direct reference
            elif hasattr(obj, 'event_manager_of_society') and obj.event_manager_of_society:
                if hasattr(obj.event_manager_of_society, 'pk'):
                    return obj.event_manager_of_society.pk
        except Exception as e:
            print(f"DEBUG - Error in get_event_manager_of_society: {str(e)}")

        return None

    def get_vice_president_of_society(self, obj):
        """Get the ID of the society where the student is vice president"""
        try:
            # Check if it's a RelatedManager
            if hasattr(obj.vice_president_of_society, 'all'):
                society = obj.vice_president_of_society.first()
                if society:
                    return society.id

            # If it's not a RelatedManager but a direct reference
            elif hasattr(obj, 'vice_president_of_society') and obj.vice_president_of_society:
                if hasattr(obj.vice_president_of_society, 'pk'):
                    return obj.vice_president_of_society.pk
        except Exception as e:
            print(f"DEBUG - Error in get_vice_president_of_society: {str(e)}")

        return None

    def get_icon(self, obj):
        """Return full URL for the icon image"""
        if obj.icon:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.icon.url) if request else obj.icon.url
        return None


    def validate_email(self, value):
        """
        Check if the email is unique and provide a custom error message.
        """
        instance = getattr(self, 'instance', None)
        if User.objects.filter(email=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("user with this email already exists.")
        return value

    def validate_username(self, value):
        """
        Check if the username is unique and provide a custom error message.
        """
        instance = getattr(self, 'instance', None)
        if User.objects.filter(username=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("user with this username already exists.")
        return value

    def create(self, validated_data):
        """
        Override create to handle Student-specific fields.
        """
        societies = validated_data.pop('societies', [])
        president_of = validated_data.pop('president_of', None)
        major = validated_data.pop('major')
        password = validated_data.pop('password')

        student = Student.objects.create(**validated_data)
        student.set_password(password)
        student.major = major
        student.save()

        if societies:
            student.societies.set(societies)

        if president_of:  # Check if president_of is provided before assigning
            student.president_of_id = president_of.id
            student.save()

        return student


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

class EventModuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = EventModule
        fields = ['id', 'type', 'text_value', 'file_value', 'is_participant_only']

class EventSerializer(serializers.ModelSerializer):
    current_attendees = StudentSerializer(many=True, read_only=True)
    extra_modules = serializers.SerializerMethodField()
    participant_modules = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'main_description', 'cover_image', 'date',
            'start_time', 'duration', 'hosted_by', 'location',
            'max_capacity', 'current_attendees', 'status',
            'extra_modules', 'participant_modules'
        ]
        extra_kwargs = {'hosted_by': {'required': True}}

    def get_extra_modules(self, obj):
        modules = obj.modules.filter(is_participant_only=False)
        return EventModuleSerializer(modules, many=True).data

    def get_participant_modules(self, obj):
        modules = obj.modules.filter(is_participant_only=True)
        return EventModuleSerializer(modules, many=True).data


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for objects of the Notification model"""

    class Meta:
        """ NotificationSerializer meta data """
        model = Notification
        fields = ["id", "header", "body", "for_user", "is_read", "is_important"]
        extra_kwargs = {
            "for_user": {"required": True}
        }

    def create(self, validated_data):
        """ Create a notification entry according to json data """
        return Notification.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """ Update 'instance' object according to provided json data """
        for key, value in validated_data.items():
            setattr(instance, key, value)

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


class RSVPEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'date', 'start_time', 'duration', 'location']

    def validate(self, attrs):
        """
        Validate RSVP eligibility for an event.
        """
        request = self.context.get('request')
        event = self.instance
        student = request.user.student

        if self.context.get('action') == 'RSVP':
            # Ensure the student is a member of the hosting society
            if event.hosted_by not in student.societies.all():
                raise serializers.ValidationError("You must be a member of the hosting society to RSVP for this event.")

            # Ensure the student has not already RSVP'd
            if student in event.current_attendees.all():
                raise serializers.ValidationError("You have already RSVP'd for this event.")

            # Ensure the event is not in the past or has started
            if event.has_started():
                raise serializers.ValidationError("You cannot RSVP for an event that has already started.")

            # Ensure the event is not full
            if event.is_full():
                raise serializers.ValidationError("This event is full and cannot accept more RSVPs.")

        elif self.context.get('action') == 'CANCEL':
            # Ensure the student is currently RSVP'd for the event
            if student not in event.current_attendees.all():
                raise serializers.ValidationError("You have not RSVP'd for this event.")

        return attrs

    def save(self, **kwargs):
        """
        Save the RSVP or cancel RSVP action.
        """
        request = self.context.get('request')
        student = request.user.student
        event = self.instance

        if self.context.get('action') == 'RSVP':
            event.current_attendees.add(student)  
        elif self.context.get('action') == 'CANCEL':
            event.current_attendees.remove(student)  

        return event


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
    extra_modules = EventModuleSerializer(many=True, required=False)
    participant_modules = EventModuleSerializer(many=True, required=False)
    event = serializers.SerializerMethodField()
    approved = serializers.BooleanField(required=False)

    class Meta:
        model = EventRequest
        fields = [
            "id", "event", "hosted_by", "from_student", "intent",
            "approved", "requested_at", "extra_modules", "participant_modules"
        ]
        read_only_fields = ["from_student", "intent", "hosted_by", "event", "requested_at"]

    def get_event(self, obj):
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


class DashboardStatisticSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics.
    """
    totalSocieties = serializers.IntegerField(source='total_societies')
    totalEvents = serializers.IntegerField(source='total_events')
    pendingApprovals = serializers.IntegerField(source='pending_approvals')
    activeMembers = serializers.IntegerField(source='active_members')


class RecentActivitySerializer(serializers.Serializer):
    """
    Serializer for recent activities on the dashboard.
    """
    description = serializers.CharField(max_length=500)
    timestamp = serializers.DateTimeField()


# api/serializers.py (snippet)

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


class EventCalendarSerializer(serializers.ModelSerializer):
    """
    Serializer for calendar events on the dashboard.
    """
    start = serializers.SerializerMethodField()
    end = serializers.SerializerMethodField()
    title = serializers.CharField()

    class Meta:
        """Calender events meta data"""
        model = Event
        fields = ["id", "title", "start", "end", "location"]
        # Mark them read-only if needed:
        read_only_fields = ["start", "end"]

    def get_start(self, obj):
        """Combine date and start_time in UTC"""
        return (
            datetime.datetime.combine(obj.date, obj.start_time)
            .replace(tzinfo=datetime.timezone.utc)
            .isoformat()
        )

    def get_end(self, obj):
        """Combine date and start_time, add duration"""
        start_dt = datetime.datetime.combine(obj.date, obj.start_time).replace(
            tzinfo=datetime.timezone.utc
        )
        return (start_dt + obj.duration).isoformat()


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


class ReportReplySerializer(serializers.ModelSerializer):
    """
    Serializer for the ReportReply model
    """
    replied_by_username = serializers.CharField(source='replied_by.username', read_only=True)
    child_replies = serializers.SerializerMethodField()
    
    class Meta:
        model = ReportReply
        fields = ['id', 'report', 'parent_reply', 'content', 'created_at', 
                  'replied_by', 'replied_by_username', 'is_admin_reply', 'child_replies']
        extra_kwargs = {
            'replied_by': {'read_only': True},
            'is_admin_reply': {'read_only': True}
        }
    
    def get_child_replies(self, obj):
        children = obj.child_replies.all().order_by('created_at')
        return ReportReplySerializer(children, many=True).data

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Comment model
    """
    replies = serializers.SerializerMethodField()
    user_data = serializers.SerializerMethodField()
    likes = serializers.SerializerMethodField()
    dislikes = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    disliked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id", "content", "create_at", "user_data", "parent_comment", "replies",
            "likes", "dislikes", "liked_by_user", "disliked_by_user"]

    def get_replies(self, obj):
        """Get all the replies of the comment"""
        request = self.context.get("request", None)
        serializer = CommentSerializer(
            obj.replies.all().order_by("create_at"),
            many=True,
            context={"request": request}
        )
        return serializer.data

    def get_user_data(self, obj):
        request = self.context.get("request", None)
        icon_url = None
        if hasattr(obj.user, 'student') and obj.user.student.icon:
            icon_url = request.build_absolute_uri(obj.user.student.icon.url) if request else obj.user.student.icon.url
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "icon": icon_url,
        }

    def get_likes(self, obj):
        return obj.total_likes()

    def get_dislikes(self, obj):
        return obj.total_dislikes()

    def get_liked_by_user(self, obj):
        """Check if the user liked this comment"""
        request = self.context.get("request", None)
        if request and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_disliked_by_user(self, obj):
        """Check if the user disliked this comment"""
        request = self.context.get("request", None)
        if request and request.user.is_authenticated:
            return obj.dislikes.filter(id=request.user.id).exists()
        return False


class DescriptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DescriptionRequest
        fields = ['id', 'society', 'new_description', 'status', 'reviewed_by', 'created_at', 'updated_at']


class BroadcastSerializer(serializers.ModelSerializer):
    class Meta:
        model = BroadcastMessage
        fields = ['id', 'sender', 'societies', 'events', 'recipients', 'message', 'created_at']
        read_only_fields = ['id', 'created_at', 'sender']

class ActivityLogSerializer(serializers.ModelSerializer):
    timestamp = serializers.DateTimeField(format='%d-%m-%Y %H:%M:%S')
    class Meta:
        model = ActivityLog
        fields = '__all__'

class NewsCommentSerializer(serializers.ModelSerializer):
    replies = serializers.SerializerMethodField()
    user_data = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    disliked_by_user = serializers.SerializerMethodField()

    class Meta:
        model = NewsComment
        fields = [
            "id",
            "content",
            "created_at",
            "user_data",
            "parent_comment",
            "replies",
            "likes_count",
            "liked_by_user",
            "dislikes_count",
            "disliked_by_user",
        ]

    def get_replies(self, obj):
        request = self.context.get("request")
        serializer = NewsCommentSerializer(
            obj.replies.all().order_by("created_at"),
            many=True,
            context={"request": request},
        )
        return serializer.data

    def get_user_data(self, obj):
        if not obj.user:
            return None
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
        }

    def get_likes_count(self, obj):
        return obj.likes.count()

    def get_liked_by_user(self, obj):
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_dislikes_count(self, obj):
        try:
            return obj.dislikes.count()
        except Exception as e:
            # Fallback to 0 if the dislikes table is not available
            return 0

    def get_disliked_by_user(self, obj):
        request = self.context.get("request")
        try:
            if request and request.user and request.user.is_authenticated:
                return obj.dislikes.filter(id=request.user.id).exists()
            return False
        except Exception as e:
            return False


class SocietyNewsSerializer(serializers.ModelSerializer):
    """
    Serializer for the SocietyNews model
    """
    author_data = serializers.SerializerMethodField()
    society_data = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField(read_only=True)

    admin_notes = serializers.SerializerMethodField()

    class Meta:
        model = SocietyNews
        fields = [
            'id', 'society', 'title', 'content', 'image', 'image_url',
            'attachment', 'attachment_name', 'author', 'author_data',
            'society_data', 'created_at', 'updated_at', 'published_at',
            'status', 'is_featured', 'is_pinned', 'tags', 'view_count',
            'comment_count', 'is_author', 'comments',
            'admin_notes',  # <-- Include the new field in your JSON output
        ]
        read_only_fields = ['created_at', 'updated_at', 'published_at', 'view_count']
        extra_kwargs = {
            'image': {'write_only': True},
            'attachment': {'write_only': True},
            'author': {'write_only': True},
            'society': {'write_only': True},
        }

    def __init__(self, *args, **kwargs):
        print("\n" + "=" * 80)
        print(f"DEBUG - SocietyNewsSerializer.__init__()")
        print(f"DEBUG - Args: {args}")
        print(f"DEBUG - Kwargs: {kwargs}")

        if 'data' in kwargs:
            print(f"DEBUG - Incoming data: {kwargs['data']}")
            if hasattr(kwargs['data'], 'dict'):
                print(f"DEBUG - Data is QueryDict, keys: {kwargs['data'].keys()}")
                req = kwargs.get('context', {}).get('request', {})
                print(f"DEBUG - Content type: {getattr(req, 'content_type', 'Unknown')}")

        super().__init__(*args, **kwargs)
        print(f"DEBUG - Serializer initialized successfully")
        print("=" * 80)

    def to_internal_value(self, data):
        """
        Debug data conversion before validation
        """
        print("\n" + "=" * 80)
        print(f"DEBUG - to_internal_value() called")
        print(f"DEBUG - Data received: {data}")
        print(f"DEBUG - Data type: {type(data)}")

        if hasattr(data, 'dict'):
            print(f"DEBUG - QueryDict keys: {data.keys()}")
            for key in data.keys():
                print(f"DEBUG - Key: {key}, Value: {data.get(key)}, Type: {type(data.get(key))}")

        try:
            converted = super().to_internal_value(data)
            print(f"DEBUG - Data after conversion: {converted}")
            return converted
        except Exception as e:
            print(f"DEBUG - Error in to_internal_value: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=" * 80)
            raise

    def get_author_data(self, obj):
        """Get basic author information"""
        print(f"DEBUG - get_author_data() for object ID {getattr(obj, 'id', 'None')}")
        if not obj.author:
            print("DEBUG - No author found")
            return None

        author_data = {
            "id": obj.author.id,
            "username": obj.author.username,
            "first_name": obj.author.first_name,
            "last_name": obj.author.last_name,
            "full_name": obj.author.full_name,
        }
        print(f"DEBUG - Author data: {author_data}")
        return author_data

    def get_society_data(self, obj):
        """Get basic society information"""
        print(f"DEBUG - get_society_data() for object ID {getattr(obj, 'id', 'None')}")
        try:
            request = self.context.get('request')
            icon_url = None
            if obj.society.icon:
                icon_url = request.build_absolute_uri(obj.society.icon.url) if request else obj.society.icon.url

            society_data = {
                "id": obj.society.id,
                "name": obj.society.name,
                "icon": icon_url,
            }
            print(f"DEBUG - Society data: {society_data}")
            return society_data
        except Exception as e:
            print(f"DEBUG - Error in get_society_data: {str(e)}")
            return {
                "id": getattr(obj.society, 'id', None),
                "name": getattr(obj.society, 'name', "Unknown"),
                "icon": None,
            }

    def get_comment_count(self, obj):
        """Get total comment count including replies"""
        try:
            count = NewsComment.objects.filter(news_post=obj).count()
            print(f"DEBUG - Comment count for post {getattr(obj, 'id', 'None')}: {count}")
            return count
        except Exception as e:
            print(f"DEBUG - Error in get_comment_count: {str(e)}")
            return 0

    def get_is_author(self, obj):
        """Check if the current user is the author of this post"""
        try:
            request = self.context.get("request", None)
            if request and request.user.is_authenticated and hasattr(request.user, 'student'):
                is_author = (obj.author and obj.author.id == request.user.student.id)
                print(f"DEBUG - is_author check for user {request.user.id}: {is_author}")
                return is_author
            return False
        except Exception as e:
            print(f"DEBUG - Error in get_is_author: {str(e)}")
            return False

    def get_image_url(self, obj):
        """Get full image URL"""
        try:
            request = self.context.get("request")
            if obj.image:
                url = request.build_absolute_uri(obj.image.url) if request else obj.image.url
                print(f"DEBUG - Image URL for post {getattr(obj, 'id', 'None')}: {url}")
                return url
            return None
        except Exception as e:
            print(f"DEBUG - Error in get_image_url: {str(e)}")
            return None

    def get_attachment_name(self, obj):
        """Get the attachment filename"""
        try:
            if obj.attachment:
                name = obj.attachment.name.split('/')[-1]
                print(f"DEBUG - Attachment name for post {getattr(obj, 'id', 'None')}: {name}")
                return name
            return None
        except Exception as e:
            print(f"DEBUG - Error in get_attachment_name: {str(e)}")
            return None

    def get_comments(self, obj):
        """Get top-level comments"""
        try:
            request = self.context.get("request", None)
            comments = NewsComment.objects.filter(news_post=obj, parent_comment=None).order_by("created_at")
            serializer = NewsCommentSerializer(comments, many=True, context={"request": request})
            print(f"DEBUG - Retrieved {comments.count()} top-level comments for post {getattr(obj, 'id', 'None')}")
            return serializer.data
        except Exception as e:
            print(f"DEBUG - Error in get_comments: {str(e)}")
            return []

    def get_admin_notes(self, obj):
        """
        Return the admin_notes from the latest Rejected NewsPublicationRequest, if status=Rejected
        """
        print(f"DEBUG - get_admin_notes() called for post ID={obj.id}, status='{obj.status}'")

        if obj.status != "Rejected":
            print("DEBUG - Post is not Rejected. Returning None for admin_notes.")
            return None

        try:
            # Get the most recently reviewed request with status="Rejected"
            rejected_req = NewsPublicationRequest.objects.filter(
                news_post=obj, status="Rejected"
            ).order_by('-reviewed_at').first()

            if rejected_req:
                print(f"DEBUG - Found Rejected request ID={rejected_req.id}, admin_notes='{rejected_req.admin_notes}'")
                return rejected_req.admin_notes
            else:
                print("DEBUG - No Rejected request found. Returning None.")
                return None
        except Exception as e:
            print(f"DEBUG - Error retrieving admin_notes: {str(e)}")
            return None

    def validate(self, data):
        """Validate the news post data"""
        print("\n" + "=" * 80)
        print("DEBUG - validate() called")
        print(f"DEBUG - Data to validate: {data}")

        # Check for required fields
        for field in ['title', 'content', 'status']:
            print(f"DEBUG - Checking field '{field}': {field in data}")

        if data.get('status') == 'Published' and not data.get('title'):
            print("DEBUG - Validation error: Published news must have a title")
            raise serializers.ValidationError({"title": "Published news must have a title."})

        status_value = data.get('status')
        print(f"DEBUG - Status value: {status_value}")
        if status_value and status_value not in ['Draft', 'PendingApproval', 'Rejected', 'Published', 'Archived']:
            print(f"DEBUG - Invalid status: {status_value}")
            raise serializers.ValidationError({
                "status": f"Invalid status: {status_value}. Must be one of: Draft, PendingApproval, Rejected, Published, Archived"
            })

        if 'tags' in data:
            tags = data.get('tags')
            print(f"DEBUG - Tags: {tags}, Type: {type(tags)}")
            if tags and not isinstance(tags, list):
                print("DEBUG - Tags is not a list, attempting conversion")
                try:
                    import json
                    if isinstance(tags, str):
                        data['tags'] = json.loads(tags)
                        print(f"DEBUG - Converted tags: {data['tags']}")
                except Exception as e:
                    print(f"DEBUG - Error converting tags: {str(e)}")
                    raise serializers.ValidationError({"tags": "Tags must be a list"})

        print("DEBUG - Validation successful")
        print("=" * 80)
        return data

    def is_valid(self, raise_exception=False):
        """Debug the validation process"""
        print("\n" + "=" * 80)
        print(f"DEBUG - is_valid() called with raise_exception={raise_exception}")

        result = super().is_valid(raise_exception=False)

        if not result:
            print(f"DEBUG - Validation errors: {self.errors}")

        print(f"DEBUG - is_valid result: {result}")
        print("=" * 80)

        if raise_exception and not result:
            raise serializers.ValidationError(self.errors)

        return result

    def create(self, validated_data):
        """
        Create a new news post
        """
        print("\n" + "=" * 80)
        print("DEBUG - create() called")
        print(f"DEBUG - Validated data: {validated_data}")

        request = self.context.get("request")

        if request:
            print(f"DEBUG - Request user: {request.user}, authenticated: {request.user.is_authenticated}")
            if hasattr(request.user, 'student'):
                print(f"DEBUG - Request user has student profile: {request.user.student}")
            else:
                print("DEBUG - Request user does not have student profile")

        if not validated_data.get('author') and request and hasattr(request.user, 'student'):
            validated_data['author'] = request.user.student
            print(f"DEBUG - Setting author to current user's student profile: {request.user.student}")

        if 'tags' in validated_data:
            print(f"DEBUG - Tags before final processing: {validated_data['tags']}, Type: {type(validated_data['tags'])}")

        try:
            instance = super().create(validated_data)
            print(f"DEBUG - Created news post successfully: ID={instance.id}, Title={instance.title}")
            print("=" * 80)
            return instance
        except Exception as e:
            print(f"DEBUG - Error creating news post: {str(e)}")
            import traceback
            traceback.print_exc()
            print("=" * 80)
            raise

    def get_published_at(self, obj):
        """
        Return a formatted timestamp of when the news was published.
        Format: YYYY-MM-DD HH:MM:SS
        """
        if obj.published_at:
            formatted_time = django_format(localtime(obj.published_at), "Y-m-d H:i:s")
            print(f"DEBUG - Formatted published_at: {formatted_time}")
            return formatted_time
        return None

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