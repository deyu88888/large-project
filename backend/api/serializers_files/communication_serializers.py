import traceback
from json import loads
from api.models import BroadcastMessage, Notification, ReportReply, NewsComment,\
    NewsPublicationRequest, SocietyNews, AdminReportRequest
from api.serializers_files.serializers_utility import get_report_reply_chain
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.utils.dateformat import format as django_format
from django.utils.timezone import localtime


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
        """Meta class for SocietyNewsSerializer"""
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
        except NewsComment.DoesNotExist as e:
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
                    if isinstance(tags, str):
                        data['tags'] = loads(tags)
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


class NewsCommentSerializer(serializers.ModelSerializer):
    """Serializer for news comments"""
    replies = serializers.SerializerMethodField()
    user_data = serializers.SerializerMethodField()
    likes_count = serializers.SerializerMethodField()
    liked_by_user = serializers.SerializerMethodField()
    dislikes_count = serializers.SerializerMethodField()
    disliked_by_user = serializers.SerializerMethodField()

    class Meta:
        """Meta class for NewsCommentSerializer"""
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
        """Get the replies to a news comment"""
        request = self.context.get("request")
        serializer = NewsCommentSerializer(
            obj.replies.all().order_by("created_at"),
            many=True,
            context={"request": request},
        )
        return serializer.data

    def get_user_data(self, obj):
        """Get the data of a user who posted a comment"""
        if not obj.user:
            return None
        return {
            "id": obj.user.id,
            "username": obj.user.username,
            "first_name": obj.user.first_name,
            "last_name": obj.user.last_name,
        }

    def get_likes_count(self, obj):
        """Get the number of likes for a comment"""
        return obj.likes.count()

    def get_liked_by_user(self, obj):
        """Get the comments a user has liked"""
        request = self.context.get("request")
        if request and request.user and request.user.is_authenticated:
            return obj.likes.filter(id=request.user.id).exists()
        return False

    def get_dislikes_count(self, obj):
        """Get the number of dislikes for a comment"""
        try:
            return obj.dislikes.count()
        except Exception as _:
            # Fallback to 0 if the dislikes table is not available
            return 0

    def get_disliked_by_user(self, obj):
        """Get the comments disliked by a user"""
        request = self.context.get("request")
        try:
            if request and request.user and request.user.is_authenticated:
                return obj.dislikes.filter(id=request.user.id).exists()
            return False
        except Exception as _:
            return False


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

class BroadcastSerializer(serializers.ModelSerializer):
    """Serializer for the BroadcastMessage model"""
    class Meta:
        """Metadata for BroadcastSerializer"""
        model = BroadcastMessage
        fields = ['id', 'sender', 'societies', 'events', 'recipients', 'message', 'created_at']
        read_only_fields = ['id', 'created_at', 'sender']


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
        """Get reply chain the ReportReply"""
        children = get_report_reply_chain(obj)
        return ReportReplySerializer(children, many=True).data

class PublicReportSerializer(serializers.ModelSerializer):
    """
    Serializer for the PublicReport model
    """
    class Meta:
        model = AdminReportRequest
        fields = ['subject', 'details', 'email']
        
    def save(self, **kwargs):
        return super().save(**kwargs)