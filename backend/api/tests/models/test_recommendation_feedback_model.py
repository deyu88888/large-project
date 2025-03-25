import datetime
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.db.utils import IntegrityError
from django.utils import timezone
from django.db import transaction

from api.models import Student, Society, User
from api.recommendation_feedback_model import RecommendationFeedback


class RecommendationFeedbackModelTests(TestCase):
    """Test cases for the RecommendationFeedback model."""

    def setUp(self):
        """Create test data for all tests."""
        
        self.admin_user = User.objects.create_user(
            username="testadmin",
            email="admin@example.com",
            password="adminpassword",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_staff=True
        )
        
        
        self.student = Student.objects.create(
            username="teststudent",
            email="student@example.com",
            password="studentpassword",
            first_name="Student",
            last_name="Test",
            role="student"
        )
        
        
        self.student2 = Student.objects.create(
            username="teststudent2",
            email="student2@example.com",
            password="studentpassword",
            first_name="Student",
            last_name="Two",
            role="student"
        )
        
        
        
        original_save = Society.save
        
        def patched_save(instance, *args, **kwargs):
            
            if 'force_insert' in kwargs:
                kwargs.pop('force_insert')
            instance.save_base(*args, **kwargs)
        
        
        Society.save = patched_save
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society for testing",
            president=self.student,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        self.society2 = Society.objects.create(
            name="Another Society",
            description="Another test society",
            president=self.student,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        Society.save = original_save
        
        

    def test_create_recommendation_feedback(self):
        """Test that a recommendation feedback can be created with valid data."""
        feedback = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=4,
            relevance=3,
            comment="This was a good recommendation",
            is_joined=True
        )
        
        self.assertEqual(feedback.student, self.student)
        self.assertEqual(feedback.society, self.society)
        self.assertEqual(feedback.rating, 4)
        self.assertEqual(feedback.relevance, 3)
        self.assertEqual(feedback.comment, "This was a good recommendation")
        self.assertTrue(feedback.is_joined)
        
        
        self.assertIsNotNone(feedback.created_at)
        self.assertIsNotNone(feedback.updated_at)
        
        
        now = timezone.now()
        self.assertLess(abs(feedback.created_at - now), datetime.timedelta(seconds=10))
        self.assertLess(abs(feedback.updated_at - now), datetime.timedelta(seconds=10))

    def test_string_representation(self):
        """Test the string representation of the model."""
        feedback = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=5
        )
        
        expected_string = f"{self.student.username} - {self.society.name} - 5★"
        self.assertEqual(str(feedback), expected_string)

    def test_unique_together_constraint(self):
        """Test that a student cannot give multiple feedbacks for the same society."""
        
        RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=4
        )
        
        
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    student=self.student,
                    society=self.society,
                    rating=5
                )
        
        
        feedback2 = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society2,
            rating=3
        )
        self.assertEqual(feedback2.society, self.society2)
        
        
        feedback3 = RecommendationFeedback.objects.create(
            student=self.student2,
            society=self.society,
            rating=2
        )
        self.assertEqual(feedback3.student, self.student2)

    def test_rating_validators(self):
        """Test that rating must be between 1 and 5."""
        
        with self.assertRaises(ValidationError):
            feedback = RecommendationFeedback(
                student=self.student,
                society=self.society,
                rating=0
            )
            feedback.full_clean()
        
        
        with self.assertRaises(ValidationError):
            feedback = RecommendationFeedback(
                student=self.student,
                society=self.society,
                rating=6
            )
            feedback.full_clean()
        
        
        for rating in range(1, 6):
            feedback = RecommendationFeedback(
                student=self.student2,
                society=self.society2,
                rating=rating
            )
            
            feedback.full_clean()
            

    def test_relevance_choices(self):
        """Test that relevance values conform to the choices."""
        
        for relevance_value in range(1, 6):
            feedback = RecommendationFeedback(
                student=self.student,
                society=self.society,
                rating=3,
                relevance=relevance_value
            )
            
            feedback.full_clean()
            
        
        with self.assertRaises(ValidationError):
            feedback = RecommendationFeedback(
                student=self.student,
                society=self.society,
                rating=3,
                relevance=6
            )
            feedback.full_clean()

    def test_default_values(self):
        """Test that default values are set correctly."""
        feedback = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society2,
            rating=4
        )
        
        
        self.assertEqual(feedback.relevance, 3)  
        self.assertFalse(feedback.is_joined)  
        self.assertIsNone(feedback.comment)  

    def test_update_feedback(self):
        """Test updating an existing feedback."""
        
        feedback = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=3,
            comment="Initial comment"
        )
        
        
        creation_time = feedback.created_at
        
        
        import time
        time.sleep(0.1)
        
        
        feedback.rating = 5
        feedback.relevance = 5
        feedback.comment = "Updated comment"
        feedback.is_joined = True
        feedback.save()
        
        
        feedback.refresh_from_db()
        
        
        self.assertEqual(feedback.rating, 5)
        self.assertEqual(feedback.relevance, 5)
        self.assertEqual(feedback.comment, "Updated comment")
        self.assertTrue(feedback.is_joined)
        
        
        self.assertEqual(feedback.created_at, creation_time)
        self.assertGreater(feedback.updated_at, creation_time)

    def test_delete_related_objects(self):
        """Test cascade deletion when related objects are deleted."""
        
        test_student = Student.objects.create(
            username="deletable_student",
            email="deletable@example.com",
            password="password",
            first_name="Delete",
            last_name="Me",
            role="student"
        )
        
        
        test_society = Society.objects.create(
            name="Deletable Society",
            description="A society for testing deletion",
            president=self.student2,  
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        feedback = RecommendationFeedback.objects.create(
            student=test_student,
            society=test_society,
            rating=4
        )
        
        feedback_id = feedback.id
        
        
        test_student.delete()
        with self.assertRaises(RecommendationFeedback.DoesNotExist):
            RecommendationFeedback.objects.get(id=feedback_id)
        
        
        feedback2 = RecommendationFeedback.objects.create(
            student=self.student2,
            society=test_society,
            rating=3
        )
        
        feedback2_id = feedback2.id
        
        
        test_society.delete()
        with self.assertRaises(RecommendationFeedback.DoesNotExist):
            RecommendationFeedback.objects.get(id=feedback2_id)

    def test_bulk_creation(self):
        """Test bulk creation of feedback records."""
        
        feedback_list = [
            RecommendationFeedback(
                student=self.student, 
                society=self.society2, 
                rating=5, 
                relevance=5
            ),
            RecommendationFeedback(
                student=self.student2, 
                society=self.society, 
                rating=4, 
                relevance=4
            ),
            RecommendationFeedback(
                student=self.student2, 
                society=self.society2, 
                rating=3, 
                relevance=3
            )
        ]
        
        
        RecommendationFeedback.objects.bulk_create(feedback_list)
        
        
        self.assertEqual(RecommendationFeedback.objects.count(), 3)
        
        
        feedback = RecommendationFeedback.objects.get(student=self.student2, society=self.society2)
        self.assertEqual(feedback.rating, 3)
        self.assertEqual(feedback.relevance, 3)

    def test_filtering_and_querying(self):
        """Test filtering and querying on the model."""
        
        RecommendationFeedback.objects.create(
            student=self.student, 
            society=self.society, 
            rating=5,
            is_joined=True
        )
        
        RecommendationFeedback.objects.create(
            student=self.student, 
            society=self.society2, 
            rating=3,
            is_joined=False
        )
        
        RecommendationFeedback.objects.create(
            student=self.student2, 
            society=self.society, 
            rating=4,
            is_joined=True
        )
        
        
        student_feedbacks = RecommendationFeedback.objects.filter(student=self.student)
        self.assertEqual(student_feedbacks.count(), 2)
        
        
        society_feedbacks = RecommendationFeedback.objects.filter(society=self.society)
        self.assertEqual(society_feedbacks.count(), 2)
        
        
        high_ratings = RecommendationFeedback.objects.filter(rating__gte=4)
        self.assertEqual(high_ratings.count(), 2)
        
        
        joined_feedbacks = RecommendationFeedback.objects.filter(is_joined=True)
        self.assertEqual(joined_feedbacks.count(), 2)
        
        
        specific_feedbacks = RecommendationFeedback.objects.filter(
            student=self.student,
            rating__gte=4
        )
        self.assertEqual(specific_feedbacks.count(), 1)

    def test_required_fields(self):
        """Test that required fields cannot be null."""
        
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    society=self.society,
                    rating=4
                )
        
        
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    student=self.student,
                    rating=4
                )
        
        
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    student=self.student,
                    society=self.society
                )