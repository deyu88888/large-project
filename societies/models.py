from django.contrib.auth.models import AbstractUser
from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db.models import Model
from libgravatar import Gravatar
from django.db import models

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
    pass

class Event(models.Model):
    pass

class Notification(models.Model):
    pass