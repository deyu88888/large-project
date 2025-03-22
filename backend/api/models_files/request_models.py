from django.db import models
from django.utils.translation import gettext_lazy as _
import api.models_files.user_models as user_models
import api.models_files.society_models as society_models
import api.models_files.event_models as event_models

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
        user_models.Student,
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
        society_models.Society,
        on_delete=models.CASCADE,
        related_name="society_request",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=30, blank=True, default="")
    description = models.CharField(max_length=500, blank=True, default="")
    roles = models.JSONField(default=dict, blank=True)
    president = models.ForeignKey(
        user_models.Student,
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

    society = models.ForeignKey(society_models.Society, on_delete=models.CASCADE, related_name="description_requests")
    requested_by = models.ForeignKey(user_models.Student, on_delete=models.CASCADE, related_name="description_requests")
    new_description = models.TextField(blank=False)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="Pending")
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(user_models.User, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"Description update request for {self.society.name} - {self.status}"


class SocietyShowreelRequest(models.Model):
    """
    Requests related to societies showreel photos
    """
    society = models.ForeignKey(
        SocietyRequest,
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
        event_models.Event,
        on_delete=models.DO_NOTHING,
        related_name="event_request",
        blank=True,
        null=True,
    )
    hosted_by = models.ForeignKey(
        society_models.Society,
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
        "communication_models.SocietyNews",
        on_delete=models.CASCADE,
        related_name="publication_requests"
    )

    requested_by = models.ForeignKey(
        user_models.Student,
        on_delete=models.CASCADE,
        related_name="news_publication_requests"
    )

    reviewed_by = models.ForeignKey(
        user_models.User,
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
