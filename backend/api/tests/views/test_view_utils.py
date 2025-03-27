from django.test import TestCase
from api.views_files.view_utility import student_has_no_role, get_admin_if_user_is_admin, \
    has_society_management_permission
from api.models import Student, Society, User


class TestViewUtils(TestCase):
    """Unit tests for the toggle_follow view."""

    def setUp(self):
        self.admin = User.objects.create(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        self.student = Student.objects.create(
            username='QWERTY',
            first_name='QWE',
            last_name='RTY',
            email='qwerty@gmail.com',
            role='student',
            major='CompSci',
        )
        self.student1 = Student.objects.create(
            username='John',
            first_name='John',
            last_name='Smith',
            email='JohnSmith@gmail.com',
            role='student',
            major='CompSci',
        )

        self.society = Society.objects.create(
            name='Tech',
            president=self.student1,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"Email": "techsociety@example.com"},
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.student1.is_president = True
        self.student1.president_of = self.society
        self.student1.save()

    def test_student_has_no_role(self):
        """Test that student_has_no_role works correctly"""
        self.assertIsNone(student_has_no_role(self.student))

    def test_student_has_role_president(self):
        """Test that student_has_no_role works when president"""
        self.assertTrue(student_has_no_role(self.student1))

    def test_student_has_role_vice_president(self):
        """Test that student_has_no_role works when vice_president"""
        self.society.vice_president = self.student
        self.student.is_vice_president = True
        self.society.save()
        self.student.save()
        self.assertTrue(student_has_no_role(self.student))

    def test_student_has_role__event_manager(self):
        """Test that student_has_no_role works when event_manager"""
        self.society.event_manager = self.student
        self.student.is_event_manager = True
        self.society.save()
        self.student.save()
        self.assertTrue(student_has_no_role(self.student))

    def test_student_has_no_role_with_society(self):
        """Test that student_has_no_role works correctly"""
        self.assertIsNone(student_has_no_role(self.student, society_id=self.society))

    def test_student_has_role_with_society(self):
        """Test that student_has_no_role works correctly"""
        self.assertIsNone(student_has_no_role(self.student1, society_id=self.society))

    def test_get_admin_if_user_is_admin(self):
        """Test for admin and student"""
        self.assertTrue(get_admin_if_user_is_admin(self.admin, "")[0])
        self.assertFalse(get_admin_if_user_is_admin(self.student, "")[0])

    def test_has_society_management_permission(self):
        """Test that has_society_management_permissions works"""
        self.assertTrue(has_society_management_permission(self.student1, self.society))
        self.assertFalse(has_society_management_permission(self.student, self.society))
