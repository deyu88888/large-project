from json import loads
from api.models import BroadcastMessage, Notification, ReportReply, NewsComment, \
    NewsPublicationRequest, SocietyNews, AdminReportRequest
from api.serializers_files.serializers_utility import get_report_reply_chain
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _
from django.utils.dateformat import format as django_format
from django.utils.timezone import localtime
import json



class SocietyNewsSerializer(serializers.ModelSerializer):
    """Serializer for the SocietyNews model with related data and calculated fields."""
    author_data = serializers.SerializerMethodField()
    society_data = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    is_author = serializers.SerializerMethodField()
    image_url = serializers.SerializerMethodField()
    attachment_name = serializers.SerializerMethodField()
    attachment_url = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField(read_only=True)
    admin_notes = serializers.SerializerMethodField()

    class Meta:
        """Meta class for SocietyNewsSerializer"""
        model = SocietyNews
        fields = [
            'id', 'society', 'title', 'content', 'image', 'image_url',
            'attachment', 'attachment_name', 'attachment_url', 'author', 'author_data',
            'society_data', 'created_at', 'updated_at', 'published_at',
            'status', 'is_featured', 'is_pinned', 'tags', 'view_count',
            'comment_count', 'is_author', 'comments', 'admin_notes',
        ]
        read_only_fields = ['created_at',
                            'updated_at', 'published_at', 'view_count']
        extra_kwargs = {
            'image': {'write_only': True},
            'attachment': {'write_only': True},
            'author': {'write_only': True},
            'society': {'write_only': True},
        }

    def get_author_data(self, obj):
        """Get basic author information"""
        if not obj.author:
            return None

        return {
            "id": obj.author.id,
            "username": obj.author.username,
            "first_name": obj.author.first_name,
            "last_name": obj.author.last_name,
            "full_name": obj.author.full_name,
        }

    def get_society_data(self, obj):
        """Get basic society information"""
        try:
            request = self.context.get('request')
            icon_url = None
            if obj.society.icon:
                icon_url = request.build_absolute_uri(
                    obj.society.icon.url) if request else obj.society.icon.url

            return {
                "id": obj.society.id,
                "name": obj.society.name,
                "icon": icon_url,
            }
        except Exception:
            return {
                "id": getattr(obj.society, 'id', None),
                "name": getattr(obj.society, 'name', "Unknown"),
                "icon": None,
            }

    def get_comment_count(self, obj):
        """Get total comment count including replies."""
        count = NewsComment.objects.filter(news_post=obj).count()
        return count

    def get_is_author(self, obj):
        """Check if the current user is the author of this post."""
        try:
            request = self.context.get("request", None)
            if request and request.user.is_authenticated and hasattr(request.user, 'student'):
                is_author = (obj.author and obj.author.id ==
                             request.user.student.id)
                return is_author
            return False
        except Exception:
            return False

    def get_image_url(self, obj):
        """Get full image URL."""
        try:
            request = self.context.get("request")
            if obj.image:
                url = request.build_absolute_uri(
                    obj.image.url) if request else obj.image.url
                return url
            return None
        except Exception:
            return None

    def get_attachment_name(self, obj):
        """Get the attachment filename."""
        try:
            if obj.attachment:
                name = obj.attachment.name.split('/')[-1]
                return name
            return None
        except Exception:
            return None

    def get_attachment_url(self, obj):
        """Get full attachment URL."""
        try:
            request = self.context.get("request")
            if obj.attachment:
                url = request.build_absolute_uri(
                    obj.attachment.url) if request else obj.attachment.url
                return url
            return None
        except Exception as e:
            return None

    def get_comments(self, obj):
        """Get top-level comments."""
        try:
            request = self.context.get("request", None)
            comments = NewsComment.objects.filter(
                news_post=obj, parent_comment=None).order_by("created_at")
            serializer = NewsCommentSerializer(
                comments, many=True, context={"request": request})
            return serializer.data
        except Exception:
            return []

    def get_admin_notes(self, obj):
        """
        Return the admin_notes from the latest Rejected NewsPublicationRequest, if status=Rejected
        """
        if obj.status != "Rejected":
            return None

        try:

            rejected_req = NewsPublicationRequest.objects.filter(
                news_post=obj, status="Rejected"
            ).order_by('-reviewed_at').first()

            if rejected_req:
                return rejected_req.admin_notes
            else:
                return None
        except Exception:
            return None

    def validate(self, data):
        """Validate the news post data"""
        if data.get('status') == 'Published' and not data.get('title'):
            raise serializers.ValidationError(
                {"title": "Published news must have a title."})

        status_value = data.get('status')
        if status_value and status_value not in ['Draft', 'PendingApproval', 'Rejected', 'Published', 'Archived']:
            raise serializers.ValidationError({
                "status": f"Invalid status: {status_value}. Must be one of: Draft, PendingApproval, Rejected, Published, Archived"
            })

        if 'tags' in data:
            tags = data.get('tags')
            if tags and not isinstance(tags, list):
                try:

                    if isinstance(tags, str):
                        try:

                            parsed_tags = json.loads(tags)

                            if isinstance(parsed_tags, list):
                                data['tags'] = parsed_tags
                            else:

                                data['tags'] = [str(parsed_tags)]
                        except json.JSONDecodeError:

                            if tags.strip():

                                data['tags'] = [tags.strip()]
                            else:

                                data['tags'] = []
                    else:

                        data['tags'] = [str(tags)]
                except Exception:

                    data['tags'] = []

        return data

    def create(self, validated_data):
        """
        Create a new news post
        """
        request = self.context.get("request")

        if not validated_data.get('author') and request and hasattr(request.user, 'student'):
            validated_data['author'] = request.user.student

        try:
            instance = super().create(validated_data)
            return instance
        except Exception:
            raise

    def get_published_at(self, obj):
        """Return a formatted timestamp of when the news was published (YYYY-MM-DD HH:MM:SS)."""
        if obj.published_at:
            formatted_time = django_format(
                localtime(obj.published_at), "Y-m-d H:i:s")
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
        except Exception:

            return 0

    def get_disliked_by_user(self, obj):
        """Get the comments disliked by a user"""
        request = self.context.get("request")
        try:
            if request and request.user and request.user.is_authenticated:
                return obj.dislikes.filter(id=request.user.id).exists()
            return False
        except Exception:
            return False


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for objects of the Notification model"""

    class Meta:
        """ NotificationSerializer meta data """
        model = Notification
        fields = ["id", "header", "body",
                  "for_user", "is_read", "is_important"]
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
        fields = ['id', 'sender', 'societies', 'events',
                  'recipients', 'message', 'created_at']
        read_only_fields = ['id', 'created_at', 'sender']


class NewsMarkAsReadSerializer(serializers.Serializer):
    """Serializer for marking news as read"""
    news_id = serializers.IntegerField()

    def validate(self, data):
        """Validate the news_id"""
        if not data.get('news_id'):
            raise serializers.ValidationError(
                {"news_id": _("News ID is required.")})

        return data


class ReportReplySerializer(serializers.ModelSerializer):
    """
    Serializer for the ReportReply model
    """
    replied_by_username = serializers.CharField(
        source='replied_by.username', read_only=True)
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
