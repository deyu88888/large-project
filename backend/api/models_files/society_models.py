from django.core.files.base import ContentFile
from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
import api.models_files.models_utility as models_utility


def validate_social_media_links(value):
    """
    Validate the social_media_links JSON field.
    Ensures it has proper structure with valid keys and URL values.
    """
    # Define allowed social media platforms
    allowed_platforms = ['WhatsApp', 'Facebook', 'Instagram', 'X', 'Email', 'Other']
    
    # Check that value is a dictionary
    if not isinstance(value, dict):
        raise ValidationError("Social media links must be provided as a dictionary.")
    
    # Check that all keys are valid platforms
    for key in value.keys():
        if key not in allowed_platforms:
            raise ValidationError(f"'{key}' is not a valid social media platform. Allowed platforms are: {', '.join(allowed_platforms)}")
    
    # Check that all values are strings (links)
    for platform, link in value.items():
        if not isinstance(link, str):
            raise ValidationError(f"The value for '{platform}' must be a string URL.")
        
        if link and not (link.startswith('http://') or link.startswith('https://') or link.startswith('mailto:')):
            raise ValidationError(f"The link for '{platform}' must be a valid URL starting with http://, https://, or mailto:")

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
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="vice_president_of_society",
        help_text="Assigned vice-president of the society",
    )
    event_manager = models.ForeignKey(
        "Student",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="event_manager_of_society",
        help_text="Assigned event manager of the society",
    )
    president = models.ForeignKey(
        "Student",
        on_delete=models.DO_NOTHING,
        related_name="president_of_society",
        null=True,
    )

    approved_by = models.ForeignKey(
        "User",
        on_delete=models.SET_NULL,
        related_name="approved_societies",
        blank=False,
        null=True,
    )

    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="Pending"
    )

    category = models.CharField(max_length=50, default="General")
    social_media_links = models.JSONField(
        default=dict, 
        blank=True,
        help_text="Dictionary with keys: WhatsApp, Facebook, Instagram, X, Email, Other - each with a URL value"
    )
    
    membership_requirements = models.TextField(blank=True, null=True)
    upcoming_projects_or_plans = models.TextField(blank=True, null=True)
    tags = models.JSONField(default=list, blank=True)  # Stores tags as a list
    icon = models.ImageField(upload_to="society_icons/", blank=True, null=True)  # Stores an image icon

    def clean(self):
        """
        Additional model-wide validation
        """
        super().clean()
        if self.social_media_links:
            if not isinstance(self.social_media_links, dict):
                raise ValidationError({"social_media_links": "Social media links must be provided as a dictionary."})
            allowed_platforms = ['WhatsApp', 'Facebook', 'Instagram', 'X', 'Email', 'Other']
            # Check that all keys are valid platforms
            for key in self.social_media_links.keys():
                if key not in allowed_platforms:
                    raise ValidationError({"social_media_links": f"'{key}' is not a valid social media platform. Allowed platforms are: {', '.join(allowed_platforms)}"})
            
            # Process and validate values
            for platform, link in list(self.social_media_links.items()):
                if not link:
                    continue
                if not isinstance(link, str):
                    raise ValidationError({"social_media_links": f"The value for '{platform}' must be a string URL."})
                # Special handling for Email field - automatically add mailto: prefix
                if platform == 'Email' and not (link.startswith('http://') or link.startswith('https://') or link.startswith('mailto:')):
                    self.social_media_links[platform] = f"mailto:{link}"
                # For other platforms, validate URL format
                elif platform != 'Email' and link and not (link.startswith('http://') or link.startswith('https://')):
                    raise ValidationError({"social_media_links": f"The link for '{platform}' must be a valid URL starting with http:// or https://"})

    def save(self, *args, **kwargs):
        """Ensure the president is always a member and validate JSON fields"""
        self.full_clean()
        
        super().save(*args, **kwargs)
        
        if self.president:
            self.society_members.add(self.president) 

        if not self.icon.name or not self.icon:
            buffer = models_utility.generate_icon(self.name[0], "S")
            filename = f"default_society_icon_{self.pk}.jpeg"
            self.icon.save(filename, ContentFile(buffer.getvalue()), save=True)

        if self.pk:
            before_changes = Society.objects.get(pk=self.pk)
            
            # Handle vice president changes
            before_vp = before_changes.vice_president
            if self.vice_president != before_vp:
                if self.vice_president:
                    self.vice_president.is_vice_president = True
                    self.vice_president.save()
                if before_vp:
                    before_vp.is_vice_president = False
                    before_vp.save()
            
            # Handle event manager changes
            before_em = before_changes.event_manager
            if self.event_manager != before_em:
                if self.event_manager:
                    self.event_manager.is_event_manager = True
                    self.event_manager.save()
                if before_em:
                    before_em.is_event_manager = False
                    before_em.save()

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