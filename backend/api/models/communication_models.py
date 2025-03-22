from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _
from django.db.models import F
import user_models
import request_models


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


class ReportReply(models.Model):
    """
    Replies to AdminReportRequest or other replies.
    Used by both admins and presidents.
    """
    report = models.ForeignKey(request_models.AdminReportRequest, on_delete=models.CASCADE, related_name='replies')
    parent_reply = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='child_replies')
    content = models.TextField(blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    replied_by = models.ForeignKey(user_models.User, on_delete=models.CASCADE, related_name='report_replies')
    is_admin_reply = models.BooleanField(default=False)  # To distinguish between admin and president replies
    read_by_students = models.ManyToManyField(user_models.User, related_name='read_report_replies', blank=True)
    hidden_for_students = models.ManyToManyField(user_models.User, related_name='hidden_replies', blank=True)
    
    def __str__(self):
        reply_type = "Admin" if self.is_admin_reply else "President"
        return f"{reply_type} Reply to {self.report.subject} ({self.created_at.strftime('%Y-%m-%d')})"

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

    sender = models.ForeignKey(user_models.User, on_delete=models.CASCADE, related_name="sent_notifications")
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
    """
    Model representing a broadcast message from a sender to multiple recipients, 
    societies, and events.
    """
    sender = models.ForeignKey(user_models.User, on_delete=models.CASCADE, related_name="sent_broadcasts")
    societies = models.ManyToManyField("Society", related_name="broadcasts", blank=True)
    events = models.ManyToManyField("Event", related_name="broadcasts", blank=True)
    recipients = models.ManyToManyField(user_models.User, related_name="received_broadcasts", blank=True)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
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

    image = models.ImageField(upload_to="society_news/images/", blank=True, null=True)
    attachment = models.FileField(upload_to="society_news/attachments/", blank=True, null=True)

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
        user_models.User,
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
        user_models.User,
        related_name="liked_news_comments",
        blank=True
    )
    dislikes = models.ManyToManyField(
        user_models.User,
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