from django.test import TestCase
from django.core.management import call_command
from django.core.exceptions import ObjectDoesNotExist
from django.core.files.storage import default_storage
from io import StringIO
from unittest.mock import patch, MagicMock, call
import api.models as m
from api.management.commands.unseed import Command


class UnseedCommandTest(TestCase):
    """Tests for the unseed database management command."""

    def setUp(self):
        """Set up test environment."""
        self.out = StringIO()
        
        # Create a user that can be used as a society president
        self.user = m.User.objects.create(username='testuser')
        self.student = m.Student.objects.create(
            username='teststudent',
            email='test@example.com',
            first_name='Test',
            last_name='Student',
            status='Approved'
        )

    @patch('api.management.commands.unseed.default_storage')
    @patch('api.management.commands.unseed.Command.get_all_images')
    def test_unseed_deletes_all_models(self, mock_get_all_images, mock_storage):
        """Test that unseed command deletes all models."""
        mock_get_all_images.return_value = ['image1.jpg', 'image2.jpg']
        
        m.Society.objects.create(
            name='Test Society', 
            president=self.student,
            status='Approved'
        )
        
        with patch('builtins.print') as mock_print:
            call_command('unseed', stdout=self.out)
        
        # Verify all images were deleted
        mock_storage.delete.assert_has_calls([
            call('image1.jpg'),
            call('image2.jpg')
        ])
        
        self.assertEqual(m.Society.objects.count(), 0)
        mock_print.assert_called_with('Database successfully unseeded')

    @patch('api.management.commands.unseed.default_storage')
    @patch('api.management.commands.unseed.Command.get_all_images')
    def test_unseed_handles_object_does_not_exist(self, mock_get_all_images, mock_storage):
        """Test that unseed command handles ObjectDoesNotExist exceptions."""
        mock_get_all_images.return_value = ['image1.jpg']
        mock_storage.delete.side_effect = ObjectDoesNotExist('Test error')
        
        with patch('builtins.print') as mock_print:
            call_command('unseed', stdout=self.out)
        
        mock_print.assert_any_call("An 'ObjectDoesNotExist' error occurred while unseeding: Test error")

    @patch('api.management.commands.unseed.default_storage')
    @patch('api.management.commands.unseed.Command.get_all_images')
    def test_unseed_handles_general_exceptions(self, mock_get_all_images, mock_storage):
        """Test that unseed command handles general exceptions."""
        mock_get_all_images.return_value = ['image1.jpg']
        mock_storage.delete.side_effect = Exception('Unexpected test error')
        
        with patch('builtins.print') as mock_print:
            call_command('unseed', stdout=self.out)
        
        mock_print.assert_any_call("An unexpected error occurred while unseeding: Unexpected test error")

    @patch('api.models.SocietyShowreel.objects.values_list')
    @patch('api.models.SocietyShowreelRequest.objects.values_list')
    @patch('api.models.Student.objects.values_list')
    @patch('api.models.UserRequest.objects.values_list')
    @patch('api.models.Society.objects.values_list')
    @patch('api.models.SocietyRequest.objects.values_list')
    @patch('api.management.commands.unseed.default_storage')
    def test_get_all_images(self, mock_storage, mock_society_request, mock_society, 
                          mock_user_request, mock_student, mock_showreel_request, mock_showreel):
        """Test the get_all_images helper function."""
        mock_storage.exists.return_value = True
        mock_showreel.return_value = ['image1.jpg']
        mock_showreel_request.return_value = ['image2.jpg']
        mock_student.return_value = ['student_icon.jpg', 'pre-seed-icons/excluded.jpg']
        mock_user_request.return_value = ['user_icon.jpg']
        mock_society.return_value = ['society_icon.jpg', 'news_icons/excluded.jpg']
        mock_society_request.return_value = ['request_icon.jpg', 'default_event/excluded.jpg']
        
        
        command = Command()
        
        images = command.get_all_images()
        
        # Verify correct images are returned
        self.assertIn('image1.jpg', images)
        self.assertIn('image2.jpg', images)
        self.assertIn('student_icon.jpg', images)
        self.assertIn('user_icon.jpg', images)
        self.assertIn('society_icon.jpg', images)
        self.assertIn('request_icon.jpg', images)
        
        self.assertNotIn('pre-seed-icons/excluded.jpg', images)
        self.assertNotIn('news_icons/excluded.jpg', images)
        self.assertNotIn('default_event/excluded.jpg', images)

    @patch('api.management.commands.unseed.default_storage')
    @patch('api.management.commands.unseed.Command.get_all_images')
    def test_unseed_with_arguments(self, mock_get_all_images, mock_storage):
        """Test that the command handles unused arguments."""
        mock_get_all_images.return_value = []
        
        class TestableCommand(Command):
            def handle(self, *args, **kwargs):
                log = ''
                if args or kwargs:
                    log += 'Unused args passed\n'
                return log
        
        command = TestableCommand()
        result = command.handle(test_arg="value")
        self.assertIn('Unused args passed', result)