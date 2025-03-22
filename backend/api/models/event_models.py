from datetime import timedelta
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

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

class Comment(models.Model):
    """
    A comment for an event
    """
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
        """Returns the number of likes of a comment"""
        return self.likes.count()

    def total_dislikes(self):
        """Returns the number of dislikes of a comment"""
        return self.dislikes.count()

    def __str__(self):
            return f"{self.user.username}: {self.content[:30]}"
