import datetime
from api.models import AdminReportRequest, Award, AwardStudent, SiteSettings, User, Student, Admin, Society, Event, \
    Notification, Request, SocietyRequest, SocietyShowreel, SocietyShowreelRequest, EventRequest, UserRequest, Comment, DescriptionRequest
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

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

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name',
            'last_name', 'email', 'is_active', 'role'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8},
            'username': {'validators': []},
            'email': {'validators': []},
        }

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
    major = serializers.CharField(required=True)
    is_president = serializers.BooleanField(read_only=True)
    #awards = AwardStudentSerializer(source='award_students', many=True, read_only=True) this will work when files are seperated

    class Meta(UserSerializer.Meta):
        model = Student
        fields = UserSerializer.Meta.fields + ['major', 'societies', 'president_of', 'is_president', 'award_students']
        read_only_fields = ["is_president", "award_students"]

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



class AdminSerializer(UserSerializer):
    """
    Serializer for the Admin model.
    """

    class Meta(UserSerializer.Meta):
        model = Admin
        fields = UserSerializer.Meta.fields

    def validate_email(self, value):
        """
        Check if the email is unique.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_username(self, value):
        """
        Check if the username is unique.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data['role'] = 'admin'
        admin = Admin.objects.create(**validated_data)
        admin.set_password(password)
        admin.is_superuser = True
        admin.is_staff = True
        admin.save()
        return admin


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
    leader = StudentSerializer(read_only=True)
    leader_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, source='leader'
    )
    vice_president = StudentSerializer(required=False)
    event_manager = StudentSerializer(required=False)
    treasurer = StudentSerializer(required=False)
    tags = serializers.ListField(child=serializers.CharField(), required=False)

    class Meta:
        """SocietySerializer meta data"""
        model = Society
        fields = [
            'id', 'name', 'description', 'society_members', 'roles', 'leader', 'approved_by',
            'status', 'category', 'social_media_links', 'timetable', 'showreel_images',
            'membership_requirements', 'upcoming_projects_or_plans', 'icon','tags'
        ]
        extra_kwargs = {
            'society_members': {'required': False},  # Allows empty or missing data
            'roles': {'required': False},
            'social_media_links': {'required': False},
            'timetable': {'required': False},
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


class EventSerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Event model """

    class Meta:
        """ EventSerializer meta data """
        model = Event
        fields = [
            'id', 'title', 'description', 'date',
            'start_time', 'duration', 'hosted_by', 'location',
            'max_capacity', 'current_attendees', 'status'
        ]
        extra_kwargs = {'hosted_by': {'required': True}}

    def create(self, validated_data):
        """ Creates a new entry in the Event table according to json data """
        return Event.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """ Update 'instance' object according to provided json data """
        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.save()
        return instance


class NotificationSerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Notification model """

    class Meta:
        """ NotificationSerializer meta data """
        model = Notification
        fields = ['id', 'for_event', 'for_student', 'is_read', 'message']
        extra_kwargs = {
            'for_event': {'required': True},
            'for_student': {'required': True}
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

        return value

    def save(self):
        society_id = self.validated_data['society_id']
        request_user = self.context['request'].user
        society = Society.objects.get(id=society_id)
        request_user.student.societies_belongs_to.add(society)
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

            # Ensure the student has not already RSVP’d
            if student in event.current_attendees.all():
                raise serializers.ValidationError("You have already RSVP'd for this event.")

            # Ensure the event is not in the past or has started
            if event.has_started():
                raise serializers.ValidationError("You cannot RSVP for an event that has already started.")

            # Ensure the event is not full
            if event.is_full():
                raise serializers.ValidationError("This event is full and cannot accept more RSVPs.")

        elif self.context.get('action') == 'CANCEL':
            # Ensure the student is currently RSVP’d for the event
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
            leader=validated_data["requested_by"],
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
            + ['name', 'description', 'roles', 'leader', 'category', 'icon',
            'social_media_links', 'timetable', 'membership_requirements',
            'upcoming_projects_or_plans', 'society', 'showreel_images_request']
        )

    def create(self, validated_data):
        photos_data = validated_data.pop('showreel_images_request', [])

        society = SocietyRequest.objects.create(**validated_data)

        for photo_data in photos_data:
            SocietyShowreelRequest.objects.create(society=society, **photo_data)

        return society

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

        # Remove keys that are supplied via extra kwargs so they aren’t duplicated.
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


class DashboardStatisticSerializer(serializers.Serializer):
    """
    Serializer for dashboard statistics.
    """
    total_societies = serializers.IntegerField()
    total_events = serializers.IntegerField()
    pending_approvals = serializers.IntegerField()
    active_members = serializers.IntegerField()


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
    event_title = serializers.CharField(source="for_event.title", read_only=True)
    student_name = serializers.CharField(source="for_student.full_name", read_only=True)

    class Meta:
        """Dashboard notification meta data"""
        model = Notification
        fields = [
            'id',
            'message',
            'is_read',
            'event_title',
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
    class Meta:
        """AdminReportRequest meta data"""
        model = AdminReportRequest
        fields = ["id", "report_type", "subject", "details", "requested_at", "from_student"]
        extra_kwargs = {"from_student": {"read_only": True}}  # Auto-assign the user

class CommentSerializer(serializers.ModelSerializer):
    """
    Serializer for the Comment model
    """
    user_data = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = ["id", "content", "create_at", "user_data", "parent_comment", "replies", "event"]
        read_only_fields = ["id", "create_at", "user_data", "event", "replies"]
        extra_kwargs = {
            "parent_comment": {"required": False, "allow_null": True},
        }

    def get_user_data(self, obj):
        if obj.user:
            return {
                "id": obj.user.id,
                "username": obj.user.username
            }
        return None

    def get_replies(self, obj):
        """get the children comments (if have)"""
        replies = obj.replies.all().order_by("create_at")
        return CommentSerializer(replies, many=True).data

class DescriptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = DescriptionRequest
        fields = ['id', 'society', 'new_description', 'status', 'reviewed_by', 'created_at', 'updated_at']