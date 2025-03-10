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
from django.utils.translation import gettext_lazy as _  # Import for i18n


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

    class Meta:
        ordering = ("first_name", "last_name")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def is_student(self):
        return self.role == "student"

    def is_admin(self):
        return self.role == "admin"


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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="president",
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
    icon = models.ImageField(upload_to="student_icons/", blank=True, null=True)

    def save(self, *args, **kwargs):
        self.role = "student"

        super().save(*args, **kwargs)

        if not self.icon.name or not self.icon:
            buffer = generate_icon(self.first_name[0], self.last_name[0])
            filename = f"default_student_icon_{self.pk}.jpeg"
            self.icon.save(filename, ContentFile(buffer.getvalue()), save=True)

    def __str__(self):
        return self.full_name

# Signal to update `is_president` when `president_of` changes
@receiver(pre_save, sender=Student)
def update_is_president(sender, instance, **kwargs):
    instance.is_president = instance.president_of is not None


class Admin(User):
    """
    A model representing admin users
    """
    def save(self, *args, **kwargs):
        self.is_superuser = True
        self.is_staff = True
        self.role = "admin"
        super().save(*args, **kwargs)


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
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="vice_president_of_society",
        help_text="Assigned vice-president of the society",
    )
    event_manager = models.ForeignKey(
        "Student",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="event_manager_of_society",
        help_text="Assigned event manager of the society",
    )
    treasurer = models.ForeignKey(
        "Student",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="treasurer_of_society",
        help_text="Assigned treasurer of the society",
    )
    leader = models.ForeignKey(
        "Student",
        on_delete=models.DO_NOTHING,
        related_name="society",
        null=True,
    )

    approved_by = models.ForeignKey(
        "Admin",
        on_delete=models.SET_NULL,
        related_name="approved_societies",
        blank=False,
        null=True,
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending"
    )

    category = models.CharField(max_length=50, default="General")
    # {"facebook": "link", "email": "email"}
    social_media_links = models.JSONField(default=dict, blank=True)
    timetable = models.TextField(blank=True, null=True)
    membership_requirements = models.TextField(blank=True, null=True)
    upcoming_projects_or_plans = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)  # Stores tags as a list
    icon = models.ImageField(upload_to="society_icons/", blank=True, null=True)  # Stores an image icon

    def save(self, *args, **kwargs):
        """Ensure the leader is always a member"""
        super().save(*args, **kwargs)  # Save the society first
        if self.leader:
            self.society_members.add(self.leader) 

        if not self.icon.name or not self.icon:
            buffer = generate_icon(self.name[0], "S")
            filename = f"default_society_icon_{self.pk}.jpeg"
            self.icon.save(filename, ContentFile(buffer.getvalue()), save=True)
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
    for_event = models.ForeignKey(
        "Event", on_delete=models.CASCADE, blank=False, null=True
    )
    for_student = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        related_name="notifications",
        blank=False,
        null=True,
    )

    is_read = models.BooleanField(default=False)
    message = models.TextField()
    def __str__(self):
        return self.for_event.title


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
        ("UpdateUse", "Update User")
    ]

    intent = models.CharField(max_length=10, choices=INTENT)
    requested_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)

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
        on_delete=models.DO_NOTHING,
        related_name="society_request",
        blank=True,
        null=True,
    )
    name = models.CharField(max_length=30, blank=True, default="")
    descritpion = models.CharField(max_length=500, blank=True, default="")
    roles = models.JSONField(default=dict, blank=True)
    leader = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        related_name="society_request_leader",
        blank=True,
        null=True,
    )
    category = models.CharField(max_length=50, blank=True, default="")
    # {"facebook": "link", "email": "email"}
    social_media_links = models.JSONField(default=dict, blank=True, null=True)
    timetable = models.TextField(blank=True, default="")
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
    reviewed_by = models.ForeignKey("Admin", on_delete=models.SET_NULL, null=True, blank=True)

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
        on_delete=models.DO_NOTHING,
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

    def __str__(self):
        return f"{self.get_report_type_display()} - {self.subject} (From {self.from_student.username})"


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
    parent_comment = models.ForeignKey("self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies")

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}"