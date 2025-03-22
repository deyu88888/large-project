from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from api.models_files.user_models import Student, User
from api.models_files.award_models import Award, AwardStudent
from api.models_files.communication_models import Notification, ReportReply, NewsNotification, BroadcastMessage, SocietyNews, NewsComment
from api.models_files.event_models import Event, Comment
from api.models_files.society_models import Society, SocietyShowreel
from api.models_files.request_models import Request, SocietyRequest, DescriptionRequest, SocietyShowreelRequest, UserRequest, \
    EventRequest, AdminReportRequest, NewsPublicationRequest
from api.models_files.recommendation_feedback_model import RecommendationFeedback


class SiteSettings(models.Model):
    """
    Stores site-wide settings, including the introduction text.
    We use a singleton pattern (only one instance allowed).
    """
    singleton_instance_id = 1  # We'll enforce this as the only valid ID.

    introduction_title = models.CharField(
        max_length=255,
        default=_("Welcome to the Universal Student Society Platform!"),  # Use translation
        verbose_name=_("Introduction Title"),
        help_text=_("The title of the website introduction section."),
    )
    introduction_content = models.TextField(
        default=_(
            "This platform is designed to help student societies manage their members, share news, "
            "organize events, and much more. Whether you're a small club or a large society, "
            "we provide the tools you need to connect with your members and thrive.\n\n"
            "Key features include: membership management, event calendars, news feeds, notifications, "
            "and customizable society pages. Get started by registering your society or logging in!"
        ),
        verbose_name=_("Introduction Content"),
        help_text=_("The main content of the website introduction. Use newlines to separate paragraphs."),
    )

    verbose_name_plural = _("Site Settings")

    def __str__(self):
        return "Site Settings"

    def save(self, *args, **kwargs):
        """
        Enforce the singleton pattern. Only allow saving if the ID is the
        singleton_instance_id.
        """
        if self.pk != self.singleton_instance_id:
            self.pk = self.singleton_instance_id
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """
        Load the singleton instance.  Create it if it doesn't exist.
        This is a more robust way to get the settings.
        """
        obj, created = cls.objects.get_or_create(pk=cls.singleton_instance_id)
        return obj

class ActivityLog(models.Model):
    ACTION_CHOICES = [
        ("Delete", "Delete"),
        ("Approve", "Approve"),
        ("Reject", "Reject"),
        ("Update", "Update"),
        ("Create", "Create"),
        ("Reply", "Reply"),
    ]

    TARGET_CHOICES = [
        ("Society", "Society"),
        ("Student", "Student"),
        ("Event", "Event"),
        ("Request", "Request"),
    ]

    action_type = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_type = models.CharField(max_length=20, choices=TARGET_CHOICES)
    target_id = models.IntegerField()
    target_name = models.CharField(max_length=255)
    target_email = models.CharField(max_length=255, null=True, blank=True)
    reason = models.TextField(null=True, blank=True)
    performed_by = models.ForeignKey(User, on_delete=models.CASCADE)
    timestamp = models.DateTimeField(auto_now_add=True)
    expiration_date = models.DateTimeField(null=True, blank=True)
    original_data = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.action_type} - {self.target_name} on {self.timestamp}"

    @classmethod
    def delete_expired_logs(cls):
        """Delete activity logs older than 30 days."""
        expiration_threshold = timezone.now() - timedelta(days=30)
        expired_logs = cls.objects.filter(expiration_date__lt=expiration_threshold)
        deleted_count, _ = expired_logs.delete()
        return deleted_count

class Activity(models.Model):
    """
    Represents a recent activity performed by a user.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="activities"
    )
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.user.username}: {self.description[:30]}..."