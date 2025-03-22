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