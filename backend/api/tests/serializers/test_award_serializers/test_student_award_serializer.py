from django.test import TestCase
from django.contrib.auth.hashers import make_password
from rest_framework.test import APIRequestFactory
import uuid
from django.utils import timezone
import datetime

from api.models import Student, Award, AwardStudent
from api.serializers import StudentAwardSerializer, AwardStudentSerializer


class StudentAwardSerializerTestCase(TestCase):
    """Tests for the StudentAwardSerializer."""

    def setUp(self):
        """Set up test data for each test."""
        self.student = Student.objects.create(
            username=f"testuser_{uuid.uuid4().hex[:8]}",
            email=f"test_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="Test",
            last_name="User",
            major="Computer Science"
        )

        # Create some awards
        self.bronze_award = Award.objects.create(
            rank="Bronze",
            title="Participation Award",
            description="Awarded for participation in society events"
        )
        
        self.silver_award = Award.objects.create(
            rank="Silver",
            title="Achievement Award",
            description="Awarded for significant contributions to a society"
        )
        
        self.gold_award = Award.objects.create(
            rank="Gold",
            title="Excellence Award",
            description="Awarded for exceptional leadership in a society"
        )
        
        # Assign awards to the student
        self.award_student1 = AwardStudent.objects.create(
            student=self.student,
            award=self.bronze_award
        )
        
        self.award_student2 = AwardStudent.objects.create(
            student=self.student,
            award=self.silver_award
        )
        
        self.factory = APIRequestFactory()
        self.request = self.factory.get('/')

    def test_relationship_exists(self):
        """Test that the student-award relationship works correctly."""
        self.assertEqual(self.student.award_students.count(), 2)
        
        award_ids = set(award_student.award.id for award_student in self.student.award_students.all())
        self.assertEqual(len(award_ids), 2)
        self.assertIn(self.bronze_award.id, award_ids)
        self.assertIn(self.silver_award.id, award_ids)
    
    def test_student_can_get_awards(self):
        """Test that a student can access their awards through the relationship."""
        awards = [award_student.award for award_student in self.student.award_students.all()]
        self.assertEqual(len(awards), 2)
        
        award_titles = [award.title for award in awards]
        self.assertIn(self.bronze_award.title, award_titles)
        self.assertIn(self.silver_award.title, award_titles)
    
    def test_model_str_methods(self):
        """Test the string representation of the models."""
        self.assertEqual(str(self.bronze_award), f"{self.bronze_award.title}, {self.bronze_award.rank}")
        self.assertIn(str(self.student), str(self.award_student1))
        self.assertIn(str(self.bronze_award), str(self.award_student1))
    
    def test_award_can_be_assigned_and_removed(self):
        """Test that awards can be assigned to and removed from students."""
        new_award = Award.objects.create(
            rank="Gold",
            title="Special Award",
            description="A special award for testing"
        )
        
        # Assign the award to the student
        award_student = AwardStudent.objects.create(
            student=self.student,
            award=new_award
        )
        
        self.assertEqual(self.student.award_students.count(), 3)  
        award_student.delete()
        self.assertEqual(self.student.award_students.count(), 2)
    
    def test_student_with_no_awards(self):
        """Test handling of a student with no awards."""
        new_student = Student.objects.create(
            username=f"newuser_{uuid.uuid4().hex[:8]}",
            email=f"new_{uuid.uuid4().hex[:8]}@example.com",
            password=make_password("password123"),
            first_name="New",
            last_name="User",
            major="Physics"
        )
        
        self.assertEqual(new_student.award_students.count(), 0)
    
    def test_award_ordering_by_date(self):
        """Test that awards can be ordered by award date."""
        self.student.award_students.all().delete()
        now = timezone.now()
        
        # Create first award (oldest)
        award_student1 = AwardStudent.objects.create(
            student=self.student,
            award=self.bronze_award
        )
        oldest_time = now - datetime.timedelta(days=30)
        AwardStudent.objects.filter(pk=award_student1.pk).update(awarded_at=oldest_time)
        
        # Create second award (middle)
        award_student2 = AwardStudent.objects.create(
            student=self.student,
            award=self.silver_award
        )
        middle_time = now - datetime.timedelta(days=15)
        AwardStudent.objects.filter(pk=award_student2.pk).update(awarded_at=middle_time)
        
        # Create third award (newest)
        award_student3 = AwardStudent.objects.create(
            student=self.student,
            award=self.gold_award
        )
        award_students = self.student.award_students.order_by('-awarded_at')
        self.assertEqual(award_students[0].award.id, self.gold_award.id)  # Newest
        self.assertEqual(award_students[1].award.id, self.silver_award.id)  # Middle
        self.assertEqual(award_students[2].award.id, self.bronze_award.id)  # Oldest
    
    def tearDown(self):
        """Clean up after each test."""
        AwardStudent.objects.all().delete()
        Award.objects.all().delete()
        Student.objects.all().delete()