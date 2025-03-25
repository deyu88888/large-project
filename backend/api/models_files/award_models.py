from django.db import models
from django.utils.translation import gettext_lazy as _
from api.models import Student


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
        Award,
        on_delete=models.CASCADE,
        related_name="student_awards",
        blank=False,
        null=False,
    )
    student = models.ForeignKey(
        Student,
        on_delete=models.CASCADE,
        related_name="award_students",
        blank=False,
        null=False,
    )
    awarded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.student}, ({self.award})"
