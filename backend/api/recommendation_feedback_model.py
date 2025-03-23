from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from .models import Student, Society

class RecommendationFeedback(models.Model):
    """
    Model to store feedback on society recommendations.
    Allows students to rate the quality of recommendations.
    """
    RELEVANCE_CHOICES = [
        (1, 'Not relevant at all'),
        (2, 'Slightly relevant'),
        (3, 'Somewhat relevant'),
        (4, 'Very relevant'),
        (5, 'Extremely relevant')
    ]
    
    student = models.ForeignKey(
        Student, 
        on_delete=models.CASCADE, 
        related_name='recommendation_feedback'
    )
    society = models.ForeignKey(
        Society, 
        on_delete=models.CASCADE, 
        related_name='recommendation_feedback'
    )
    rating = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="Rating from 1-5 stars"
    )
    relevance = models.IntegerField(
        choices=RELEVANCE_CHOICES,
        default=3,
        help_text="How relevant was this recommendation"
    )
    comment = models.TextField(blank=True, null=True)
    is_joined = models.BooleanField(
        default=False,
        help_text="Whether the student joined the society after the recommendation"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['student', 'society']
        verbose_name = 'Recommendation Feedback'
        verbose_name_plural = 'Recommendation Feedback'
        
    def __str__(self):
        return f"{self.student.username} - {self.society.name} - {self.rating}★"