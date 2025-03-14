# backend/api/test_recommendations.py
import os
import django

# Setup Django environment
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
    
    # Get all societies
    societies = Society.objects.filter(status="Approved")
    if not societies.exists():
        print("No approved societies found. Unable to test recommendations.")
        return
    
    print(f"Found {societies.count()} approved societies")
    
    # Get the TF-IDF model ready with society descriptions
    recommender = SocietyRecommender()
    description_count = recommender.update_similarity_model()
    print(f"Updated similarity model with {description_count} society descriptions")
    
    # Test recommendation explanations for a few sample societies
    if societies.count() >= 2:
        society1 = societies[0]
        society2 = societies[1]
        
        print(f"\nComparing societies:")
        print(f"Society 1: {society1.name}")
        if hasattr(society1, 'description') and society1.description:
            print(f"Description: {society1.description[:100]}..." if len(society1.description) > 100 else f"Description: {society1.description}")
        
        print(f"\nSociety 2: {society2.name}")
        if hasattr(society2, 'description') and society2.description:
            print(f"Description: {society2.description[:100]}..." if len(society2.description) > 100 else f"Description: {society2.description}")
        
        # Calculate similarity between these two societies
        if hasattr(society1, 'description') and hasattr(society2, 'description'):
            similarity = text_similarity_analyzer.calculate_similarity(
                society1.description, [society2.description]
            )
            print(f"\nText similarity between societies: {similarity:.2f}/5")

if __name__ == "__main__":
    # Test text similarity with sample data
    test_similarity_algorithm()
    
    # Test with actual society data
    test_society_recommendations()