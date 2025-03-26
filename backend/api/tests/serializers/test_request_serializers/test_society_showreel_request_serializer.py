from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from api.serializers import SocietyShowreelRequestSerializer
from api.models import SocietyShowreelRequest, SocietyRequest, Student, Society
import os
import tempfile
from PIL import Image
import django.db.utils

User = get_user_model()

class SocietyShowreelRequestSerializerTest(TestCase):
    """Test suite for the SocietyShowreelRequestSerializer"""

    def setUp(self):
        """Set up test data for the serializer tests"""
        
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        
        self.student = Student.objects.create(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student",
            status="Approved"
        )
        
        
        self.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            president=self.student,
            approved_by=self.admin_user,
            status="Approved"
        )
        
        
        self.society_request = SocietyRequest.objects.create(
            intent="CreateSoc",
            from_student=self.student,
            name="New Society",
            description="A new society request",
            president=self.student
        )
        
        
        self.image_file = self._create_test_image()
        
        
        self.showreel_request = SocietyShowreelRequest.objects.create(
            society=self.society_request,
            photo=self.image_file,
            caption="Test Caption"
        )

    def tearDown(self):
        """Clean up after tests"""
        
        if self.showreel_request.photo:
            if os.path.isfile(self.showreel_request.photo.path):
                os.remove(self.showreel_request.photo.path)

    def _create_test_image(self):
        """Helper method to create a test image file"""
        
        temp_file = tempfile.NamedTemporaryFile(suffix='.jpg', delete=False)
        
        
        image = Image.new('RGB', (100, 100), color='red')
        image.save(temp_file.name)
        
        
        with open(temp_file.name, 'rb') as img_file:
            return SimpleUploadedFile(
                name='test_image.jpg',
                content=img_file.read(),
                content_type='image/jpeg'
            )

    def test_serializer_contains_expected_fields(self):
        """Test that the serializer contains all expected fields"""
        serializer = SocietyShowreelRequestSerializer(instance=self.showreel_request)
        data = serializer.data
        
        expected_fields = {'photo', 'caption'}
        self.assertEqual(set(data.keys()), expected_fields)
    
    def test_serializer_field_content(self):
        """Test that the serializer returns the expected field values"""
        serializer = SocietyShowreelRequestSerializer(instance=self.showreel_request)
        data = serializer.data
        
        
        self.assertEqual(data['caption'], "Test Caption")
        
        
        self.assertIsInstance(data['photo'], str)
        self.assertTrue(data['photo'].endswith('.jpg'))
    
    def test_create_showreel_request(self):
        """Test creating a new showreel request using the serializer"""
        
        new_image = self._create_test_image()
        
        
        data = {
            'photo': new_image,
            'caption': 'New Caption'
        }
        
        serializer = SocietyShowreelRequestSerializer(data=data)
        
        
        self.assertTrue(serializer.is_valid())
        
        
        showreel_request = serializer.save(society=self.society_request)
        
        self.assertEqual(showreel_request.society, self.society_request)
        self.assertEqual(showreel_request.caption, 'New Caption')
        self.assertIsNotNone(showreel_request.photo)
        
        
        if os.path.isfile(showreel_request.photo.path):
            os.remove(showreel_request.photo.path)
    
    def test_update_showreel_request(self):
        """Test updating an existing showreel request using the serializer"""
        
        new_image = self._create_test_image()
        
        
        data = {
            'photo': new_image,
            'caption': 'Updated Caption'
        }
        
        serializer = SocietyShowreelRequestSerializer(
            instance=self.showreel_request,
            data=data
        )
        
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = serializer.save()
        
        self.assertEqual(updated_request.id, self.showreel_request.id)
        self.assertEqual(updated_request.caption, 'Updated Caption')
        self.assertIsNotNone(updated_request.photo)
        
        
        if os.path.isfile(updated_request.photo.path):
            os.remove(updated_request.photo.path)
    
    def test_partial_update_showreel_request(self):
        """Test partially updating an existing showreel request"""
        
        data = {
            'caption': 'Partially Updated Caption'
        }
        
        serializer = SocietyShowreelRequestSerializer(
            instance=self.showreel_request,
            data=data,
            partial=True
        )
        
        
        self.assertTrue(serializer.is_valid())
        
        
        updated_request = serializer.save()
        
        self.assertEqual(updated_request.id, self.showreel_request.id)
        self.assertEqual(updated_request.caption, 'Partially Updated Caption')
        
        
        self.assertEqual(updated_request.photo, self.showreel_request.photo)
    
    def test_validate_missing_photo(self):
        """Test validation when photo is missing during creation"""
        
        data = {
            'caption': 'Caption without photo'
        }
        
        serializer = SocietyShowreelRequestSerializer(data=data)
        
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('photo', serializer.errors)
    
    def test_validate_invalid_photo_format(self):
        """Test validation with invalid photo format"""
        
        invalid_file = SimpleUploadedFile(
            name='test_file.txt',
            content=b'This is not an image',
            content_type='text/plain'
        )
        
        data = {
            'photo': invalid_file,
            'caption': 'Invalid photo caption'
        }
        
        serializer = SocietyShowreelRequestSerializer(data=data)
        
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('photo', serializer.errors)
    
    def test_long_caption(self):
        """Test with a caption that exceeds the max length"""
        
        long_caption = 'A' * 100
        
        data = {
            'photo': self._create_test_image(),
            'caption': long_caption
        }
        
        serializer = SocietyShowreelRequestSerializer(data=data)
        
        
        self.assertFalse(serializer.is_valid())
        self.assertIn('caption', serializer.errors)
    
    def test_empty_caption(self):
        """Test with an empty caption (which should be allowed)"""
        data = {
            'photo': self._create_test_image(),
            'caption': ''
        }
        
        serializer = SocietyShowreelRequestSerializer(data=data)
        
        
        self.assertTrue(serializer.is_valid())
        
        
        showreel_request = serializer.save(society=self.society_request)
        
        self.assertEqual(showreel_request.caption, '')
        
        
        if os.path.isfile(showreel_request.photo.path):
            os.remove(showreel_request.photo.path)
    
    def test_missing_society_on_create(self):
        """Test creating a showreel request without specifying a society"""
        data = {
            'photo': self._create_test_image(),
            'caption': 'No society caption'
        }
        
        serializer = SocietyShowreelRequestSerializer(data=data)
        
        
        self.assertTrue(serializer.is_valid())
        
        
        with self.assertRaises(django.db.utils.IntegrityError):
            serializer.save()
    
    def test_multiple_requests_for_same_society(self):
        """Test creating multiple showreel requests for the same society"""
        
        for i in range(5):
            SocietyShowreelRequest.objects.create(
                society=self.society_request,
                photo=self._create_test_image(),
                caption=f"Caption {i}"
            )
        
        
        self.assertEqual(
            SocietyShowreelRequest.objects.filter(society=self.society_request).count(),
            6  
        )
        
        