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

