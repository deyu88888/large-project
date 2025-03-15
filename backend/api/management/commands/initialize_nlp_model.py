# backend/api/management/commands/initialize_nlp_model.py
from django.core.management.base import BaseCommand
from api.recommendation_service import SocietyRecommender

class Command(BaseCommand):
    help = 'Initialize the NLP text similarity model with existing society descriptions'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting NLP model initialization...'))
        
        # Create a recommender instance
        recommender = SocietyRecommender()
        
        # Update the model with all society descriptions
        description_count = recommender.update_similarity_model()
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully initialized NLP model with {description_count} society descriptions'
            )
        )