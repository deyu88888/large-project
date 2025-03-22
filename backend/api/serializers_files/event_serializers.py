import datetime
from api.models import Event, Comment
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


class EventSerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Event model """
    current_attendees = StudentSerializer(many=True, read_only=True)

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
        current_attendees_data = validated_data.pop('current_attendees', None)
        for key, value in validated_data.items():
            setattr(instance, key, value)
        if current_attendees_data is not None:
            instance.current_attendees.set(current_attendees_data)
        instance.save()
        return instance


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
