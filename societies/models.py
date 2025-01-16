from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db import models
from django.utils import timezone

# Create your models here.

class User(AbstractUser):
    """

    """
    username = models.CharField(
        unique=True,
        max_length=30,
        validators=[
            MinLengthValidator(6),
            MaxLengthValidator(30),
            RegexValidator(
                regex='^[a-zA-Z0-9_.-]+$',
                message='Usernames must only contain letters, numbers, underscore, hyphen, and dots.',
                code='invalid_username',
            )
        ],
        help_text="6-30 characters. Letters, digits, underscore, hyphen, and dots only.",
    )
    first_name = models.CharField(max_length=50, blank=False)
    last_name = models.CharField(max_length=50, blank=False)
    email = models.EmailField(unique=True, blank=False)
    is_active = models.BooleanField(default=True)

    ROLE_CHOICES = [
        ('student', 'Student'),
        ('advisor', 'Advisor'),
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='student')

    class Meta:
        ordering = ('first_name', 'last_name')
        constraints = [
            models.UniqueConstraint(
                fields=['username'],
                name='unique_username'
            )
        ]

    @property
    def full_name(self):
        return f'{self.first_name} {self.last_name}'

    def is_student(self):
        return self.role == 'student'

    def is_advisor(self):
        return self.role == 'advisor'

    def is_admin(self):
        return self.role == 'admin'

class Student(User):
    major = models.CharField(max_length=50)
    societies = models.ManyToManyField(
        'Society',
        related_name='members',
        blank=True,
    )

    def save(self, *args, **kwargs):
        self.role = 'student'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name

class Advisor(User):
    department = models.CharField(max_length=50)
    societies = models.ManyToManyField(
        'Society',
        related_name='advisors',
        blank=True,
    )

    def save(self, *args, **kwargs):
        self.role = 'advisor'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name

class Admin(User):
    def save(self, *args, **kwargs):
        self.is_superuser = True
        self.is_staff = True
        self.role = 'admin'
        super().save(*args, **kwargs)

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
        Student,
        on_delete=models.DO_NOTHING,
        related_name='society',
        null=True
    )

    approved_by = models.ForeignKey(
        Advisor,
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
        Society,
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
        Event,
        on_delete=models.CASCADE,
        blank=False,
        null=True
    )

    for_student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=False,
        null=True
    )

    def __str__(self):
        return self.for_event.title
