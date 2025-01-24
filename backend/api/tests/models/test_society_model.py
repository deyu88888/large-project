from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Society, Student

class SocietyModelTestCase(TestCase):
    """ Unit tests for the Society model """

    def setUp(self):
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
        )
        self.society.save()
        self.society.society_members.add(self.student2) # pylint: disable=no-member

    def test_valid_society(self):
        """ Test to ensure valid societies are accepted """
        self._assert_society_is_valid()

    def test_blank_leader(self):
        """ Test to ensure an advisor must be specified """
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
        self.society.society_members.remove(self.student2) # pylint: disable=no-member

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

    def _assert_society_is_valid(self):
        try:
            self.society.full_clean()
        except ValidationError:
            self.fail("Test society should be valid")

    def _assert_society_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.society.full_clean()
