import json
import unittest
from unittest.mock import patch, mock_open
from datetime import datetime, timedelta
from django.test import TestCase

from api.feedback_processor import FeedbackProcessor
from api.models import Society, Student, User

class TestFeedbackProcessor(TestCase):
    def setUp(self):
        """Set up test environment with mocked data and DB entries."""
        self.admin_user = User.objects.create_user(
            username='admin123', 
            email='admin@example.com', 
            password='password',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        
        self.student1 = Student.objects.create(
            username='student1', 
            email='student1@example.com', 
            password='password',
            first_name='Student',
            last_name='One'
        )
        
        self.student2 = Student.objects.create(
            username='student2', 
            email='student2@example.com', 
            password='password',
            first_name='Student',
            last_name='Two'
        )
        
        # Create test societies
        self.tech_society = Society.objects.create(
            name='Tech Society',
            description='A society for tech enthusiasts',
            category='Technology',
            president=self.student1,
            approved_by=self.admin_user,
            tags=['coding', 'software', 'ai']
        )
        
        self.art_society = Society.objects.create(
            name='Art Society',
            description='A society for art lovers',
            category='Arts',
            president=self.student2,
            approved_by=self.admin_user,
            tags=['painting', 'drawing', 'sculpture']
        )
        
        self.music_society = Society.objects.create(
            name='Music Society',
            description='A society for music enthusiasts',
            category='Music',
            president=self.student1,
            approved_by=self.admin_user,
            tags=['instruments', 'vocals', 'performance']
        )
        
        # Create a sample feedback data
        self.sample_feedback_data = {
            'user_feedback': [
                {
                    'student_id': self.student1.id,
                    'society_id': self.tech_society.id,
                    'feedback_type': 'rating',
                    'timestamp': (datetime.now() - timedelta(days=5)).isoformat(),
                    'value': 5
                },
                {
                    'student_id': self.student1.id,
                    'society_id': self.art_society.id,
                    'feedback_type': 'rating',
                    'timestamp': (datetime.now() - timedelta(days=10)).isoformat(),
                    'value': 2
                },
                {
                    'student_id': self.student1.id,
                    'society_id': self.music_society.id,
                    'feedback_type': 'join',
                    'timestamp': (datetime.now() - timedelta(days=2)).isoformat(),
                    'value': None
                }
            ],
            'last_updated': datetime.now().isoformat()
        }
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_initialization(self, mock_file, mock_exists):
        """Test that the FeedbackProcessor initializes correctly."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        
        self.assertIn('rating', processor.weights)
        self.assertIn('join', processor.weights)
        
        self.assertEqual(processor._preference_adjustments, {})
        self.assertIsNone(processor._cache_last_updated)
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_load_feedback_data_file_exists(self, mock_file, mock_exists):
        """Test loading feedback data when file exists."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        data = processor.feedback_data
        
        self.assertEqual(len(data['user_feedback']), 3)
        self.assertIn('last_updated', data)
    
    @patch('os.path.exists')
    def test_load_feedback_data_file_not_exists(self, mock_exists):
        """Test loading feedback data when file doesn't exist."""
        mock_exists.return_value = False
        
        processor = FeedbackProcessor()
        data = processor.feedback_data
        
        self.assertEqual(data['user_feedback'], [])
        self.assertIsNone(data['last_updated'])
    
    @patch('os.path.exists')
    @patch('builtins.open')
    def test_load_feedback_data_json_error(self, mock_file, mock_exists):
        """Test loading feedback data with JSON parsing error."""
        mock_exists.return_value = True
        mock_file.return_value.__enter__.return_value.read.return_value = 'invalid json'
        
        processor = FeedbackProcessor()
        data = processor.feedback_data
        self.assertEqual(data['user_feedback'], [])
        self.assertIsNone(data['last_updated'])
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    @patch('os.makedirs')
    def test_save_feedback_data(self, mock_makedirs, mock_file, mock_exists):
        """Test saving feedback data to file."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        mock_file.reset_mock()
        
        processor.record_feedback(
            student_id=self.student1.id,
            society_id=self.tech_society.id,
            feedback_type='rating',
            value=4
        )
        
        mock_makedirs.assert_called_once()
        mock_file.assert_called()
        write_handle = mock_file()
        self.assertTrue(write_handle.write.called)
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_record_feedback_valid(self, mock_file, mock_exists):
        """Test recording valid feedback."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        original_count = len(processor.feedback_data['user_feedback'])
        
        mock_file.reset_mock()
        result = processor.record_feedback(
            student_id=self.student2.id,
            society_id=self.tech_society.id,
            feedback_type='rating',
            value=4,
            metadata={'source': 'test'}
        )
        
        self.assertTrue(result)
        self.assertEqual(len(processor.feedback_data['user_feedback']), original_count + 1)
        
        # Check the content of the recorded feedback
        new_feedback = processor.feedback_data['user_feedback'][-1]
        self.assertEqual(new_feedback['student_id'], self.student2.id)
        self.assertEqual(new_feedback['society_id'], self.tech_society.id)
        self.assertEqual(new_feedback['feedback_type'], 'rating')
        self.assertEqual(new_feedback['value'], 4)
        self.assertEqual(new_feedback['metadata'], {'source': 'test'})
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_record_feedback_invalid_type(self, mock_file, mock_exists):
        """Test recording feedback with invalid type."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        original_count = len(processor.feedback_data['user_feedback'])
        
        mock_file.reset_mock()
        
        result = processor.record_feedback(
            student_id=self.student1.id,
            society_id=self.tech_society.id,
            feedback_type='invalid_type',
            value=5
        )
        
        # Check that feedback was not recorded
        self.assertFalse(result)
        self.assertEqual(len(processor.feedback_data['user_feedback']), original_count)
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_get_preference_adjustments_no_feedback(self, mock_file, mock_exists):
        """Test getting preference adjustments for a student with no feedback."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        
        # Create a new student with no feedback
        new_student = Student.objects.create(
            username='newstudent', 
            email='new@example.com', 
            password='password',
            first_name='New',
            last_name='Student'
        )
        
        adjustments = processor.get_preference_adjustments(new_student.id)
        
        self.assertEqual(adjustments['categories'], {})
        self.assertEqual(adjustments['tags'], {})
        self.assertEqual(adjustments['societies'], {})
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_get_preference_adjustments_with_feedback(self, mock_file, mock_exists):
        """Test getting preference adjustments for a student with feedback."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        adjustments = processor.get_preference_adjustments(self.student1.id)
        
        self.assertIn('categories', adjustments)
        self.assertIn('tags', adjustments)
        self.assertIn('societies', adjustments)
        
        self.assertIn(self.tech_society.id, adjustments['societies'])
        self.assertIn(self.art_society.id, adjustments['societies'])
        self.assertIn(self.music_society.id, adjustments['societies'])
        
        self.assertIn('Technology', adjustments['categories'])
        self.assertIn('Arts', adjustments['categories'])
        self.assertIn('Music', adjustments['categories'])
        
        for tag in self.tech_society.tags:
            self.assertIn(tag, adjustments['tags'])
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_get_preference_adjustments_caching(self, mock_file, mock_exists):
        """Test that preference adjustments are cached."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        
        adjustments1 = processor.get_preference_adjustments(self.student1.id)
        self.assertIn(self.student1.id, processor._preference_adjustments)
        self.assertIsNotNone(processor._cache_last_updated)
        
        mock_file.return_value.read.side_effect = Exception("Should not be called")
        adjustments2 = processor.get_preference_adjustments(self.student1.id)
        self.assertEqual(adjustments1, adjustments2)
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_apply_feedback_adjustments(self, mock_file, mock_exists):
        """Test applying feedback adjustments to society scores."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        
        society_scores = [
            {'society': self.tech_society, 'score': 0.8},
            {'society': self.art_society, 'score': 0.7},
            {'society': self.music_society, 'score': 0.9}
        ]
        
        adjusted_scores = processor.apply_feedback_adjustments(self.student1.id, society_scores)
        self.assertEqual(len(adjusted_scores), 3)
        for item in adjusted_scores:
            self.assertIn('feedback_adjustment', item)
        
        # Tech society should have positive adjustment (rating 5)
        tech_item = next(item for item in adjusted_scores if item['society'] == self.tech_society)
        self.assertGreaterEqual(tech_item['score'], 0.8)
        
        # Art society should have negative adjustment (rating 2)
        art_item = next(item for item in adjusted_scores if item['society'] == self.art_society)
        self.assertLessEqual(art_item['score'], 0.7)
        
        # Music society should have positive adjustment (join action)
        music_item = next(item for item in adjusted_scores if item['society'] == self.music_society)
        self.assertGreaterEqual(music_item['score'], 0.9)
    
    @patch('os.path.exists')
    @patch('builtins.open', new_callable=mock_open)
    def test_apply_feedback_adjustments_no_feedback(self, mock_file, mock_exists):
        """Test applying feedback adjustments when there is no feedback."""
        mock_exists.return_value = True
        mock_file.return_value.read.return_value = json.dumps(self.sample_feedback_data)
        
        processor = FeedbackProcessor()
        
        new_student = Student.objects.create(
            username='newstudent2', 
            email='new2@example.com', 
            password='password',
            first_name='New',
            last_name='Student2'
        )
        
        original_scores = [
            {'society': self.tech_society, 'score': 0.8},
            {'society': self.art_society, 'score': 0.7}
        ]
        
        society_scores = [dict(item) for item in original_scores]
        adjusted_scores = processor.apply_feedback_adjustments(new_student.id, society_scores)
        for i, item in enumerate(adjusted_scores):
            self.assertEqual(item['score'], original_scores[i]['score'])

if __name__ == '__main__':
    unittest.main()