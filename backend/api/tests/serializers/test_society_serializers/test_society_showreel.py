from django.test import TestCase
from django.core.exceptions import ValidationError
from django.core.files.uploadedfile import SimpleUploadedFile
from io import BytesIO
from PIL import Image
from api.models import Society, SocietyShowreel, Student, User
from api.tests.file_deletion import delete_file


class SocietyShowreelTestCase(TestCase):
    """
    Unit tests for the SocietyShowreel model
    """

    def setUp(self):
        self.student = Student.objects.create_user(
            username='test_president',
            first_name='John',
            last_name='Smith',
            email='president@example.com',
            password='password123',
            role='president',
            major='Computer Science'
        )
        
        self.admin = User.objects.create_user(
            username='admin_user',
            first_name='Admin',
            last_name='User',
            email='admin@example.com',
            password='password123',
            role='admin'
        )
        
        self.society = Society.objects.create(
            name='Test Society',
            description='Test Society Description',
            category='Academic',
            president=self.student,
            membership_requirements='None',
            social_media_links={},
            upcoming_projects_or_plans='None',
            approved_by=self.admin
        )
        
        self.test_image = self.get_image("test_image")
    
    def test_create_showreel_item(self):
        """Test creating a valid showreel item"""
        showreel_item = SocietyShowreel.objects.create(
            society=self.society,
            photo=self.test_image,
            caption="Test Caption"
        )
        
        self.assertEqual(showreel_item.society, self.society)
        self.assertEqual(showreel_item.caption, "Test Caption")
        self.assertIsNotNone(showreel_item.photo)
        
    def test_create_showreel_without_society(self):
        """Test that creating a showreel without society raises ValidationError"""
        with self.assertRaises(ValidationError) as context:
            showreel = SocietyShowreel(
                photo=self.test_image,
                caption="Test Caption"
            )
            showreel.clean()  # Call clean directly to trigger validation
        
        self.assertIn('society', str(context.exception))
        self.assertIn('required', str(context.exception))
        
    def test_create_showreel_without_photo(self):
        """Test that creating a showreel without photo raises ValidationError"""
        with self.assertRaises(ValidationError) as context:
            showreel = SocietyShowreel(
                society=self.society,
                caption="Test Caption"
            )
            showreel.full_clean()
        
        self.assertIn('photo', str(context.exception))
        
    def test_create_showreel_with_empty_caption(self):
        """Test creating a showreel with empty caption is valid"""
        showreel_item = SocietyShowreel.objects.create(
            society=self.society,
            photo=self.test_image,
            caption=""
        )
        
        self.assertEqual(showreel_item.caption, "")
        
    def test_max_showreel_images_limit(self):
        """Test that a society cannot have more than 10 showreel images"""
        for i in range(10):
            SocietyShowreel.objects.create(
                society=self.society,
                photo=self.get_image(f"test_image_{i}"),
                caption=f"Caption {i}"
            )
        
        self.assertEqual(self.society.showreel_images.count(), 10)
        
        # Try to add an 11th image, should raise ValidationError
        with self.assertRaises(ValidationError) as context:
            showreel = SocietyShowreel(
                society=self.society,
                photo=self.get_image("one_too_many"),
                caption="This should fail"
            )
            showreel.full_clean()  # This should trigger the validation error
        
        self.assertIn('society can have max 10 showreel images', str(context.exception))
        self.assertEqual(self.society.showreel_images.count(), 10)
        
    def test_update_existing_showreel(self):
        """Test updating an existing showreel item doesn't trigger the max limit validation"""
        showreel_items = []
        for i in range(10):
            item = SocietyShowreel.objects.create(
                society=self.society,
                photo=self.get_image(f"test_image_{i}"),
                caption=f"Caption {i}"
            )
            showreel_items.append(item)
        
        # Update one of the existing items
        item_to_update = showreel_items[0]
        new_caption = "Updated Caption"
        item_to_update.caption = new_caption
        item_to_update.save()
        
        item_to_update.refresh_from_db()
        self.assertEqual(item_to_update.caption, new_caption)
        
    def test_foreign_key_on_delete_cascade(self):
        """Test that showreel items are deleted when society is deleted"""
        showreel_item = SocietyShowreel.objects.create(
            society=self.society,
            photo=self.test_image,
            caption="Test Caption"
        )
        
        showreel_id = showreel_item.id
        self.society.delete()
        
        # Verify the showreel item was also deleted
        self.assertEqual(SocietyShowreel.objects.filter(id=showreel_id).count(), 0)
    
    def test_relationship_query(self):
        """Test querying showreel items through the society relationship"""
        SocietyShowreel.objects.create(
            society=self.society,
            photo=self.get_image("image1"),
            caption="Caption 1"
        )
        
        SocietyShowreel.objects.create(
            society=self.society,
            photo=self.get_image("image2"),
            caption="Caption 2"
        )
        
        showreel_items = self.society.showreel_images.all()
        self.assertEqual(showreel_items.count(), 2)
        captions = [item.caption for item in showreel_items]
        self.assertIn("Caption 1", captions)
        self.assertIn("Caption 2", captions)
    
    def get_image(self, name):
        """Helper method to create a test image"""
        image = Image.new('RGB', (100, 100), color='red')
        buffer = BytesIO()
        image.save(buffer, format='JPEG')
        buffer.seek(0)
        
        return SimpleUploadedFile(
            f"{name}.jpg",
            buffer.getvalue(),
            content_type="image/jpeg"
        )
    
    def tearDown(self):
        """Clean up test files after tests"""
        for showreel in SocietyShowreel.objects.all():
            if showreel.photo:
                try:
                    delete_file(showreel.photo.path)
                except Exception:
                    pass