from datetime import timedelta
from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.dispatch import receiver
from django.utils import timezone
from django.db.models.signals import m2m_changed
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
    first_name = models.CharField(max_length=50, blank=False)
    last_name = models.CharField(max_length=50, blank=False)
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

    class Meta:
        ordering = ("first_name", "last_name")

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def is_student(self):
        return self.role == "student"

    def is_admin(self):
        return self.role == "admin"


class Student(User):
    """
    A model representing student users
    """
    STATUS_CHOICES = [
        ("Pending", "Pending Approval"),
        ("Approved", "Approved"),
        ("Rejected", "Rejected"),
    ]

    major = models.CharField(max_length=50, blank=True)

    societies = models.ManyToManyField(
        "Society",
        related_name="members",
        blank=True,
    )

    president_of = models.ManyToManyField(
        "Society",
        related_name="presidents",
        blank=True,
    )

    is_president = models.BooleanField(default=False)

    attended_events = models.ManyToManyField(
        'Event',
        related_name='attendees',
        blank=True
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending"
    )

    def save(self, *args, **kwargs):
        self.role = "student"
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name

# Signal to update `is_president` when `president_of` changes
@receiver(m2m_changed, sender=Student.president_of.through)
def update_is_president(sender, instance, **kwargs):
    instance.is_president = instance.president_of.exists()
    instance.save()


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

    name = models.CharField(max_length=30, default="")
    society_members = models.ManyToManyField(
        "Student", related_name="societies_belongs_to", blank=True
    )

    roles = models.JSONField(default=dict, blank=True)

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
    social_media_links = models.JSONField(default=dict, blank=True)  # {"facebook": "link", "email": "email"}
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
            
    def __str__(self):
        return self.name


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
    roles = models.JSONField(default=dict, blank=True)
    leader = models.ForeignKey(
        "Student",
        on_delete=models.DO_NOTHING,
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


class UserRequest(Request):
    """
    Requests related to users
    """
    # username at some point
    major = models.CharField(max_length=50, blank=True, default="")


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
