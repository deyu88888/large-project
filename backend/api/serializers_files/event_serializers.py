import datetime
from api.models import Event, Comment, EventModule
from api.serializers import StudentSerializer
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _

class EventModuleSerializer(serializers.ModelSerializer):
    """
    serializer for the EventModule model.
    """
    class Meta:
        model = EventModule
        fields = ['id', 'type', 'text_value', 'file_value', 'is_participant_only']

class EventSerializer(serializers.ModelSerializer):
    """
    serializer for the EventModule model.
    """
    current_attendees = StudentSerializer(many=True, read_only=True)
    extra_modules = serializers.SerializerMethodField()
    participant_modules = serializers.SerializerMethodField()
    is_member = serializers.SerializerMethodField()
    cover_image = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id', 'title', 'main_description', 'cover_image', 'date',
            'start_time', 'duration', 'hosted_by', 'location',
            'max_capacity', 'current_attendees', 'status',
            'extra_modules', 'participant_modules', 'is_member'
        ]
        extra_kwargs = {'hosted_by': {'required': True}}

    def get_cover_image(self, obj):
        if obj.cover_image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.cover_image.url) if request else obj.cover_image.url
        return None

    def get_extra_modules(self, obj):
        modules = obj.modules.filter(is_participant_only=False)
        return EventModuleSerializer(modules, many=True).data

    def get_participant_modules(self, obj):
        modules = obj.modules.filter(is_participant_only=True)
        return EventModuleSerializer(modules, many=True).data

    def get_is_member(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated:
            return False
        student = getattr(request.user, "student", None)
        if not student:
            return False
        return obj.hosted_by.society_members.filter(id=student.id).exists()


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
        """Metadata for CommentSerializer"""
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
        """Gets a users id, username, and icon"""
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
        """Gets the number of likes on a comment"""
        return obj.total_likes()

    def get_dislikes(self, obj):
        """Gets the number of dislikes on a comment"""
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


class RSVPEventSerializer(serializers.ModelSerializer):
    """
    Serializer used to RSVP an event
    """
    class Meta:
        """Metdata for RSVPEventSerializer"""
        model = Event
        fields = ['id', 'title', 'date', 'start_time', 'duration', 'location']

    def validate(self, attrs):
        request = self.context.get('request')
        event = self.instance
        student = request.user.student

        if self.context.get('action') == 'RSVP':
            if not event.hosted_by.society_members.filter(id=student.id).exists():
                raise serializers.ValidationError("You must be a member of the hosting society to RSVP for this event.")

            if student in event.current_attendees.all():
                raise serializers.ValidationError("You have already RSVP'd for this event.")

            if event.has_started():
                raise serializers.ValidationError("You cannot RSVP for an event that has already started.")

            if event.is_full():
                raise serializers.ValidationError("This event is full and cannot accept more RSVPs.")

        elif self.context.get('action') == 'CANCEL':
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
            student.attended_events.add(event)
        elif self.context.get('action') == 'CANCEL':
            event.current_attendees.remove(student)
            student.attended_events.remove(event)

        event.save()
        return event


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
