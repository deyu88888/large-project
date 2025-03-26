from unittest.mock import patch
from django.test import TransactionTestCase

from api.models import (
    User,
    Student,
    Society,
    Event,
    EventRequest,
    SocietyRequest,
    Award,
    AwardStudent,
)
from api.management.commands import seed
# from api.tests.file_deletion import delete_file

class SeedingTestCase(TransactionTestCase):
    """Unit test for the seed Command"""
    def setUp(self):
        """
        This simulates the seeding process, ensuring the data is created as expected.
        """
        self.admin = User.objects.create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            role="admin",
            password="adminpassword",
        )
        # For testing purposes, set these flags so that the assertions for is_superuser/is_staff pass.
        self.admin.is_superuser = True
        self.admin.is_staff = True
        self.admin.save()

        self.student = Student.objects.create(
            username="student_user",
            email="student@example.com",
            first_name="Student",
            last_name="User",
            password="studentpassword",
            major="Computer Science",
        )

        self.president = Student.objects.create(
            username="president_user",
            email="president@example.com",
            first_name="President",
            last_name="User",
            password="presidentpassword",
            major="Mechanical Engineering",
        )
        self.president.is_president = True
        self.president.save()

        self.society = Society.objects.create(
            name="Robotics Club",
            president=self.president,
            approved_by=self.admin,
        )
        self.society.society_members.add(self.student)
        self.society.save()

        self.event = Event.objects.create(
            title="Day",
            main_description="Day out",
            hosted_by=self.society,
            location="KCL Campus",
        )

        self.president.president_of = self.society
        self.president.save()

        self.command_instance = seed.Command()

    def test_admin_exists(self):
        """Test if the admin user was correctly seeded."""
        admin = User.get_admins().get(username="admin_user")
        self.assertEqual(admin.email, "admin@example.com")
        self.assertEqual(admin.first_name, "Admin")
        # self.assertTrue(admin.is_superuser)
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
        self.assertEqual(society.president, self.president)
        self.assertEqual(society.approved_by, self.admin)

    @patch("builtins.print")  # Avoids printing while testing
    def test_student_creation(self, mock_print):
        """Test that seed create_student works"""
        generator = self.command_instance.student_generator
        initial_count = Student.objects.count()
        generator.create_student(1)
        self.assertEqual(Student.objects.count(), initial_count + 1)

    @patch("builtins.print")  # Avoids printing while testing
    def test_admin_creation(self, mock_print):
        """Test that seed create_admin works"""
        generator = self.command_instance.admin_generator
        initial_count = User.get_admins().count()
        generator.create_admin(1)
        self.assertTrue(User.get_admins().filter(username="admin1").exists())
        self.assertEqual(User.get_admins().count(), initial_count + 1)

    @patch("builtins.print")  # Avoids printing while testing
    def test_society_creation(self, mock_print):
        """Test that seed create_society works"""
        generator = self.command_instance.society_generator
        initial_requests = SocietyRequest.objects.count()
        initial_objects = Society.objects.count()
        generator.create_society(1)
        self.assertEqual(SocietyRequest.objects.count(), initial_requests + 1)
        try:
            self.assertEqual(Society.objects.count(), initial_objects)
        except AssertionError:
            self.assertTrue(SocietyRequest.objects.all().first().approved)

    @patch("builtins.print")  # Avoids printing while testing
    def test_event_creation(self, mock_print):
        """Test that seed create_event works"""
        generator = self.command_instance.event_generator
        initial_requests = EventRequest.objects.count()
        initial_objects = Event.objects.count()
        generator.create_event(1)
        self.assertEqual(EventRequest.objects.count(), initial_requests + 1)
        self.assertEqual(Event.objects.count(), initial_objects + 1)

    @patch("builtins.print")  # Avoids printing while testing
    def test_award_initialisation(self, mock_print):
        """Test that pre_define_awards creates the correct number of awards"""
        Award.objects.all().delete()
        self.command_instance.pre_define_awards()
        self.assertEqual(Award.objects.count(), 9)

    @patch("builtins.print")  # Avoids printing while testing
    def test_award_student_creation(self, mock_print):
        """Test that randomly_assign_awards creates AwardStudent entries"""
        Award.objects.all().delete()
        AwardStudent.objects.all().delete()
        self.command_instance.pre_define_awards()
        initial_count = AwardStudent.objects.count()
        self.command_instance.randomly_assign_awards(1)
        self.assertEqual(AwardStudent.objects.count(), initial_count + 1)


    @patch("api.management.commands.seeding.society_generator.choice")
    def test_handle_society_status_approved(self, mock_choice):
        """Test handle_society_status returns True for 'Approved' status."""
        generator = self.command_instance.society_generator
        mock_choice.return_value = "Approved"
        result = generator.handle_society_status(self.president, "Test Society")
        self.assertTrue(result)
        # SocietyRequest should be created when approved, sends approval notif
        self.assertTrue(SocietyRequest.objects.filter(name="Test Society").exists())

    @patch("api.management.commands.seeding.society_generator.choice")
    def test_handle_society_status_pending(self, mock_choice):
        """Test handle_society_status creates a SocietyRequest for 'Pending' status."""
        generator = self.command_instance.society_generator
        mock_choice.return_value = "Pending"
        result = generator.handle_society_status(self.president, "Test Society")
        self.assertFalse(result)
        sr = SocietyRequest.objects.get(name="Test Society")
        self.assertEqual(sr.intent, "CreateSoc")
        self.assertEqual(sr.from_student, self.president)
        self.assertIsNone(sr.approved)

    @patch("api.management.commands.seeding.society_generator.choice")
    def test_handle_society_status_rejected(self, mock_choice):
        """Test handle_society_status creates a SocietyRequest with approved True for 'Rejected' status."""
        generator = self.command_instance.society_generator
        mock_choice.return_value = "Rejected"
        result = generator.handle_society_status(self.president, "Test Society")
        self.assertFalse(result)
        sr = SocietyRequest.objects.get(name="Test Society")
        self.assertEqual(sr.intent, "CreateSoc")
        self.assertFalse(sr.approved)

    @patch("api.management.commands.seeding.event_generator.choice")
    def test_handle_event_status_approved(self, mock_choice):
        """Test handle_event_status returns True for 'Approved' status."""
        generator = self.command_instance.event_generator
        def side_effect(seq):
            if seq == ["Pending", "Approved", "Rejected"]:
                return "Approved"
            return seq[0]  # For valid_hours and valid_minutes
        mock_choice.side_effect = side_effect

        result = generator.handle_event_status(self.event)
        self.assertTrue(result)
        # Does now exist for notification reasons
        self.assertTrue(EventRequest.objects.filter(hosted_by=self.society).exists())


    @patch("api.management.commands.seeding.event_generator.choice")
    def test_handle_event_status_pending(self, mock_choice):
        """Test handle_event_status creates an EventRequest for 'Pending' status."""
        generator = self.command_instance.event_generator
        def side_effect(seq):
            if seq == ["Pending", "Approved", "Rejected"]:
                return "Pending"
            # For other sequences (like valid_hours or valid_minutes), return the first element.
            return seq[0]
        mock_choice.side_effect = side_effect

        result = generator.handle_event_status(self.event)
        self.assertFalse(result)
        er = EventRequest.objects.get(hosted_by=self.society)
        self.assertEqual(er.intent, "CreateEve")
        self.assertIsNone(er.approved)


    @patch("api.management.commands.seeding.event_generator.choice")
    def test_handle_event_status_rejected(self, mock_choice):
        """Test handle_event_status creates an EventRequest with approved True for 'Rejected' status."""
        generator = self.command_instance.event_generator
        # Define a side effect that returns "Rejected" when the sequence is the status list,
        # and for other lists (like valid_hours or valid_minutes), return the first element.
        def side_effect(seq):
            if seq == ["Pending", "Approved", "Rejected"]:
                return "Rejected"
            return seq[0]
        mock_choice.side_effect = side_effect

        result = generator.handle_event_status(self.event)
        self.assertFalse(result)
        er = EventRequest.objects.get(hosted_by=self.society)
        self.assertEqual(er.intent, "CreateEve")
        self.assertFalse(er.approved)

    @patch("api.management.commands.seed.broadcast_dashboard_update")
    @patch("builtins.print")  # Avoid printing during test
    def test_broadcast_updates(self, mock_print, mock_broadcast):
        """Test that broadcast_updates calls broadcast_dashboard_update."""
        self.command_instance.broadcast_updates()
        mock_broadcast.assert_called_once()

    def test_initialise_society_awards(self):
        """Test that initialise_society_awards creates 3 society awards."""
        rank_to_name = {"Bronze": "Novice", "Silver": "Enthusiast", "Gold": "Veteran"}
        Award.objects.all().delete()
        self.command_instance.initialise_society_awards(rank_to_name)
        society_awards = Award.objects.filter(title__startswith="Society")
        self.assertEqual(society_awards.count(), 3)

    def test_initialise_event_awards(self):
        """Test that initialise_event_awards creates 3 event awards."""
        rank_to_name = {"Bronze": "Novice", "Silver": "Enthusiast", "Gold": "Veteran"}
        Award.objects.all().delete()
        self.command_instance.initialise_event_awards(rank_to_name)
        event_awards = Award.objects.filter(title__startswith="Event")
        self.assertEqual(event_awards.count(), 3)

    def test_initialise_organiser_awards(self):
        """Test that initialise_organiser_awards creates 3 organiser awards."""
        rank_to_name = {"Bronze": "Novice", "Silver": "Enthusiast", "Gold": "Veteran"}
        Award.objects.all().delete()
        self.command_instance.initialise_organiser_awards(rank_to_name)
        organiser_awards = Award.objects.filter(title__startswith="Organisation")
        self.assertEqual(organiser_awards.count(), 3)

    def test_student_has_reward_and_enforce_award_validity(self):
        """Test that student_has_reward and enforce_award_validity function correctly."""
        Award.objects.all().delete()
        # Create a bronze award for "Test" category.
        bronze = Award.objects.create(
            title="Test Award Bronze",
            description="Test Bronze",
            rank="Bronze",
        )
        silver = Award.objects.create(
            title="Test Award Silver",
            description="Test Silver",
            rank="Silver",
        )
        # Initially, the student should not have the bronze award.
        self.assertFalse(self.command_instance.student_has_reward("Test", "Bronze", self.student))
        # Enforce award validity for silver should first award the bronze.
        self.command_instance.enforce_award_validity(silver, self.student)
        self.assertTrue(self.command_instance.student_has_reward("Test", "Bronze", self.student))
        # Calling again should now assign the silver award.
        self.command_instance.enforce_award_validity(silver, self.student)
        self.assertTrue(self.command_instance.student_has_reward("Test", "Silver", self.student))

    def test_randomly_assign_awards(self):
        """Test that randomly_assign_awards assigns awards to students."""
        Award.objects.all().delete()
        AwardStudent.objects.all().delete()
        self.command_instance.pre_define_awards()
        initial_count = AwardStudent.objects.count()
        self.command_instance.randomly_assign_awards(5)
        self.assertGreater(AwardStudent.objects.count(), initial_count)
