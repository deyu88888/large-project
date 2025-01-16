from datetime import timedelta

from django.db import models
from django.utils import timezone

class Society(models.Model):
    """
    A class modelling a student society

    Attributes:
        name : str 
            The name of the society
        society_members : ManyToManyField
            The society members
        roles : JSONField(dict) 
            A dictionary of customised roles for society members
        leader : ForeignKey(Student)
            The society leader
        approved_by : ForeignKey(Admin)
            The admin responsible for approving the society

    Methods:
        __str__(): Returns the society's name
    """

    name = models.CharField(max_length=30, default='')
    society_members = models.ManyToManyField(
        'Student',
        related_name='societies_belongs_to',
        blank=True
    )

    # Roles will hold a dictionary of role_name to user_id
    roles = models.JSONField(default=dict, blank=True)

    leader = models.ForeignKey(
        'Student',
        on_delete=models.DO_NOTHING,
        related_name='society',
        null=True
    )

    approved_by = models.ForeignKey(
        'Advisor',
        on_delete=models.SET_NULL,
        related_name='approved_societies',
        blank=False,
        null = True
    )

    def __str__(self):
        return str(self.name)

class Event(models.Model):
    """
    A class modelling an event held by a student society

    Attributes:
        title : str 
            The title of the event
        description : str 
            A description of the event
        date : DateField
            The data the event is to be held
        start_time : TimeField 
            The time at which the event begins
        duration : DurationField
            The duration for which the event lasts
        hosted_by : ForeignKey(Society)
            The society hosting the event
        location : str
            The location/address in which the event will be held

    Methods:
        __str__(): Returns the event's name
    """

    title = models.CharField(max_length=20, default='')
    description = models.CharField(max_length=300, default='')

    date = models.DateField(
        blank=False,
        null=False,
        default=timezone.now
    )

    start_time = models.TimeField(
        blank=False,
        null=False,
        default=timezone.now
    )

    # Stores only duration inplace of duration & endtime
    duration = models.DurationField(
        blank=False,
        null=False,
        default=timedelta(hours=1)
    )

    hosted_by = models.ForeignKey(
        'Society',
        on_delete=models.CASCADE,
        related_name='events',
        null=True
    )

    # May need to be longer or shorter, for address
    location = models.CharField(max_length=300, default='')

    def __str__(self):
        return str(self.title)

class Notification(models.Model):
    """
    A class modelling notifications to be sent 
    to a user to inform them of events

    Attributes:
        for_event : ForeignKey(Event)
            The event the student is to informed of
        for_student : ForeignKey(Student)
            The student the notification is intended for

    Methods:
        __str__(): Returns the related event's name
    """

    for_event = models.ForeignKey(
        'Event',
        on_delete=models.CASCADE,
        blank=False,
        null=True
    )

    for_student = models.ForeignKey(
        'Student',
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=False,
        null=True
    )

    def __str__(self):
        return self.for_event.title