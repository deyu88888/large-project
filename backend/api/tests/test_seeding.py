from unittest.mock import patch
from django.test import TransactionTestCase
from api.models import Admin, Student, Society, Event, Notification, EventRequest, SocietyRequest, Award, AwardStudent
from api.management.commands import seed

class SeedingTestCase(TransactionTestCase):
    """Unit test for the seed Command"""
    def setUp(self):
        """
        This simulates the seeding process, ensuring the data is created as expected.
        """

        self.admin = Admin.objects.create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            password="adminpassword"
        )

        self.student = Student.objects.create(
            username="student_user",
            email="student@example.com",
            first_name="Student",
            last_name="User",
            password="studentpassword",
            major="Computer Science"
        )

        self.president = Student.objects.create(
            username="president_user",
            email="president@example.com",
            first_name="President",
            last_name="User",
            password="presidentpassword",
            major="Mechanical Engineering"
        )

        self.society = Society.objects.create(
            name="Robotics Club",
            leader=self.president,
            approved_by=self.admin
        )

        self.society.society_members.add(self.student)

        self.event = Event.objects.create(
            title='Day',
            description='Day out',
            hosted_by=self.society,
            location='KCL Campus',
        )

        self.president.president_of.add(self.society)

        self.command_instance = seed.Command()

    def test_admin_exists(self):
        """Test if the admin user was correctly seeded."""
        admin = Admin.objects.get(username="admin_user")
        self.assertEqual(admin.email, "admin@example.com")
        self.assertEqual(admin.first_name, "Admin")
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

    def test_student_exists(self):
        """Test if the regular student was correctly seeded."""
        student = Student.objects.get(username="student_user")
        self.assertEqual(student.email, "student@example.com")
        self.assertEqual(student.major, "Computer Science")
        self.assertFalse(student.is_president)

    def test_president_exists_and_is_president(self):
        """Test if the president user was correctly seeded and is marked as a president."""
        president = Student.objects.get(username="president_user")
        self.assertEqual(president.email, "president@example.com")
        self.assertEqual(president.major, "Mechanical Engineering")
        self.assertTrue(president.is_president)

    def test_society_exists_and_relationships(self):
        """Test if the society was created and linked correctly."""
        society = Society.objects.get(name="Robotics Club")
        self.assertEqual(society.leader, self.president)
        self.assertEqual(society.approved_by, self.admin)
        self.assertIn(self.president, society.presidents.all())

    @patch('builtins.print') # Avoids printing while testing
    def test_student_creation(self, mock_print):
        """Test that seed create_student works"""
        self.command_instance.create_student(1)
        self.assertEqual(Student.objects.count(), 3)

    @patch('builtins.print') # Avoids printing while testing
    def test_admin_creation(self, mock_print):
        """Test that seed create_admin works"""
        self.command_instance.create_admin(1)
        self.assertTrue(Admin.objects.get(username="admin1"))
        self.assertEqual(Admin.objects.count(), 2)

    @patch('builtins.print') # Avoids printing while testing
    def test_society_creation(self, mock_print):
        """Test that seed create_society works"""
        self.command_instance.create_society(1)
        self.assertEqual(
            first=Society.objects.count() + SocietyRequest.objects.count(),
            second=2
        )

    @patch('builtins.print') # Avoids printing while testing
    def test_event_creation(self, mock_print):
        """Test that seed create_event works"""
        self.command_instance.create_event(1)
        self.assertEqual(
            first=Event.objects.count() + EventRequest.objects.count(),
            second=2
        )

    @patch('builtins.print') # Avoids printing while testing
    def test_notification_creation(self, mock_print):
        """Test that seed create_event_notification works"""
        self.command_instance.create_event_notification(self.event)
        self.assertTrue(
            Notification.objects.filter(
                for_event=self.event,
                for_student=self.student,
            ).exists()
        )

    @patch('builtins.print') # Avoids printing while testing
    def test_award_initialisation(self, mock_print):
        """Test that seed create_student works"""
        self.command_instance.pre_define_awards()
        self.assertEqual(Award.objects.count(), 9)

    @patch('builtins.print') # Avoids printing while testing
    def test_award_student_creation(self, mock_print):
        """Test that seed create_student works"""
        self.command_instance.pre_define_awards()
        self.command_instance.randomly_assign_awards(1)
        self.assertEqual(AwardStudent.objects.count(), 1)
