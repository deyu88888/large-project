from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Society, Admin, Student

class SocietyModelTestCase(TestCase):
    """ Unit tests for the Society model """

    def setUp(self):
        self.admin = Admin(
            username='admin_user',
            first_name='John',
            last_name='Smith',
            email='admin@example.com',
            role='admin',
            password='adminpassword',
        )
        self.admin.save()

        self.student1 = Student(
            username='QWERTY',
            first_name='QWE',
            last_name='RTY',
            email='qwerty@gmail.com',
            role='student',
            major='CompSci',
        )
        self.student1.save()

        self.student2 = Student(
            username='Ja-Smith',
            first_name='Jane',
            last_name='Smith',
            email='jasmith@gmail.com',
            role='student',
            major='Mathematics',
        )
        self.student2.save()

        self.society = Society(
            name='Tech',
            leader=self.student1,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"email": "techsociety@example.com"},
            timetable="Weekly meetings on Fridays at 5 PM",
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.society.save()
        self.society.society_members.add(self.student2)  # pylint: disable=no-member

    def test_valid_society(self):
        """ Test to ensure valid societies are accepted """
        self._assert_society_is_valid()

    def test_blank_admin(self):
        """ Test to ensure an admin must be specified """
        self.society.approved_by = None
        self._assert_society_is_invalid()

    def test_blank_leader(self):
        """ Test to ensure a leader must be specified """
        self.society.leader = None
        self._assert_society_is_invalid()

    def test_string_representation(self):
        """ Test to ensure the title is returned when cast to str """
        self.assertEqual(str(self.society), self.society.name)

    def test_name_char_limit(self):
        """ Test to ensure society name can't surpass 30 characters """
        self.society.name = 'a' * 31
        self._assert_society_is_invalid()

    def test_blank_members(self):
        """ Test to ensure a society is valid without members """
        self.society.society_members.remove(self.student2)  # pylint: disable=no-member
        self._assert_society_is_valid()

    def test_roles_field(self):
        """ Test roles JSON field functionality """
        self.society.roles = {"President": self.student1.id, "Vice-President": self.student2.id}
        self.society.save()
        self.assertEqual(self.society.roles["President"], self.student1.id)

    def test_change_leader(self):
        """ Test to ensure changing the leader works correctly """
        self.society.leader = self.student2
        self.society.save()
        self.assertEqual(self.society.leader, self.student2)

    def test_social_media_links(self):
        """ Test the social_media_links JSON field """
        self.assertEqual(self.society.social_media_links["email"], "techsociety@example.com")

    def test_timetable(self):
        """ Test the timetable field """
        self.assertEqual(self.society.timetable, "Weekly meetings on Fridays at 5 PM")

    def test_membership_requirements(self):
        """ Test the membership_requirements field """
        self.assertEqual(self.society.membership_requirements, "Members must attend at least 3 events per semester")

    def test_upcoming_projects_or_plans(self):
        """ Test the upcoming_projects_or_plans field """
        self.assertEqual(self.society.upcoming_projects_or_plans, "Plan to host a Tech Fest in May")

    def _assert_society_is_valid(self):
        try:
            self.society.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_society_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.society.full_clean()
