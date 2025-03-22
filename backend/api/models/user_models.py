from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.core.validators import MinLengthValidator, MaxLengthValidator, RegexValidator
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.dispatch import receiver
from django.db.models.signals import pre_save
from django.utils.translation import gettext_lazy as _
from django.dispatch import receiver
import models_utility

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
            buffer = models_utility.generate_icon(self.first_name[0], self.last_name[0])
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