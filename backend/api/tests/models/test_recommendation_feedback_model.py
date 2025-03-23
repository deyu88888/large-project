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
        # Create admin user for approving societies
        self.admin_user = User.objects.create_user(
            username="testadmin",
            email="admin@example.com",
            password="adminpassword",
            first_name="Admin",
            last_name="User",
            role="admin",
            is_staff=True
        )
        
        # Create student
        self.student = Student.objects.create(
            username="teststudent",
            email="student@example.com",
            password="studentpassword",
            first_name="Student",
            last_name="Test",
            role="student"
        )
        
        # Create different student for uniqueness constraint tests
        self.student2 = Student.objects.create(
            username="teststudent2",
            email="student2@example.com",
            password="studentpassword",
            first_name="Student",
            last_name="Two",
            role="student"
        )
        
        # Create society with required fields
        # First, disable full_clean in Society.save to avoid validation during testing
        original_save = Society.save
        
        def patched_save(instance, *args, **kwargs):
            # Skip full_clean validation for testing
            if 'force_insert' in kwargs:
                kwargs.pop('force_insert')
            instance.save_base(*args, **kwargs)
        
        # Apply the patch for society creation
        Society.save = patched_save
        
        # Create the societies
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
        
        # Restore the original save method
        Society.save = original_save
        
        # Society2 is now created in the patched section above

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
        
        # Check timestamps are set
        self.assertIsNotNone(feedback.created_at)
        self.assertIsNotNone(feedback.updated_at)
        
        # Check that created_at and updated_at are close to now
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
        # Create first feedback
        RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=4
        )
        
        # Try to create another feedback for the same student-society pair
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    student=self.student,
                    society=self.society,
                    rating=5
                )
        
        # However, same student can give feedback to a different society
        feedback2 = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society2,
            rating=3
        )
        self.assertEqual(feedback2.society, self.society2)
        
        # And different student can give feedback to the same society
        feedback3 = RecommendationFeedback.objects.create(
            student=self.student2,
            society=self.society,
            rating=2
        )
        self.assertEqual(feedback3.student, self.student2)

    def test_rating_validators(self):
        """Test that rating must be between 1 and 5."""
        # Test rating below minimum
        with self.assertRaises(ValidationError):
            feedback = RecommendationFeedback(
                student=self.student,
                society=self.society,
                rating=0
            )
            feedback.full_clean()
        
        # Test rating above maximum
        with self.assertRaises(ValidationError):
            feedback = RecommendationFeedback(
                student=self.student,
                society=self.society,
                rating=6
            )
            feedback.full_clean()
        
        # Test valid ratings
        for rating in range(1, 6):
            feedback = RecommendationFeedback(
                student=self.student2,
                society=self.society2,
                rating=rating
            )
            # This should not raise an exception
            feedback.full_clean()
            # We don't save to avoid unique constraint issues

    def test_relevance_choices(self):
        """Test that relevance values conform to the choices."""
        # Test valid relevance values (1-5)
        for relevance_value in range(1, 6):
            feedback = RecommendationFeedback(
                student=self.student,
                society=self.society,
                rating=3,
                relevance=relevance_value
            )
            # Should not raise validation error
            feedback.full_clean()
            
        # Test invalid relevance value
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
        
        # Test default values
        self.assertEqual(feedback.relevance, 3)  # Default value should be 3
        self.assertFalse(feedback.is_joined)  # Default value should be False
        self.assertIsNone(feedback.comment)  # Default should be None for null=True fields

    def test_update_feedback(self):
        """Test updating an existing feedback."""
        # Create feedback
        feedback = RecommendationFeedback.objects.create(
            student=self.student,
            society=self.society,
            rating=3,
            comment="Initial comment"
        )
        
        # Record the creation timestamp
        creation_time = feedback.created_at
        
        # Wait a short time to ensure timestamps differ
        import time
        time.sleep(0.1)
        
        # Update the feedback
        feedback.rating = 5
        feedback.relevance = 5
        feedback.comment = "Updated comment"
        feedback.is_joined = True
        feedback.save()
        
        # Refresh from database
        feedback.refresh_from_db()
        
        # Check updated values
        self.assertEqual(feedback.rating, 5)
        self.assertEqual(feedback.relevance, 5)
        self.assertEqual(feedback.comment, "Updated comment")
        self.assertTrue(feedback.is_joined)
        
        # created_at should not change, but updated_at should
        self.assertEqual(feedback.created_at, creation_time)
        self.assertGreater(feedback.updated_at, creation_time)

    def test_delete_related_objects(self):
        """Test cascade deletion when related objects are deleted."""
        # Create a new student that won't affect society relationships
        test_student = Student.objects.create(
            username="deletable_student",
            email="deletable@example.com",
            password="password",
            first_name="Delete",
            last_name="Me",
            role="student"
        )
        
        # Create a new society that won't cause cascading issues
        test_society = Society.objects.create(
            name="Deletable Society",
            description="A society for testing deletion",
            president=self.student2,  # Use student2 who will not be deleted in this test
            approved_by=self.admin_user,
            status="Approved"
        )
        
        # Create feedback with the test student
        feedback = RecommendationFeedback.objects.create(
            student=test_student,
            society=test_society,
            rating=4
        )
        
        feedback_id = feedback.id
        
        # Delete the student and verify the feedback is deleted
        test_student.delete()
        with self.assertRaises(RecommendationFeedback.DoesNotExist):
            RecommendationFeedback.objects.get(id=feedback_id)
        
        # Create another feedback with a different student
        feedback2 = RecommendationFeedback.objects.create(
            student=self.student2,
            society=test_society,
            rating=3
        )
        
        feedback2_id = feedback2.id
        
        # Delete the society and verify the feedback is deleted
        test_society.delete()
        with self.assertRaises(RecommendationFeedback.DoesNotExist):
            RecommendationFeedback.objects.get(id=feedback2_id)

    def test_bulk_creation(self):
        """Test bulk creation of feedback records."""
        # Prepare a list of feedback objects
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
        
        # Bulk create the records
        RecommendationFeedback.objects.bulk_create(feedback_list)
        
        # Verify all records were created
        self.assertEqual(RecommendationFeedback.objects.count(), 3)
        
        # Check specific record
        feedback = RecommendationFeedback.objects.get(student=self.student2, society=self.society2)
        self.assertEqual(feedback.rating, 3)
        self.assertEqual(feedback.relevance, 3)

    def test_filtering_and_querying(self):
        """Test filtering and querying on the model."""
        # Create several feedback records
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
        
        # Test filtering by student
        student_feedbacks = RecommendationFeedback.objects.filter(student=self.student)
        self.assertEqual(student_feedbacks.count(), 2)
        
        # Test filtering by society
        society_feedbacks = RecommendationFeedback.objects.filter(society=self.society)
        self.assertEqual(society_feedbacks.count(), 2)
        
        # Test filtering by rating
        high_ratings = RecommendationFeedback.objects.filter(rating__gte=4)
        self.assertEqual(high_ratings.count(), 2)
        
        # Test filtering by is_joined
        joined_feedbacks = RecommendationFeedback.objects.filter(is_joined=True)
        self.assertEqual(joined_feedbacks.count(), 2)
        
        # Test combined filters
        specific_feedbacks = RecommendationFeedback.objects.filter(
            student=self.student,
            rating__gte=4
        )
        self.assertEqual(specific_feedbacks.count(), 1)

    def test_required_fields(self):
        """Test that required fields cannot be null."""
        # Test missing student
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    society=self.society,
                    rating=4
                )
        
        # Test missing society
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    student=self.student,
                    rating=4
                )
        
        # Test missing rating
        with self.assertRaises(IntegrityError):
            with transaction.atomic():
                RecommendationFeedback.objects.create(
                    student=self.student,
                    society=self.society
                )