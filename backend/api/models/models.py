from django.contrib.postgres.fields import JSONField
from datetime import timedelta
from random import randint
from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.dispatch import receiver
from django.utils import timezone
from django.db.models.signals import pre_save
from django.utils.translation import gettext_lazy as _
from django.db.models import F
from django.db.models.signals import post_save
from django.dispatch import receiver




def get_date():
    """Returns today's date"""
    return timezone.now().date()


def get_time():
    """Returns the current time"""
    return timezone.now().time()


class Notification(models.Model):
    """
    Notifications for a student about an event, etc.
    """
    header = models.CharField(max_length=30, default="")
    body = models.CharField(max_length=200, default="")
    for_user = models.ForeignKey(
        "User",
        on_delete=models.CASCADE,
        related_name="notifications",
        blank=False,
        null=True,
    )

    send_time = models.DateTimeField(default=timezone.now)
    is_read = models.BooleanField(default=False)
    is_important = models.BooleanField(default=False)

    def is_sent(self):
        """Notification should be sent if it's send_time is passed"""
        return self.send_time <= timezone.now()

    def __str__(self):
        return f"{self.header}\n{self.body}"


class Request(models.Model):
    """
    Blueprint for Requests made by students requiring admin approval
    """

    INTENT = [
        ("CreateSoc", "Create Society"),
        ("UpdateSoc", "Update Society"),
        ("CreateEve", "Create Event"),
        ("UpdateEve", "Update Event"),
        ("CreateUse", "Create User"),
        ("UpdateUse", "Update User"),
        ("JoinSoc", "Join Society")
    ]

    intent = models.CharField(max_length=10, choices=INTENT)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(null=True, blank=True, default=None)

    # Use "%(class)s" in related_name for uniqueness in inherited models
    from_student = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        related_name="%(class)ss",
        blank=False,
        null=False,
    )

    class Meta:
        abstract = True


class SocietyRequest(Request):
    """
    Requests related to societies
    """
    society = models.ForeignKey(
        "Society",
        on_delete=models.CASCADE,
        related_name="society_request",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=30, blank=True, default="")
    description = models.CharField(max_length=500, blank=True, default="")
    roles = models.JSONField(default=dict, blank=True)
    president = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        related_name="society_request_president",
        blank=True,
        null=True,
    )
    category = models.CharField(max_length=50, blank=True, default="")
    social_media_links = models.JSONField(default=dict, blank=True, null=True)
    membership_requirements = models.TextField(blank=True, default="")
    upcoming_projects_or_plans = models.TextField(blank=True, default="")
    icon = models.ImageField(upload_to="icon_request/", blank=True, null=True)


class DescriptionRequest(models.Model):
    """
    Society description change requests
    """

    STATUS_CHOICES = [
        ("Pending", "Pending Approval"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    society = models.ForeignKey(Society, on_delete=models.CASCADE, related_name="description_requests")
    requested_by = models.ForeignKey("Student", on_delete=models.CASCADE, related_name="description_requests")
    new_description = models.TextField(blank=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey("User", on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Description update request for {self.society.name} - {self.status}"


class SocietyShowreelRequest(models.Model):
    """
    Requests related to societies showreel photos
    """
    society = models.ForeignKey(
        "SocietyRequest",
        on_delete=models.CASCADE,
        related_name="showreel_images_request",
        blank=False,
        null=False,
    )
    photo = models.ImageField(
        upload_to="society_showreel_request/",
        blank=False,
        null=False
    )
    caption = models.CharField(max_length=50, default="", blank=True)


class UserRequest(Request):
    """
    Requests related to users
    """
    # username at some point
    major = models.CharField(max_length=50, blank=True, default="")
    icon = models.ImageField(upload_to="icon_request/", blank=True, null=True)


class EventRequest(Request):
    """
    Requests related to events
    """
    event = models.ForeignKey(
        "Event",
        on_delete=models.DO_NOTHING,
        related_name="event_request",
        blank=True,
        null=True,
    )
    hosted_by = models.ForeignKey(
        "Society",
        on_delete=models.CASCADE,
        related_name="event_request_society",
        blank=False,
        null=False,
    )
    title = models.CharField(max_length=20, blank=True, default="")
    description = models.CharField(max_length=300, blank=True, default="")
    location = models.CharField(max_length=300, blank=True, default="")
    date = models.DateField(blank=True, null=True)
    start_time = models.TimeField(blank=True, null=True)
    duration = models.DurationField(blank=True, null=True)


class AdminReportRequest(Request):
    """
    Reports submitted to the admin by students or society presidents.
    """

    REPORT_TYPES = [
        ("Misconduct", "Misconduct"),
        ("System Issue", "System Issue"),
        ("Society Issue", "Society Issue"),
        ("Event Issue", "Event Issue"),
        ("Other", "Other"),
    ]

    report_type = models.CharField(max_length=20, choices=REPORT_TYPES)
    subject = models.CharField(max_length=100, blank=False)
    details = models.TextField(blank=False)
    requested_at = models.DateTimeField(auto_now_add=True)
    is_from_society_officer = models.BooleanField(default=False) # President or vice-president

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.subject} (From {self.from_student.username})"


class ReportReply(models.Model):
    """
    Replies to AdminReportRequest or other replies.
    Used by both admins and presidents.
    """
    report = models.ForeignKey(AdminReportRequest, on_delete=models.CASCADE, related_name='replies')
    parent_reply = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='child_replies')
    content = models.TextField(blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    replied_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='report_replies')
    is_admin_reply = models.BooleanField(default=False)  # To distinguish between admin and president replies
    read_by_students = models.ManyToManyField(User, related_name='read_report_replies', blank=True)
    hidden_for_students = models.ManyToManyField(User, related_name='hidden_replies', blank=True)
    
    def __str__(self):
        reply_type = "Admin" if self.is_admin_reply else "President"
        return f"{reply_type} Reply to {self.report.subject} ({self.created_at.strftime('%Y-%m-%d')})"


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

    class Meta:
        verbose_name = _("Site Settings")
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


class NewsNotification(models.Model):
    """
    Model for broadcasting news/notifications.
    """
    TARGET_CHOICES = [
        ("society", "Specific Society"),
        ("multiple_societies", "Multiple Societies"),
        ("event", "Specific Event"),
        ("everyone", "Everyone"),
        ("student_dashboard", "Student Dashboard"),
    ]

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_notifications")
    title = models.CharField(max_length=100)
    content = models.TextField()
    target_type = models.CharField(max_length=50, choices=TARGET_CHOICES)
    target_society = models.ForeignKey("Society", on_delete=models.CASCADE, null=True, blank=True, related_name="news_notifications")
    target_event = models.ForeignKey("Event", on_delete=models.CASCADE, null=True, blank=True, related_name="event_notifications")
    target_multiple_societies = models.ManyToManyField("Society", blank=True, related_name="multi_society_news")
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.title} - {self.target_type}"


class BroadcastMessage(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name="sent_broadcasts")
    societies = models.ManyToManyField("Society", related_name="broadcasts", blank=True)
    events = models.ManyToManyField("Event", related_name="broadcasts", blank=True)
    recipients = models.ManyToManyField(User, related_name="received_broadcasts", blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # ADDED: A convenient string representation
        return f"Broadcast from {self.sender.username} at {self.created_at:%Y-%m-%d %H:%M}"


class SocietyNews(models.Model):
    """
    News posts for societies.
    """

    STATUS_CHOICES = [
        ("Draft", "Draft"),
        ("PendingApproval", "Pending Approval"),
        ("Rejected", "Rejected"),
        ("Published", "Published"),
        ("Archived", "Archived"),
    ]

    society = models.ForeignKey(
        "Society",
        on_delete=models.CASCADE,
        related_name="news_posts",
        blank=False,
        null=False,
    )

    title = models.CharField(max_length=100, blank=False)
    content = models.TextField(blank=False)

    # Rich media content (optional)
    image = models.ImageField(upload_to="society_news/images/", blank=True, null=True)
    attachment = models.FileField(upload_to="society_news/attachments/", blank=True, null=True)

    # Metadata
    author = models.ForeignKey(
        "Student",
        on_delete=models.SET_NULL,
        related_name="authored_news",
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published_at = models.DateTimeField(blank=True, null=True)

    # Status and categorization
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Draft")
    is_featured = models.BooleanField(default=False)
    is_pinned = models.BooleanField(default=False)
    tags = models.JSONField(default=list, blank=True)

    # Fields for tracking engagement
    view_count = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = "Society News"
        verbose_name_plural = "Society News"
        ordering = ["-is_pinned", "-created_at"]

    def __str__(self):
        return f"{self.society.name}: {self.title}"

    def save(self, *args, **kwargs):
        # If status changed to Published, set published_at date
        if self.pk:
            try:
                old_status = SocietyNews.objects.get(pk=self.pk).status
                if old_status != "Published" and self.status == "Published":
                    self.published_at = timezone.now()
            except SocietyNews.DoesNotExist:
                pass
        elif self.status == "Published" and not self.published_at:
            self.published_at = timezone.now()

        super().save(*args, **kwargs)

    def increment_view_count(self, amount: int = 1):
        """
        Increments the view_count field by the specified amount (default=1).
        This uses F expressions for an atomic database update.
        """
        SocietyNews.objects.filter(pk=self.pk).update(view_count=F('view_count') + amount)
        self.refresh_from_db(fields=['view_count'])

class NewsComment(models.Model):
    """
    Comments on society news posts.
    """
    news_post = models.ForeignKey(
        SocietyNews,
        on_delete=models.CASCADE,
        related_name="comments"
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="news_comments"
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    parent_comment = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies"
    )
    
    # Reaction tracking
    likes = models.ManyToManyField(
        User,
        related_name="liked_news_comments",
        blank=True
    )
    dislikes = models.ManyToManyField(
        User,
        related_name="disliked_news_comments",
        blank=True
    )
    
    class Meta:
        ordering = ["created_at"]
    
    def __str__(self):
        return f"Comment by {self.user.username} on {self.news_post.title}"
    
    def total_replies(self) -> int:
        return self.replies.count()
    
    @property
    def total_likes(self) -> int:
        return self.likes.count()
    
    @property
    def total_dislikes(self) -> int:
        return self.dislikes.count()
    
    def liked_by(self, user):
        return self.likes.filter(id=user.id).exists()
    
    def disliked_by(self, user):
        return self.dislikes.filter(id=user.id).exists()
    
class NewsPublicationRequest(models.Model):
    """
    Tracks requests from society presidents to publish news posts.
    """
    STATUS_CHOICES = [
        ("Pending", "Pending"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]
    
    news_post = models.ForeignKey(
        SocietyNews,
        on_delete=models.CASCADE,
        related_name="publication_requests"
    )
    
    requested_by = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        related_name="news_publication_requests"
    )
    
    reviewed_by = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="reviewed_news_publications"
    )
    
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    requested_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)
    admin_notes = models.TextField(blank=True, null=True, help_text="Feedback or notes from the admin, especially for rejections")
    
    class Meta:
        ordering = ["-requested_at"]
        verbose_name = "News Publication Request"
        verbose_name_plural = "News Publication Requests"
    
    def __str__(self):
        return f"Publication request for '{self.news_post.title}' - {self.status}"
    
    def save(self, *args, **kwargs):
        # If status is being changed to Approved or Rejected, set the reviewed_at timestamp
        if self.pk:
            orig = NewsPublicationRequest.objects.get(pk=self.pk)
            if orig.status == "Pending" and self.status in ["Approved", "Rejected"]:
                self.reviewed_at = timezone.now()
                
                # Update the news post status based on the decision
                if self.status == "Approved":
                    self.news_post.status = "Published"
                    self.news_post.published_at = timezone.now()
                    self.news_post.save()
                elif self.status == "Rejected":
                    self.news_post.status = "Rejected"
                    self.news_post.save()
        
        super().save(*args, **kwargs)

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