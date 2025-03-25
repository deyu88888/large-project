# backend/api/test_diverse_descriptions.py
import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.nlp_similarity import TextSimilarityAnalyzer

# Create a fresh instance for testing
test_analyzer = TextSimilarityAnalyzer()

# Sample diverse society descriptions
diverse_descriptions = [
    "Chess Club: We promote the game of chess through regular tournaments, casual play sessions, and lessons for all skill levels. Join us to improve your strategic thinking!",
    "Coding Society: A community for programmers, developers, and tech enthusiasts. We host hackathons, workshops on various languages, and networking events with industry professionals.",
    "Debate Team: Sharpen your public speaking and critical thinking through competitive debate. We participate in local and national tournaments across various formats.",
    "Film Club: For cinema lovers! We watch and discuss classic and contemporary films, organize movie marathons, and even create our own short films.",
    "Hiking Association: Explore the great outdoors through our weekly hiking trips. All fitness levels welcome as we discover local trails and occasionally venture further afield.",
    "Photography Society: Capture the beauty around you! We hold workshops on techniques, equipment reviews, photo walks, and seasonal exhibitions of members' work.",
    "Art Collective: A space for artists to collaborate, share techniques, and exhibit their work. All mediums welcome, from painting to digital art.",
    "Music Ensemble: From classical to contemporary, we bring musicians together to perform, compose, and share their passion for creating music.",
    "Environmental Club: Taking action for our planet through campus initiatives, community clean-ups, and educational workshops on sustainability.",
    "International Students Association: Celebrating cultural diversity through food festivals, language exchanges, and support networks for students from around the world."
]

def test_diverse_descriptions():
    # First update the model with the diverse descriptions
    test_analyzer.update_corpus(diverse_descriptions)
    
    print("\n===== Testing with Diverse Society Descriptions =====")
    
    # Test cases with expected similarity ratings
    test_cases = [
        # Similar societies - should have high similarity
        (diverse_descriptions[0], diverse_descriptions[0], 5.0), # Same society (Chess)
        (diverse_descriptions[0], "A club for chess players of all levels seeking to improve their game through practice and tournaments.", 4.0),
        
        # Related societies - should have medium similarity
        (diverse_descriptions[1], diverse_descriptions[2], 2.0), # Coding and Debate
        (diverse_descriptions[4], diverse_descriptions[8], 2.5), # Hiking and Environmental
        
        # Unrelated societies - should have low similarity
        (diverse_descriptions[0], diverse_descriptions[7], 0.5), # Chess and Music
        (diverse_descriptions[3], diverse_descriptions[9], 0.5), # Film and International
    ]
    
    for i, (text1, text2, expected) in enumerate(test_cases, 1):
        similarity = test_analyzer.calculate_similarity(text1, [text2])
        print(f"\nTest Case {i}:")
        print(f"Text 1: {text1[:100]}...")
        print(f"Text 2: {text2[:100]}...")
        print(f"Calculated Similarity: {similarity:.2f}/5.00")
        print(f"Expected Similarity: {expected}/5.00")
        
        if abs(similarity - expected) <= 1.5:  # Allow some wiggle room
            result = "✓ PASS"
        else:
            result = "✗ FAIL"
        
        print(f"Result: {result}")

if __name__ == "__main__":
    test_diverse_descriptions()