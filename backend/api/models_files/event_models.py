from datetime import timedelta, datetime
from datetime import timezone as dt_timezone
from django.db import models
from django.utils import timezone
from api.models import User


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
    main_description = models.CharField(max_length=300, default="")
    cover_image = models.ImageField(upload_to="event_covers/", default="default-event/event.jpeg")
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
        event_datetime = timezone.datetime.combine(self.date, self.start_time, tzinfo=dt_timezone.utc)
        return now >= event_datetime

    def save(self, *args, **kwargs):
        now = timezone.now()
        if isinstance(self.date, str):
            self.date = datetime.strptime(self.date, "%Y-%m-%d").date()
        if isinstance(self.start_time, str):
            if isinstance(self.start_time, str):
                parts = self.start_time.split(":")
                if len(parts) == 2:
                    self.start_time = datetime.strptime(self.start_time, "%H:%M").time()
                elif len(parts) == 3:
                    self.start_time = datetime.strptime(self.start_time, "%H:%M:%S").time()
                else:
                    raise ValueError(f"Invalid time format: {self.start_time}")
        event_start = datetime.combine(self.date, self.start_time, tzinfo=dt_timezone.utc)

        if self.status == "Pending" and now >= event_start:
            self.status = "Rejected"
        super().save(*args, **kwargs)

class EventModule(models.Model):
    """A modular component of an event page"""
    MODULE_CHOICES = [
        ('subtitle', 'Subtitle'),
        ('description', 'Description'),
        ('image', 'Image'),
        ('file', 'File'),
    ]
    event = models.ForeignKey(
        'Event', related_name='modules', on_delete=models.CASCADE, null=True, blank=True
    )
    type = models.CharField(max_length=20, choices=MODULE_CHOICES)
    text_value = models.TextField(blank=True, null=True)
    file_value = models.FileField(upload_to='event_modules_files/', blank=True, null=True)
    is_participant_only = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.type} - {self.text_value or self.file_value.name}"

class Comment(models.Model):
    """
    A comment for an event
    """
    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="comments")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
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
        """Returns the number of likes of a comment"""
        return self.likes.count()

    def total_dislikes(self):
        """Returns the number of dislikes of a comment"""
        return self.dislikes.count()

    def __str__(self):
        return f"{self.user.username}: {self.content[:30]}"
