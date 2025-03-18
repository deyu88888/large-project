import io
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.exceptions import ValidationError
from django.test import TestCase
from api.models import Society, User, Student, SocietyShowreel
from api.tests.file_deletion import delete_file

class SocietyShowreelModelTestCase(TestCase):
    """ Unit tests for the Society model """

    def setUp(self):
        self.admin = User.objects.create(
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
            president=self.student1,
            approved_by=self.admin,
            category='Technology',
            social_media_links={"Email": "techsociety@example.com"},
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.society.save()
        self.society.society_members.add(self.student2)  # pylint: disable=no-member

        self.society_showreel = None

        image = Image.new('RGB', (100, 100), color='red')
        image_io = io.BytesIO()
        image.save(image_io, format='JPEG')
        image_io.seek(0)

        self.default_photo = SimpleUploadedFile(
            "test_icon.jpg",
            image_io.getvalue(),
            content_type="image/jpeg"
        )

    def test_basic_showreel_valid(self):
        """Test that a 'correct' showreel is valid"""
        self.society_showreel = SocietyShowreel(
            society=self.society,
            caption="A photo of an event"
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_valid()

    def test_showreel_requires_society(self):
        """Test a showreel's creation requires a reference to a society"""
        self.society_showreel = SocietyShowreel(
            caption="A photo of an event"
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_invalid()

    def test_showreel_requires_photo(self):
        """Test a showreel's creation requires a photo"""
        self.society_showreel = SocietyShowreel(
            society=self.society,
            caption="A photo of an event"
        )
        self._assert_showreel_is_invalid()

    def test_showreel_not_requires_caption(self):
        """Test a showreel can be created without a caption"""
        self.society_showreel = SocietyShowreel(
            society=self.society,
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_valid()

    def test_society_max_images(self):
        """Test a society cannot have more than 10 showreel images"""
        for i in range(10):
            self.society_showreel = SocietyShowreel(
                society=self.society,
                caption=f"Test image {i+1}",
            )
            self.society_showreel.photo = self.default_photo
            self.society_showreel.save()
            self._assert_showreel_is_valid()

        self.society_showreel = SocietyShowreel(
            society=self.society,
            caption="Extra image",
        )
        self.society_showreel.photo = self.default_photo
        self._assert_showreel_is_invalid()

    def _assert_showreel_is_valid(self):
        try:
            self.society_showreel.full_clean()
        except ValidationError:
            self.fail("Test showreel should be valid")

    def _assert_showreel_is_invalid(self):
        with self.assertRaises(ValidationError):
            self.society_showreel.full_clean()

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)
        for showreel in SocietyShowreel.objects.all():
            if showreel.photo:
                delete_file(showreel.photo.path)

    def test_clean_missing_society(self):
        """
        Test that calling full_clean on a SocietyShowreel without a society
        raises a ValidationError with an error message for 'society'.
        """
        # Create a showreel instance without a society.
        showreel = SocietyShowreel(
            photo=self.default_photo,
            caption="Test caption"
        )
        with self.assertRaises(ValidationError) as cm:
            showreel.full_clean()
        self.assertEqual(cm.exception.message_dict["society"][0], "This field cannot be null.")

    def test_update_existing_showreel_allows_more_images(self):
        """
        Test that updating an existing SocietyShowreel (with a primary key)
        does not trigger the max 10 images validation.
        """
        # Create and save a valid showreel.
        showreel = SocietyShowreel(
            society=self.society,
            caption="Initial caption",
            photo=self.default_photo
        )
        showreel.save()  # Now it has a primary key.

        # Add 9 additional showreel images, making a total of 10.
        for i in range(9):
            new_showreel = SocietyShowreel(
                society=self.society,
                caption=f"Dummy image {i+1}",
                photo=self.default_photo
            )
            new_showreel.save()  # This should pass since the society now has 10 images exactly.

        # Verify that the society now has 10 images.
        self.assertEqual(self.society.showreel_images.count(), 10)

        # Now update the original showreel.
        showreel.caption = "Updated caption"
        try:
            # Since showreel already exists (has a pk), the max images check should not trigger.
            showreel.full_clean()
            showreel.save()
        except Exception as e:
            self.fail("Updating an existing showreel should not trigger max images validation: " + str(e))

    def test_create_showreel_when_max_not_exceeded(self):
        """
        Test that creating a new SocietyShowreel succeeds if the society
        currently has fewer than 10 images.
        """
        # Clear any existing images.
        SocietyShowreel.objects.all().delete()
        
        # Add 9 images to the society.
        for i in range(9):
            img = SocietyShowreel(
                society=self.society,
                caption=f"Image {i+1}",
                photo=self.default_photo
            )
            # Each image should be valid.
            try:
                img.full_clean()
                img.save()
            except Exception as e:
                self.fail(f"Unexpected validation error when creating image {i+1}: {e}")

        self.assertEqual(self.society.showreel_images.count(), 9)
        
        # Now create one more image. Since the society will have 10 images, this should be allowed for an existing instance?
        # Note: The max images check only applies to new instances (i.e., without a primary key).
        new_showreel = SocietyShowreel(
            society=self.society,
            caption="Tenth Image",
            photo=self.default_photo
        )
        # This new instance should pass validation since its creation will make the total count exactly 10.
        try:
            new_showreel.full_clean()
            new_showreel.save()
        except Exception as e:
            self.fail(f"New showreel should be valid when count is exactly 10: {e}")
        
        self.assertEqual(self.society.showreel_images.count(), 10)


    def test_create_showreel_when_max_exceeded(self):
        """
        Test that creating a new SocietyShowreel fails if the society
        already has 10 images.
        """
        # Clear any existing images.
        SocietyShowreel.objects.all().delete()
        
        # Add 10 images to the society.
        for i in range(10):
            img = SocietyShowreel(
                society=self.society,
                caption=f"Image {i+1}",
                photo=self.default_photo
            )
            img.full_clean()
            img.save()
        self.assertEqual(self.society.showreel_images.count(), 10)
        
        # Now, attempt to create a new showreel. Since the instance is new (has no pk),
        # the clean() method should trigger the max images validation.
        extra_showreel = SocietyShowreel(
            society=self.society,
            caption="Extra Image",
            photo=self.default_photo
        )
        with self.assertRaises(ValidationError) as cm:
            extra_showreel.full_clean()
        # Optionally, check that the error message contains the expected text.
        self.assertIn("society can have max 10 showreel images", str(cm.exception.message_dict.get("society", [])))


    def test_save_calls_full_clean(self):
        """
        Test that calling save() on a SocietyShowreel instance calls full_clean()
        and raises a ValidationError if required fields are missing.
        """
        # Create a showreel without a photo (which is required)
        showreel = SocietyShowreel(
            society=self.society,
            caption="No Photo"
        )
        with self.assertRaises(ValidationError):
            # save() calls full_clean(), so this should raise an error
            showreel.save()

