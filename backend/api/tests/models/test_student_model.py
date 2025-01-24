from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Student, Society


class StudentModelTestCase(TestCase):
    def setUp(self):
        # create test data
        self.student = Student.objects.create(
            username='test_student',
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            major='Computer Science',
        )
        self.society1 = Society.objects.create(
            name='Science Club',
            leader=self.student
        )
        self.society2 = Society.objects.create(
            name='Math Club',
        )

    def test_student_creation(self):
        """test student creation"""
        self.assertEqual(self.student.username, 'test_student')
        self.assertEqual(self.student.first_name, 'Alice')
        self.assertEqual(self.student.last_name, 'Johnson')
        self.assertEqual(self.student.major, 'Computer Science')
        self.assertEqual(self.student.role, 'student')  # 验证角色是否设置正确

    def test_student_full_name(self):
        """test full_name property"""
        self.assertEqual(self.student.full_name, 'Alice Johnson')

    def test_student_societies_relationship(self):
        """test societies many-to-many relationship"""
        # add student to two societies
        self.student.societies.add(self.society1, self.society2)
        self.assertEqual(self.student.societies.count(), 2)
        self.assertIn(self.society1, self.student.societies.all())
        self.assertIn(self.society2, self.student.societies.all())

    def test_student_president_of_relationship(self):
        """test president_of many-to-many relationship and is_president property"""
        # confirm student is not a president
        self.assertFalse(self.student.is_president)

        # set student as president of one society
        self.student.president_of.add(self.society1)
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_president)

        # clear president_of relationship and verify is_president is updated
        self.student.president_of.clear()
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_president)

    def test_signal_update_is_president(self):
        """test m2m_changed signal for updating is_president"""
        # set student as president of one society and verify is_president is updated
        self.student.president_of.add(self.society1)
        self.student.refresh_from_db()
        self.assertTrue(self.student.is_president)

        # clear president_of relationship and verify is_president is updated
        self.student.president_of.remove(self.society1)
        self.student.refresh_from_db()
        self.assertFalse(self.student.is_president)
