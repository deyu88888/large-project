from django.contrib.postgres.fields import JSONField
from datetime import timedelta
from random import randint
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
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

class User(AbstractUser):
    """
    A custom user model with role-based logic.
    """
    username = models.CharField(
        unique=True,
        max_length=30,
        validators=[
            MinLengthValidator(6),
            MaxLengthValidator(30),
            RegexValidator(
                regex=r"^[a-zA-Z0-9_.-]+$",
                message="Usernames must only contain letters, numbers, underscores, hyphens, or dots.",
                code="invalid_username",
            ),
        ],
        help_text="6-30 chars. Letters, digits, underscores, hyphens, and dots only.",
    )
    first_name = models.CharField(max_length=50, blank=False, default="first")
    last_name = models.CharField(max_length=50, blank=False, default="last")
    email = models.EmailField(unique=True, blank=False)
    is_active = models.BooleanField(default=True)

    ROLE_CHOICES = [
        ("student", "Student"),
        ("admin", "Admin"),
    ]
    role = models.CharField(
        max_length=50,
        choices=ROLE_CHOICES,
        default="student"
    )

    following = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="followers",
        blank=True,
    )

    # This flag differentiates super-admins from normal admins
    is_super_admin = models.BooleanField(default=False)

    class Meta:
        ordering = ("first_name", "last_name")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def is_student(self):
        return self.role == "student"

    def is_admin(self):
        return self.role == "admin" or self.is_super_admin
    
    @classmethod
    def get_admins(cls):
        """Return all admin users (including super-admins)."""
        return cls.objects.filter(role="admin") | cls.objects.filter(is_super_admin=True)

    def save(self, *args, **kwargs):
        """
        Assign users to the correct groups based on role.
        """
        # super().save(*args, **kwargs) 

        if self.is_super_admin:
            self.is_superuser = True
            self.is_staff = True
        elif self.is_admin():
            self.is_superuser = False
            self.is_staff = True
        else:
            self.is_superuser = False
            self.is_staff = False

        super().save(*args, **kwargs)


def generate_icon(initial1: str, initial2: str) -> BytesIO:
    """Generates an basic default icon"""
    # Generates a random RGB value
    colour = (randint(0, 255), randint(0, 255), randint(0,255))
    initials = initial1.upper() + initial2.upper()
    size = (100, 100)
    image = Image.new('RGB', size=size, color=colour)
    draw = ImageDraw.Draw(image)
    try:
        font = ImageFont.truetype("DejaVuSans.ttf", 50)
    except IOError:
        font = ImageFont.load_default()
    bbox = draw.textbbox((0, 0), initials, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_position = ((size[0] - text_width) // 2, (size[1] - text_height) // 2)
    draw.text(
        text_position,
        initials,
        fill=(255 - colour[0], 255 - colour[1], 255 - colour[2]),
        font=font
    )

    buffer = BytesIO()
    image.save(buffer, format='JPEG')
    buffer.seek(0)

    return buffer


class Student(User):
    """
    A model representing student users
    """
    STATUS_CHOICES = [
        ("Pending", "Pending Approval"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    societies = models.ManyToManyField(
        "Society",
        related_name="members",
        blank=True,
    )

    president_of = models.OneToOneField(
        "Society",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="society_president",
    )

    attended_events = models.ManyToManyField(
        'Event',
        related_name='attendees',
        blank=True
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending"
    )

    major = models.CharField(max_length=50, blank=True)
    is_president = models.BooleanField(default=False)
    is_vice_president = models.BooleanField(default=False)
    is_event_manager = models.BooleanField(default=False)
    icon = models.ImageField(upload_to="student_icons/", blank=True, null=True)

    def save(self, *args, **kwargs):
        self.role = "student"
        
    
    # Check for conflicting leadership roles
        leadership_roles = []
        if self.is_president:
            leadership_roles.append("president")
        if self.is_vice_president:
            leadership_roles.append("vice president")
        if self.is_event_manager:
            leadership_roles.append("event manager")
        
        if len(leadership_roles) > 1:
            raise ValidationError(f"A student can only hold one leadership role. This student is assigned as: {', '.join(leadership_roles)}")

        super().save(*args, **kwargs)

        if not self.icon.name or not self.icon:
            buffer = generate_icon(self.first_name[0], self.last_name[0])
            filename = f"default_student_icon_{self.pk}.jpeg"
            self.icon.save(filename, ContentFile(buffer.getvalue()), save=True)

    def __str__(self):
        return self.full_name

    def get_societies(self, obj):
        return [society.name for society in obj.societies.all()]

# Signal to update `is_president` when `president_of` changes
@receiver(pre_save, sender=Student)
def update_is_president(sender, instance, **kwargs):
    instance.is_president = instance.president_of is not None


def validate_social_media_links(value):
    """
    Validate the social_media_links JSON field.
    Ensures it has proper structure with valid keys and URL values.
    """
    # Define allowed social media platforms
    allowed_platforms = ['WhatsApp', 'Facebook', 'Instagram', 'X', 'Email', 'Other']
    
    # Check that value is a dictionary
    if not isinstance(value, dict):
        raise ValidationError("Social media links must be provided as a dictionary.")
    
    # Check that all keys are valid platforms
    for key in value.keys():
        if key not in allowed_platforms:
            raise ValidationError(f"'{key}' is not a valid social media platform. Allowed platforms are: {', '.join(allowed_platforms)}")
    
    # Check that all values are strings (links)
    for platform, link in value.items():
        if not isinstance(link, str):
            raise ValidationError(f"The value for '{platform}' must be a string URL.")
        
        # Optional: Add URL validation if needed
        # This is a simple check, you might want to use more sophisticated URL validation
        if link and not (link.startswith('http://') or link.startswith('https://') or link.startswith('mailto:')):
            raise ValidationError(f"The link for '{platform}' must be a valid URL starting with http://, https://, or mailto:")


class Society(models.Model):
    """
    A model for a student society.
    """
    STATUS_CHOICES = [
        ("Pending", "Pending Approval"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    name = models.CharField(max_length=30, default="default")
    description = models.CharField(max_length=500, default="default")
    society_members = models.ManyToManyField(
        "Student", related_name="societies_belongs_to", blank=True
    )

    vice_president = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="vice_president_of_society",
        help_text="Assigned vice-president of the society",
    )
    event_manager = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="event_manager_of_society",
        help_text="Assigned event manager of the society",
    )
    president = models.ForeignKey(
        "Student",
        on_delete=models.DO_NOTHING,
        related_name="society", #TODO: change name to president_of_society?
        null=True,
    )

    approved_by = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        related_name="approved_societies",
        blank=False,
        null=True,
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending"
    )

    category = models.CharField(max_length=50, default="General")
    # Social media links as a JSON field with validation
    social_media_links = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Dictionary with keys: WhatsApp, Facebook, Instagram, X, Email, Other - each with a URL value"
    )
    
    membership_requirements = models.TextField(blank=True, null=True)
    upcoming_projects_or_plans = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)  # Stores tags as a list
    icon = models.ImageField(upload_to="society_icons/", blank=True, null=True)  # Stores an image icon

    def clean(self):
        """
        Additional model-wide validation
        """
        super().clean()
        
        # Validate social_media_links if it's not empty
        if self.social_media_links:
            # Check that value is a dictionary
            if not isinstance(self.social_media_links, dict):
                raise ValidationError({"social_media_links": "Social media links must be provided as a dictionary."})
            
            # Define allowed social media platforms
            allowed_platforms = ['WhatsApp', 'Facebook', 'Instagram', 'X', 'Email', 'Other']
            
            # Check that all keys are valid platforms
            for key in self.social_media_links.keys():
                if key not in allowed_platforms:
                    raise ValidationError({"social_media_links": f"'{key}' is not a valid social media platform. Allowed platforms are: {', '.join(allowed_platforms)}"})
            
            # Process and validate values
            for platform, link in list(self.social_media_links.items()):
                # Skip if empty
                if not link:
                    continue
                    
                # Check that the value is a string
                if not isinstance(link, str):
                    raise ValidationError({"social_media_links": f"The value for '{platform}' must be a string URL."})
                
                # Special handling for Email field - automatically add mailto: prefix
                if platform == 'Email' and not (link.startswith('http://') or link.startswith('https://') or link.startswith('mailto:')):
                    self.social_media_links[platform] = f"mailto:{link}"
                # For other platforms, validate URL format
                elif platform != 'Email' and link and not (link.startswith('http://') or link.startswith('https://')):
                    raise ValidationError({"social_media_links": f"The link for '{platform}' must be a valid URL starting with http:// or https://"})

    def save(self, *args, **kwargs):
        """Ensure the president is always a member and validate JSON fields"""
        # Run full validation
        self.full_clean()
        
        # Save the society
        super().save(*args, **kwargs)
        
        # Ensure president is a member
        if self.president:
            self.society_members.add(self.president) 

        # Add default icon if needed
        if not self.icon.name or not self.icon:
            buffer = generate_icon(self.name[0], "S")
            filename = f"default_society_icon_{self.pk}.jpeg"
            self.icon.save(filename, ContentFile(buffer.getvalue()), save=True)

        if self.pk:
            before_changes = Society.objects.get(pk=self.pk)
            
            # Handle vice president changes
            before_vp = before_changes.vice_president
            if self.vice_president != before_vp:
                if self.vice_president:
                    self.vice_president.is_vice_president = True
                    self.vice_president.save()
                if before_vp:
                    before_vp.is_vice_president = False
                    before_vp.save()
            
            # Handle event manager changes
            before_em = before_changes.event_manager
            if self.event_manager != before_em:
                if self.event_manager:
                    self.event_manager.is_event_manager = True
                    self.event_manager.save()
                if before_em:
                    before_em.is_event_manager = False
                    before_em.save()

    def __str__(self):
        return self.name


class SocietyShowreel(models.Model):
    """
    A model for each of a societies photos
    """
    society = models.ForeignKey(
        "Society",
        on_delete=models.CASCADE,
        related_name="showreel_images",
        blank=False,
        null=False,
    )
    photo = models.ImageField(
        upload_to="society_showreel/",
        blank=False,
        null=False
    )
    caption = models.CharField(max_length=50, default="", blank=True)

    def clean(self):
        if not self.society_id:
            raise ValidationError({"society": "society is required"})
        if not self.pk and self.society.showreel_images.count() >= 10:
            raise ValidationError({"society": "society can have max 10 showreel images"})

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


def get_date():
    """Returns today's date"""
    return timezone.now().date()


def get_time():
    """Returns the current time"""
    return timezone.now().time()


class Event(models.Model):
    """
    An event organized by a society.
    """
    title = models.CharField(max_length=20, default="")
    description = models.CharField(max_length=300, default="")
    date = models.DateField(blank=False, null=False, default=get_date)
    start_time = models.TimeField(blank=False, null=False, default=get_time)
    duration = models.DurationField(
        blank=False, null=False, default=timedelta(hours=1)
    )
    hosted_by = models.ForeignKey(
        "Society", on_delete=models.CASCADE, related_name="events", null=True
    )
    location = models.CharField(max_length=300, default="")

    max_capacity = models.PositiveIntegerField(default=0)  # 0 = No limit
    current_attendees = models.ManyToManyField('Student', blank=True)

    STATUS_CHOICES = [
        ("Pending", "Pending Approval"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="Pending"
    )

    def __str__(self):
        return str(self.title)

    def is_full(self):
        """Returns a boolean representing whether the event is full"""
        return self.max_capacity > 0 and self.current_attendees.count() >= self.max_capacity

    def has_started(self):
        """Returns a boolean representing whether an event has began"""
        now = timezone.now()
        event_datetime = timezone.datetime.combine(self.date, self.start_time, tzinfo=timezone.utc)
        return now >= event_datetime


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


class Award(models.Model):
    """
    Awards to be granted to students
    """
    RANKS = [
        ("Bronze", "Bronze"),
        ("Silver", "Silver"),
        ("Gold", "Gold"),
    ]
    rank = models.CharField(
        max_length=10,
        default="Bronze",
        blank=False,
        null=False,
        choices=RANKS,
    )
    is_custom = models.BooleanField(default=False)
    title = models.CharField(
        max_length=20,
        default="default_title",
        blank=False,
        null=False,
    )
    description = models.CharField(
        max_length=150,
        default="default_description",
        blank=False,
        null=False,
    )

    def __str__(self):
        return f"{self.title}, {self.rank}"


class AwardStudent(models.Model):
    """
    The relation between Award and Student
    """
    award = models.ForeignKey(
        "Award",
        on_delete=models.CASCADE,
        related_name="student_awards",
        blank=False,
        null=False,
    )
    student = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        related_name="award_students",
        blank=False,
        null=False,
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student}, ({self.award})"


class Comment(models.Model):
    event = models.ForeignKey("Event", on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey("User", on_delete=models.CASCADE)
    content = models.TextField()
    create_at = models.DateTimeField(auto_now_add=True)
    parent_comment = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies"
    )
    likes = models.ManyToManyField(User, related_name="liked_comments", blank=True)
    dislikes = models.ManyToManyField(User, related_name="disliked_comments", blank=True)

    def total_likes(self):
        return self.likes.count()

    def total_dislikes(self):
        return self.dislikes.count()

    def __str__(self):
            return f"{self.user.username}: {self.content[:30]}"


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