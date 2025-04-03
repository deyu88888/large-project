from django.test import TestCase
from django.core.management import call_command
from io import StringIO
from api.models import Society, Student
from unittest.mock import patch
import random
import numpy as np


class GenerateEvaluationDataTest(TestCase):
    """Tests for the generate_evaluation_data management command."""

    def setUp(self):
        """Set up test environment."""
        random.seed(42)
        np.random.seed(42)
        
        self.out = StringIO()

    @patch('api.models.Society.full_clean')
    def test_create_societies(self, mock_full_clean):
        """Test that societies are created correctly."""
        mock_full_clean.return_value = None
        
        call_command('generate_evaluation_data', societies=5, students=0, stdout=self.out)
        
        societies = Society.objects.filter(name__startswith='TestSoc_')
        self.assertEqual(societies.count(), 5)
        
        for society in societies:
            self.assertTrue(society.name.startswith('TestSoc_'))
            self.assertIsNotNone(society.description)
            self.assertIn(society.category, [
                'Academic', 'Sports', 'Arts', 'Technology', 
                'Social', 'Cultural', 'Gaming'
            ])
            self.assertEqual(society.status, "Approved")
            self.assertTrue(len(society.tags) > 0)
    
    def test_create_students(self):
        """Test that students are created correctly."""
        call_command('generate_evaluation_data', societies=0, students=5, stdout=self.out)
        
        students = Student.objects.filter(username__startswith='test_eval_')
        self.assertEqual(students.count(), 5)
        
        for student in students:
            self.assertTrue(student.username.startswith('test_eval_'))
            self.assertTrue(student.email.endswith('@example.com'))
            self.assertIsNotNone(student.first_name)
            self.assertIsNotNone(student.last_name)
            self.assertIn(student.major, [
                'Computer Science', 'Engineering', 'Business', 'Arts', 
                'Sciences', 'Humanities', 'Medicine', 'Law', 'Education', 'Other'
            ])
            self.assertEqual(student.status, "Approved")
    
    @patch('api.models.Society.full_clean')
    def test_generate_memberships(self, mock_full_clean):
        """Test that memberships between students and societies are generated."""
        mock_full_clean.return_value = None
        
        call_command('generate_evaluation_data', societies=10, students=20, stdout=self.out)
        
        students = Student.objects.filter(username__startswith='test_eval_')
        societies = Society.objects.filter(name__startswith='TestSoc_')
        
        total_memberships = sum(student.societies.count() for student in students)
        
        self.assertGreater(total_memberships, 0)
        
        self.assertLess(total_memberships, students.count() * societies.count())
    
    @patch('api.models.Society.full_clean')
    def test_clear_existing_data(self, mock_full_clean):
        """Test that the --clear flag removes existing test data."""
        mock_full_clean.return_value = None
        
        call_command('generate_evaluation_data', societies=3, students=5, stdout=self.out)
        
        self.assertEqual(Society.objects.filter(name__startswith='TestSoc_').count(), 3)
        self.assertEqual(Student.objects.filter(username__startswith='test_eval_').count(), 5)
        
        call_command('generate_evaluation_data', societies=2, students=4, clear=True, stdout=self.out)
        
        self.assertEqual(Society.objects.filter(name__startswith='TestSoc_').count(), 2)
        self.assertEqual(Student.objects.filter(username__startswith='test_eval_').count(), 4)
    
    @patch('api.models.Society.full_clean')
    def test_membership_distribution(self, mock_full_clean):
        """Test that the membership distribution follows expected patterns."""
        mock_full_clean.return_value = None
        
        call_command('generate_evaluation_data', societies=15, students=30, stdout=self.out)
        
        students = Student.objects.filter(username__startswith='test_eval_')
        
        membership_counts = [student.societies.count() for student in students]
        avg_memberships = sum(membership_counts) / len(membership_counts)
        
        self.assertGreater(avg_memberships, 0.5)
        self.assertLess(avg_memberships, 10)
        
        self.assertGreater(len(set(membership_counts)), 1)
    
    @patch('api.models.Society.full_clean')
    def test_category_major_correlation(self, mock_full_clean):
        """Test that there's correlation between student majors and society categories."""
        mock_full_clean.return_value = None
        
        expected_relationships = {
            'Computer Science': ['Technology', 'Academic'],
            'Engineering': ['Technology', 'Academic'],
            'Arts': ['Arts', 'Cultural'],
            'Business': ['Social', 'Academic'],
        }
        
        call_command('generate_evaluation_data', societies=20, students=50, stdout=self.out)
        
        for major, categories in expected_relationships.items():
            major_students = Student.objects.filter(
                username__startswith='test_eval_',
                major=major
            )
            
            if not major_students.exists():
                continue
                
            related_memberships = 0
            total_memberships = 0
            
            for student in major_students:
                student_societies = student.societies.all()
                total_memberships += student_societies.count()
                
                for society in student_societies:
                    if society.category in categories:
                        related_memberships += 1
            
            if total_memberships == 0:
                continue
                
            related_percentage = related_memberships / total_memberships
            
            self.assertGreater(related_percentage, 0.3)
    
    @patch('api.models.Society.full_clean')
    def test_reproducibility(self, mock_full_clean):
        """Test that using the same seed produces the same results."""
        mock_full_clean.return_value = None
        
        call_command('generate_evaluation_data', societies=5, students=10, clear=True, stdout=self.out)
        
        first_students = list(Student.objects.filter(username__startswith='test_eval_').values_list('username', 'major'))
        first_societies = list(Society.objects.filter(name__startswith='TestSoc_').values_list('name', 'category'))
        
        call_command('generate_evaluation_data', societies=5, students=10, clear=True, stdout=self.out)
        
        second_students = list(Student.objects.filter(username__startswith='test_eval_').values_list('username', 'major'))
        second_societies = list(Society.objects.filter(name__startswith='TestSoc_').values_list('name', 'category'))
        
        self.assertEqual(first_students, second_students)
        self.assertEqual(first_societies, second_societies)