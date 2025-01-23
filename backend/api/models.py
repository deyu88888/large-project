from datetime import timedelta

from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils import timezone

#
# 1) Custom User model
#
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
                regex=r'^[a-zA-Z0-9_.-]+$',
                message='Usernames must only contain letters, numbers, underscores, hyphens, or dots.',
                code='invalid_username',
            )
        ],
        help_text="6-30 chars. Letters, digits, underscores, hyphens, and dots only.",
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
            models.UniqueConstraint(fields=['username'], name='unique_username')
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


#
# 2) Student model
#
class Student(User):
    major = models.CharField(max_length=50, blank=True)
    # Typical membership M2M
    societies = models.ManyToManyField(
        'Society',
        related_name='members',
        blank=True,
    )
    #
    # Here is the M2M for societies where this student is President.
    # Note the related_name='presidents' from Society -> Student,
    # and the name on this side is 'president_of'.
    #
    president_of = models.ManyToManyField(
        'Society',
        related_name='presidents',
        blank=True,
    )

    # This boolean indicates if the student is a president of at least one society
    is_president = models.BooleanField(default=False)

    def save(self, *args, **kwargs):
        # Do not check the M2M here (that causes a PK error for new students).
        # Instead, rely on signals to set is_president whenever M2M changes.
        self.role = 'student'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name


#
# 3) Advisor model
#
class Advisor(User):
    department = models.CharField(max_length=50)

    def save(self, *args, **kwargs):
        self.role = 'advisor'
        super().save(*args, **kwargs)

    def __str__(self):
        return self.full_name


#
# 4) Admin model
#
class Admin(User):
    def save(self, *args, **kwargs):
        self.is_superuser = True
        self.is_staff = True
        self.role = 'admin'
        super().save(*args, **kwargs)


#
# 5) Society model
#
class Society(models.Model):
    """
    A model for a student society.
    """
    name = models.CharField(max_length=30, default='')
    # If you want a separate M2M for "members" (in addition to the one in Student),
    # you can keep it. Or just rely on Student.societies. This is optional.
    society_members = models.ManyToManyField(
        'Student',
        related_name='societies_belongs_to',
        blank=True
    )

    # Roles or other metadata
    roles = models.JSONField(default=dict, blank=True)

    # Single leader (optional) or null
    leader = models.ForeignKey(
        'Student',
        on_delete=models.DO_NOTHING,
        related_name='society',
        null=True
    )

    # Must be approved by an Advisor
    approved_by = models.ForeignKey(
        'Advisor',
        on_delete=models.SET_NULL,
        related_name='approved_societies',
        blank=False,
        null=True
    )

    def __str__(self):
        return self.name


def get_date():
    """ Returns today's date """
    return timezone.now().date()

def get_time():
    """ Returns the current time """
    return timezone.now().time()


#
# 6) Event model
#
class Event(models.Model):
    """
    An event organized by a society.
    """
    title = models.CharField(max_length=20, default='')
    description = models.CharField(max_length=300, default='')
    date = models.DateField(blank=False, null=False, default=get_date)
    start_time = models.TimeField(blank=False, null=False, default=get_time)
    duration = models.DurationField(blank=False, null=False, default=timedelta(hours=1))
    hosted_by = models.ForeignKey(
        'Society',
        on_delete=models.CASCADE,
        related_name='events',
        null=True
    )
    location = models.CharField(max_length=300, default='')

    def __str__(self):
        return self.title


#
# 7) Notification model
#
class Notification(models.Model):
    """
    Notifications for a student about an event, etc.
    """
    for_event = models.ForeignKey('Event', on_delete=models.CASCADE, blank=False, null=True)
    for_student = models.ForeignKey(
        'Student',
        on_delete=models.CASCADE,
        related_name='notifications',
        blank=False,
        null=True
    )

    def __str__(self):
        return self.for_event.title