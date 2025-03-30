from datetime import datetime, date, time, timedelta
from unittest.mock import patch
from django.test import TestCase
from api.views_files.view_utility import *
from api.models import Student, Society, User, Event


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
        response = student_has_no_role(self.student)
        self.assertEqual(
            response.data["error"],
            "As vice president, you can't leave before resigning your position.",
        )
        self.assertTrue(response)
        response = student_has_no_role(self.student, society_id=self.society.id)
        self.assertEqual(
            response.data["error"],
            "As vice president, you can't leave before resigning your position.",
        )
        self.assertTrue(response)

    def test_student_vice_president_society_not_matching(self):
        """Test the outcome if a society is passed that is not related to student"""
        self.society.vice_president = None
        self.student.is_vice_president = True
        response = student_has_no_role(self.student, society_id=self.society.id)
        self.assertFalse(response)

    def test_student_event_manager_society_not_matching(self):
        """Test the outcome if a society is passed that is not related to student"""
        self.society.event_manager = None
        self.student.is_event_manager = True
        response = student_has_no_role(self.student, society_id=self.society.id)
        self.assertFalse(response)

    def test_student_has_role__event_manager(self):
        """Test that student_has_no_role works when event_manager"""
        self.society.event_manager = self.student
        self.student.is_event_manager = True
        self.society.save()
        self.student.save()
        response = student_has_no_role(self.student)
        self.assertEqual(
            response.data["error"],
            "As event manager, you can't leave before resigning your position.",
        )
        self.assertTrue(response)
        response = student_has_no_role(self.student, society_id=self.society.id)
        self.assertEqual(
            response.data["error"],
            "As event manager, you can't leave before resigning your position.",
        )
        self.assertTrue(response)

    def test_error_message_change(self):
        """Test that student_has_no_role gives flexible errors"""
        request = student_has_no_role(self.student1, start=True, society_id=self.society.id)
        self.assertTrue(request)
        self.assertEqual(
            request.data["error"],
            "As president, you can't start another society before you transfer presidency."
        )

    def test_student_has_no_role_with_society(self):
        """Test that student_has_no_role works correctly"""
        self.assertIsNone(student_has_no_role(self.student, society_id=self.society.id))

    def test_student_has_role_with_society(self):
        """Test that student_has_no_role works correctly"""
        self.assertTrue(student_has_no_role(self.student1, society_id=self.society.id))

    def test_get_admin(self):
        """Test that get admin returns for admin but not student"""
        self.assertTrue(get_admin_if_user_is_admin(self.admin, "")[0])
        self.assertFalse(get_admin_if_user_is_admin(self.student, "")[0])

    def test_get_student(self):
        """Test that get student returns for student but not admin"""
        self.assertFalse(get_student_if_user_is_student(self.admin, "")[0])
        self.assertTrue(get_student_if_user_is_student(self.student, "")[0])

    def test_has_society_management_permission(self):
        """Test that has_society_management_permissions works"""
        self.assertTrue(has_society_management_permission(self.student1, self.society))
        self.assertFalse(has_society_management_permission(self.student, self.society))

    def test_event_manager_society_management_permission(self):
        """Test that has_society_management_permissions works"""
        self.student.is_event_manager = True
        self.society.event_manager = self.student
        self.assertTrue(has_society_management_permission(self.student, self.society, True))
        self.assertFalse(has_society_management_permission(self.student, self.society, False))

    def test_get_object_by_id(self):
        """Test that getting an object by id works"""
        self.assertEqual(get_object_by_id_or_name(Society, self.society.id), self.society)

    def test_get_object_by_name(self):
        """Test that getting an object by name works"""
        self.assertEqual(
            get_object_by_id_or_name(Society, -1, name_value="Tech"),
            self.society
        )

    @patch("builtins.print")
    def test_process_date(self, mock_print):
        """Test string date fields are correctly parsed"""
        event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
        )
        valid_date = '2025-03-27'
        as_date = datetime.strptime(valid_date, '%Y-%m-%d').date()
        process_date_field(event, "date", valid_date)
        self.assertEqual(event.date, as_date)
        mock_print.assert_not_called()

    @patch("builtins.print")
    def test_invalid_date(self, mock_print):
        """Test that an invalid date string does not set the attribute and prints an error."""
        event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
        )
        invalid_date = 'not-a-date'
        process_date_field(event, "date", invalid_date)
        mock_print.assert_called()

    @patch("builtins.print")
    def test_process_time(self, mock_print):
        """Test string time fields are correctly parsed"""
        event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
        )
        valid_time = '10:30:45'
        as_time = time(*map(int, valid_time.split(':')))
        process_time_field(event, "start_time", valid_time)
        self.assertEqual(event.start_time, as_time)
        mock_print.assert_not_called()

    @patch("builtins.print")
    def test_invalid_time(self, mock_print):
        """Test that an invalid time string does not set the attribute and prints an error."""
        event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
        )
        invalid_time = 'not-a-time'
        process_time_field(event, "start_time", invalid_time)
        mock_print.assert_called()

    def test_process_timedelta(self):
        """Test string timedelta fields are correctly parsed"""
        event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
        )
        valid_time = '1:30:0'
        as_time = time(*map(int, valid_time.split(':')))
        as_time_delta = datetime.combine(date.min, as_time) - datetime.min
        process_timedelta_field(event, "duration", valid_time)
        self.assertEqual(event.duration, as_time_delta)

    def test_process_long_timedelta(self):
        """Test string timedelta fields are correctly parsed"""
        event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
        )
        valid_time = '5,1:30:0'
        as_time = time(*map(int, valid_time[2:].split(':')))
        as_time_delta = datetime.combine(date.min, as_time) - datetime.min
        as_time_delta += timedelta(days=int(valid_time[:1]))
        process_timedelta_field(event, "duration", valid_time)
        self.assertEqual(event.duration, as_time_delta)

    def test_invalid_timedelta(self):
        """Test that an invalid timedelta string does not set the attribute and prints an error."""
        event = Event.objects.create(
            title='Day',
            main_description='Day out',
            hosted_by=self.society,
            location="KCL Campus",
            max_capacity=2,
        )
        invalid_time = 'not:a:timedelta'
        process_timedelta_field(event, "duration", invalid_time)
        self.assertEqual(event.duration, timedelta(hours=1))
        invalid_time = '0:30'
        process_timedelta_field(event, "duration", invalid_time)
        self.assertEqual(event.duration, timedelta(hours=1))

    @patch("builtins.print")
    def test_set_many_to_many_relationship(self, mock_print):
        """Test the ability to set a m2m relationship from a list of IDs"""
        ids = []
        students = []
        for i in range(5):
            student = Student.objects.create(
                username=f'QWERTY{i}',
                first_name='QWE',
                last_name='RTY',
                email=f'qwerty{i}@gmail.com',
                role='student',
                major='CompSci',
            )
            ids.append(student.id)
            students.append(student)
        self.society.society_members.clear()
        set_many_to_many_relationship(self.society, "society_members", ids, Student)
        self.assertEqual(list(self.society.society_members.all()), students)
        mock_print.assert_not_called()

    @patch("builtins.print")
    def test_set_many_to_many_relationship_invalid(self, mock_print):
        """Test the ability to set a m2m relationship from an invalid list of IDs"""
        ids = []
        students = []
        for i in range(5):
            student = Student.objects.create(
                username=f'QWERTY{i}',
                first_name='QWE',
                last_name='RTY',
                email=f'qwerty{i}@gmail.com',
                role='student',
                major='CompSci',
            )
            ids.append(student.id + 1)
            students.append(student)
        self.society.society_members.clear()
        set_many_to_many_relationship(self.society, "society_members", ids, Student)
        self.assertNotEqual(list(self.society.society_members.all()), students)
        mock_print.assert_called()

    @patch("builtins.print")
    def test_set_many_to_many_relationship_invalid_field(self, mock_print):
        """Test the ability to set a m2m relationship from an invalid list of IDs"""
        set_many_to_many_relationship(self.society, "society_member", [], Student)
        mock_print.assert_called()

    @patch("builtins.print")
    def test_set_foreign_key_relationship(self, mock_print):
        """Test the validity of setting of foreign key relationship"""
        student = Student.objects.create(
            username='JosephB',
            first_name='Joseph',
            last_name='B',
            email='joseph-b@gmail.com',
            role='student',
            major='CompSci',
        )
        set_foreign_key_relationship(self.society, "vice_president", student.id, Student)
        self.assertEqual(self.society.vice_president, student)
        mock_print.assert_not_called()

    @patch("builtins.print")
    def test_set_foreign_key_relationship_zero_id(self, mock_print):
        """Test the validity of setting of foreign key relationship with a zero id"""
        self.assertIsNone(set_foreign_key_relationship(
            self.society,
            "vice_president",
            0,
            Student,
        ))
        self.assertEqual(self.society.vice_president, None)
        mock_print.assert_not_called()

    @patch("builtins.print")
    def test_set_foreign_key_relationship_invalid_id(self, mock_print):
        """Test the validity of setting of foreign key relationship with a zero id"""
        self.assertIsNone(set_foreign_key_relationship(
            self.society,
            "vice_president",
            17,
            Student,
        ))
        self.assertEqual(self.society.vice_president, None)
        mock_print.assert_called()

    def test_restore_handler_not_implemented(self):
        """Test the validity of setting of foreign key relationship with a zero id"""
        restore_handler = RestoreHandler()
        with self.assertRaises(NotImplementedError):
            restore_handler.handle(None, None)
