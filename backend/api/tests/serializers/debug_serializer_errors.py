from api.serializers_files.recommendation_feedback_serializers import (
    RecommendationFeedbackSerializer
)
def print_test_case(self):
    
    serializer = RecommendationFeedbackSerializer(data=self.valid_data)
    valid = serializer.is_valid()
    
    print(f"Valid: {valid}")
    if not valid:
        print("Errors:")
        for field, errors in serializer.errors.items():
            print(f"  {field}: {errors}")
    print("Data:")
    for key, value in self.valid_data.items():
        print(f"  {key}: {value}")
    print("===================================\n")
    
    return serializer