from datetime import timedelta

from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db import models
from django.contrib.auth.models import User, AbstractUser
from django.utils import timezone
from django.db.models.signals import post_save, m2m_changed
from django.dispatch import receiver


class User(AbstractUser):
    """
    A class modelling a user

    Attributes:
        username : str
            The username of the user
        first_name : str
            The first name of the user
        last_name : str
            The last name of the user
        email : str
            The email of the user
        is_active : bool
            The status of the user to determine if this user is active
        role : str
            The role of the user

    Methods:
        full_name(): Returns the user's full name, this method is a property,
                     so it can be accessed as an attribute.
        is_student(): Returns True if the user is a student
        is_admin(): Returns True if the user is an admin
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
        ('admin', 'Admin'),
    ]

    role = models.CharField(max_length=50, choices=ROLE_CHOICES, default='student')

    class Meta:
        ordering = ('first_name', 'last_name')

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
    """
    A class modelling a student

    Attributes:
        major : str
            The major of the student
        societies : ManyToManyField
            The societies the student belongs to
        president_of : ManyToManyField
            The societies the student is president of
        is_president : bool
            A flag to determine if the student is a president

    Methods:
        __str__(): Returns the student's full name
    """
    major = models.CharField(max_length=50)
    societies = models.ManyToManyField(
        'Society',
        related_name='members',
        blank=True,
    )
    president_of = models.ManyToManyField(
        'Society',
        related_name='president',
        blank=True,
    )
    is_president = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        self.role = 'student'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name


@receiver(m2m_changed, sender=Student.president_of.through)
def update_is_president(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        # Update `is_president` field whenever the `president_of` many-to-many field changes
        instance.is_president = instance.president_of.exists()
        instance.save(update_fields=["is_president"])


class Admin(User):
    """
    A class modelling an admin

    Attributes:
        is_superuser : bool
            A flag to determine if the admin is a superuser
        is_staff : bool
            A flag to determine if the admin is a staff
        role : str
            The role of the admin

    Methods:
        save(): Overrides the save method to set is_superuser and is_staff to True
    """
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
        'Student',
        on_delete=models.DO_NOTHING,
        related_name='society',
        null=True
    )

    def __str__(self):
        return str(self.name)

def get_date():
    """ Returns the current date """

    return timezone.now().date()

def get_time():
    """ Returns the current time """

    return timezone.now().time()

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
        default=get_date
    )

    start_time = models.TimeField(
        blank=False,
        null=False,
        default=get_time
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