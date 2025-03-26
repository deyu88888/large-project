import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Student, Society
from api.recommendation_service import SocietyRecommender
from api.nlp_similarity import text_similarity_analyzer
from django.db.models import Count

def test_similarity_algorithm():
    """Test the NLP similarity algorithm directly with sample texts"""
    print("Testing NLP text similarity algorithm with sample texts:")
    
    test_cases = [
        # Similar texts
        ("Chess club for beginners and advanced players", 
         "Club for chess enthusiasts of all skill levels"),
        
        # Somewhat similar texts
        ("Programming society focusing on Python and web development", 
         "Coding club for students interested in software engineering"),
        
        # Different but related texts
        ("Hiking and outdoor adventure society", 
         "Rock climbing and mountaineering club"),
        
        # Completely different texts
        ("Symphony orchestra for classical music lovers", 
         "Debate society for political discussion")
    ]
    
    for i, (text1, text2) in enumerate(test_cases, 1):
        similarity = text_similarity_analyzer.calculate_similarity(text1, [text2])
        print(f"\nTest Case {i}:")
        print(f"Text 1: {text1}")
        print(f"Text 2: {text2}")
        print(f"Similarity Score (0-5): {similarity:.2f}")

def test_society_recommendations():
    """Test the society recommendation system"""
    print("\nTesting society recommendation system:")
    
    societies = Society.objects.filter(status="Approved")
    if not societies.exists():
        print("No approved societies found. Unable to test recommendations.")
        return
    
    print(f"Found {societies.count()} approved societies")
    
    recommender = SocietyRecommender()
    description_count = recommender.update_similarity_model()
    print(f"Updated similarity model with {description_count} society descriptions")
    
    if societies.count() >= 2:
        society1 = societies[0]
        society2 = societies[1]
        
        # Calculate similarity between these two societies
        if hasattr(society1, 'description') and hasattr(society2, 'description'):
            similarity = text_similarity_analyzer.calculate_similarity(
                society1.description, [society2.description]
            )

if __name__ == "__main__":
    test_similarity_algorithm()
    test_society_recommendations()