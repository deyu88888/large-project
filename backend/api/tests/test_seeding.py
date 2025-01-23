from django.test import TestCase
from api.models import Admin, Advisor, Student, Society

class SeedingTestCase(TestCase):
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

        self.advisor = Advisor.objects.create(
            username="advisor_user",
            email="advisor@example.com",
            first_name="Advisor",
            last_name="User",
            password="advisorpassword",
            department="Engineering"
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
            approved_by=self.advisor
        )

        self.president.president_of.add(self.society)

    def test_admin_exists(self):
        """Test if the admin user was correctly seeded."""
        admin = Admin.objects.get(username="admin_user")
        self.assertEqual(admin.email, "admin@example.com")
        self.assertEqual(admin.first_name, "Admin")
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)

    def test_advisor_exists(self):
        """Test if the advisor user was correctly seeded."""
        advisor = Advisor.objects.get(username="advisor_user")
        self.assertEqual(advisor.email, "advisor@example.com")
        self.assertEqual(advisor.department, "Engineering")
        self.assertTrue(advisor.is_advisor())

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
        self.assertEqual(society.approved_by, self.advisor)
        self.assertIn(self.president, society.presidents.all())