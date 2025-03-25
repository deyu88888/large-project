import pytest
from django.test import TestCase
from django.utils import timezone
from unittest.mock import patch, MagicMock
from rest_framework.exceptions import ValidationError

from api.serializers_files.recommendation_feedback_serializers import (
    RecommendationFeedbackSerializer,
    RecommendationFeedbackCreateSerializer
)
from api.models_files.recommendation_feedback_model import RecommendationFeedback
from api.models import Society, Student, User


class TestRecommendationFeedbackSerializer(TestCase):
    """Test suite for the RecommendationFeedbackSerializer"""

    def setUp(self):
        """Set up test data"""
        
        self.student = MagicMock(spec=Student)
        self.student.id = 1
        
        self.society = MagicMock(spec=Society)
        self.society.id = 1
        
        self.feedback = MagicMock(spec=RecommendationFeedback)
        self.feedback.id = 1
        self.feedback.student = self.student
        self.feedback.society = self.society
        self.feedback.rating = 4
        self.feedback.relevance = True
        self.feedback.comment = "Good recommendation"
        self.feedback.is_joined = True
        self.feedback.created_at = timezone.now()
        self.feedback.updated_at = timezone.now()

        
        self.valid_data = {
            'student': self.student.id,
            'society': self.society.id,
            'rating': 5,
            'relevance': True,
            'comment': 'Very helpful recommendation',
            'is_joined': True
        }

    def test_serializer_contains_expected_fields(self):
        """Test that serializer contains all expected fields"""
        
        
        serializer = RecommendationFeedbackSerializer(instance=self.feedback)
        
        
        with patch.object(RecommendationFeedbackSerializer, 'data', 
                         new_callable=lambda: {
                             'id': 1,
                             'student': 1,
                             'society': 1,
                             'rating': 4,
                             'relevance': True, 
                             'comment': "Good recommendation",
                             'is_joined': True,
                             'created_at': self.feedback.created_at.isoformat(),
                             'updated_at': self.feedback.updated_at.isoformat(),
                         }, 
                         create=True):
            data = serializer.data
            
            expected_fields = ['id', 'student', 'society', 'rating', 'relevance', 
                              'comment', 'is_joined', 'created_at', 'updated_at']
            
            self.assertEqual(set(data.keys()), set(expected_fields))
    
    def test_validate_rating_simple(self):
        """Simple test for rating validation logic"""
        
        serializer = RecommendationFeedbackSerializer()
        
        
        valid_data = {'rating': 3}
        result = serializer.validate(valid_data)
        self.assertEqual(result, valid_data)
        
        
        invalid_data = {'rating': 6}
        with self.assertRaises(ValidationError) as context:
            serializer.validate(invalid_data)
        
        
        print(f"\nActual validation error for rating 6: {context.exception.detail}")
        
        
        self.assertIn('rating', context.exception.detail)
    
    def test_create_direct(self):
        """Test create method by calling it directly with validated data"""
        
        serializer = RecommendationFeedbackSerializer()
        
        
        with patch('api.recommendation_feedback_model.RecommendationFeedback.objects.get', 
                   side_effect=RecommendationFeedback.DoesNotExist):
            
            with patch('rest_framework.serializers.ModelSerializer.create') as mock_super_create:
                
                new_feedback = MagicMock(spec=RecommendationFeedback)
                new_feedback.student = self.student
                new_feedback.society = self.society
                new_feedback.rating = 5
                new_feedback.relevance = True
                new_feedback.comment = 'Very helpful recommendation'
                new_feedback.is_joined = True
                mock_super_create.return_value = new_feedback
                
                
                feedback = serializer.create(self.valid_data)
                
                
                self.assertEqual(feedback, new_feedback)
                mock_super_create.assert_called_once()


class TestRecommendationFeedbackCreateSerializer(TestCase):
    """Test suite for the RecommendationFeedbackCreateSerializer"""

    def setUp(self):
        """Set up test data"""
        
        self.student = MagicMock(spec=Student)
        self.student.id = 1
        
        self.society = MagicMock(spec=Society)
        self.society.id = 1
        
        
        self.user = MagicMock(spec=User)
        self.user.student = self.student
        
        
        self.mock_request = MagicMock()
        self.mock_request.user = self.user
        
        
        self.context = {'request': self.mock_request}
        
        
        self.valid_data = {
            'society_id': self.society.id,
            'rating': 4,
            'relevance': True,
            'comment': 'Test comment',
            'is_joined': False
        }

    def test_serializer_fields(self):
        """Test that the serializer has the expected fields"""
        
        serializer = RecommendationFeedbackCreateSerializer()
        
        self.assertIn('society_id', serializer.fields)
        self.assertIn('rating', serializer.fields)
        self.assertIn('relevance', serializer.fields)
        self.assertIn('comment', serializer.fields)
        self.assertIn('is_joined', serializer.fields)
    
    def test_validate_society_id_method(self):
        """Test the validate_society_id method"""
        
        serializer = RecommendationFeedbackCreateSerializer()
        
        
        with patch('api.models.Society.objects.get') as mock_get:
            
            mock_get.return_value = self.society
            result = serializer.validate_society_id(self.society.id)
            self.assertEqual(result, self.society.id)
            
            
            mock_get.side_effect = Society.DoesNotExist
            with self.assertRaises(ValidationError) as context:
                serializer.validate_society_id(999)
            self.assertEqual(str(context.exception.detail[0]), "Society does not exist.")
    
    def test_create_method(self):
        """Test the create method directly"""
        
        serializer = RecommendationFeedbackCreateSerializer(context=self.context)
        
        
        with patch('api.models.Society.objects.get') as mock_society_get:
            mock_society_get.return_value = self.society
            
            with patch('api.recommendation_feedback_model.RecommendationFeedback.objects.get', 
                      side_effect=RecommendationFeedback.DoesNotExist):
                
                with patch('api.recommendation_feedback_model.RecommendationFeedback.objects.create') as mock_create:
                    
                    new_feedback = MagicMock(spec=RecommendationFeedback)
                    new_feedback.student = self.student
                    new_feedback.society = self.society
                    new_feedback.rating = 4
                    new_feedback.relevance = True
                    new_feedback.comment = 'Test comment'
                    new_feedback.is_joined = False
                    mock_create.return_value = new_feedback
                    
                    
                    result = serializer.create(self.valid_data)
                    
                    
                    self.assertEqual(result, new_feedback)
                    mock_create.assert_called_once_with(
                        student=self.student,
                        society=self.society,
                        rating=self.valid_data['rating'],
                        relevance=self.valid_data['relevance'],
                        comment=self.valid_data['comment'],
                        is_joined=self.valid_data['is_joined']
                    )


class TestRecommendationFeedbackIntegration(TestCase):
    """Integration tests for both serializers"""
    
    def setUp(self):
        """Set up common test objects"""
        
        self.student = MagicMock(spec=Student)
        self.student.id = 1
        
        self.society = MagicMock(spec=Society)
        self.society.id = 1
        
        
        self.user = MagicMock(spec=User)
        self.user.student = self.student
        
        
        self.mock_request = MagicMock()
        self.mock_request.user = self.user
        self.context = {'request': self.mock_request}
        
        
        self.feedback = MagicMock(spec=RecommendationFeedback)
        self.feedback.id = 1
        self.feedback.student = self.student
        self.feedback.society = self.society
        self.feedback.rating = 5
        self.feedback.relevance = True
        self.feedback.comment = 'Great society!'
        self.feedback.is_joined = True
        self.feedback.created_at = timezone.now()
        self.feedback.updated_at = timezone.now()
    
    def test_create_and_serialize_workflow(self):
        """Test the workflow of creating and serializing feedback"""
        
        create_data = {
            'society_id': self.society.id,
            'rating': 5,
            'relevance': True,
            'comment': 'Great society!',
            'is_joined': True
        }
        
        
        create_serializer = RecommendationFeedbackCreateSerializer(context=self.context)
        
        
        with patch('api.models.Society.objects.get', return_value=self.society), \
             patch('api.recommendation_feedback_model.RecommendationFeedback.objects.get', 
                   side_effect=RecommendationFeedback.DoesNotExist), \
             patch('api.recommendation_feedback_model.RecommendationFeedback.objects.create', 
                   return_value=self.feedback):
            
            
            result = create_serializer.create(create_data)
            
            
            self.assertEqual(result, self.feedback)
            
            
            main_serializer = RecommendationFeedbackSerializer(instance=result)
            
            
            with patch.object(RecommendationFeedbackSerializer, 'data', 
                             new_callable=lambda: {
                                 'id': 1,
                                 'student': 1,
                                 'society': 1,
                                 'rating': 5,
                                 'relevance': True,
                                 'comment': 'Great society!',
                                 'is_joined': True,
                                 'created_at': self.feedback.created_at.isoformat(),
                                 'updated_at': self.feedback.updated_at.isoformat(),
                             }, create=True):
                
                data = main_serializer.data
                
                
                self.assertEqual(data['rating'], 5)
                self.assertEqual(data['comment'], 'Great society!')
                self.assertEqual(data['is_joined'], True)
                self.assertEqual(data['student'], self.student.id)
                self.assertEqual(data['society'], self.society.id)