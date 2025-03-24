import os
import tempfile
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from django.db.models import F
from datetime import timedelta

from api.models import Society, Student, User, SocietyNews


class SocietyNewsModelTest(TestCase):
    @classmethod
    def setUpTestData(cls):
        # Create admin user for society approval
        cls.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin",
            is_staff=True
        )
        
        # Create a student user that will be the author
        cls.student = Student.objects.create_user(
            username="test_student",
            email="student@example.com",
            password="password123",
            role="student",
            first_name="Test",
            last_name="Student",
            status="Approved"
        )
        
        # Create a society
        cls.society = Society.objects.create(
            name="Test Society",
            description="A test society",
            status="Approved",
            president=cls.student,
            approved_by=cls.admin_user
        )
        
        # Create a basic news post for testing
        cls.news_post = SocietyNews.objects.create(
            society=cls.society,
            title="Test News Post",
            content="This is a test news post content.",
            author=cls.student,
            status="Draft"
        )

    def test_news_creation(self):
        """Test that news posts can be created with basic fields"""
        self.assertEqual(self.news_post.title, "Test News Post")
        self.assertEqual(self.news_post.society, self.society)
        self.assertEqual(self.news_post.author, self.student)
        self.assertEqual(self.news_post.status, "Draft")
        
        # Check default values
        self.assertEqual(self.news_post.is_featured, False)
        self.assertEqual(self.news_post.is_pinned, False)
        self.assertEqual(self.news_post.tags, [])
        self.assertEqual(self.news_post.view_count, 0)
        
        # Check that auto_now_add fields are set
        self.assertIsNotNone(self.news_post.created_at)
        self.assertIsNotNone(self.news_post.updated_at)
        
        # published_at should be None for Draft status
        self.assertIsNone(self.news_post.published_at)

    def test_string_representation(self):
        """Test the string representation of the model"""
        expected_string = f"{self.society.name}: {self.news_post.title}"
        self.assertEqual(str(self.news_post), expected_string)

    def test_status_change_to_published(self):
        """Test that changing status to Published sets published_at"""
        # Initially published_at should be None
        self.assertIsNone(self.news_post.published_at)
        
        # Change status to Published
        self.news_post.status = "Published"
        self.news_post.save()
        
        # After save, published_at should be set
        self.assertIsNotNone(self.news_post.published_at)
        
        # published_at should be recent (within last minute)
        time_diff = timezone.now() - self.news_post.published_at
        self.assertLess(time_diff.total_seconds(), 60)

    def test_status_change_not_to_published(self):
        """Test that changing to a status other than Published doesn't set published_at"""
        # Change to Pending Approval
        self.news_post.status = "PendingApproval"
        self.news_post.save()
        
        # published_at should still be None
        self.assertIsNone(self.news_post.published_at)
        
        # Change to Rejected
        self.news_post.status = "Rejected"
        self.news_post.save()
        
        # published_at should still be None
        self.assertIsNone(self.news_post.published_at)

    def test_published_at_preserved(self):
        """Test that published_at is preserved when updating a published post"""
        # Set to published
        self.news_post.status = "Published"
        self.news_post.save()
        
        original_published_at = self.news_post.published_at
        self.assertIsNotNone(original_published_at)
        
        # Store the original published_at value
        original_published_at_value = self.news_post.published_at
        
        # Update the content but keep status as Published
        self.news_post.content = "Updated content"
        self.news_post.save()
        
        # published_at should not have changed
        self.assertEqual(self.news_post.published_at, original_published_at_value)

    def test_increment_view_count(self):
        """Test that view count can be incremented atomically"""
        initial_count = self.news_post.view_count
        self.assertEqual(initial_count, 0)
        
        # Increment by default amount (1)
        self.news_post.increment_view_count()
        self.assertEqual(self.news_post.view_count, 1)
        
        # Increment by custom amount
        self.news_post.increment_view_count(5)
        self.assertEqual(self.news_post.view_count, 6)

    def test_image_upload(self):
        """Test that images can be uploaded to news posts"""
        # Create a temporary image file
        with tempfile.NamedTemporaryFile(suffix='.jpg') as tmp_file:
            # Create a simple image file
            tmp_file.write(b'dummy image content')
            tmp_file.seek(0)
            
            # Create a news post with an image
            image_file = SimpleUploadedFile(
                name=os.path.basename(tmp_file.name),
                content=tmp_file.read(),
                content_type='image/jpeg'
            )
            
            news_with_image = SocietyNews.objects.create(
                society=self.society,
                title="News With Image",
                content="This post has an image",
                author=self.student,
                image=image_file
            )
            
            # Verify image was saved
            self.assertTrue(news_with_image.image)
            self.assertTrue(news_with_image.image.name.startswith('society_news/images/'))
            
            # Clean up the image file
            if news_with_image.image:
                path = news_with_image.image.path
                if os.path.isfile(path):
                    os.remove(path)

    def test_attachment_upload(self):
        """Test that file attachments can be uploaded to news posts"""
        # Create a temporary file
        with tempfile.NamedTemporaryFile(suffix='.pdf') as tmp_file:
            # Create a simple PDF file
            tmp_file.write(b'dummy PDF content')
            tmp_file.seek(0)
            
            # Create a news post with an attachment
            attachment_file = SimpleUploadedFile(
                name=os.path.basename(tmp_file.name),
                content=tmp_file.read(),
                content_type='application/pdf'
            )
            
            news_with_attachment = SocietyNews.objects.create(
                society=self.society,
                title="News With Attachment",
                content="This post has a PDF attachment",
                author=self.student,
                attachment=attachment_file
            )
            
            # Verify attachment was saved
            self.assertTrue(news_with_attachment.attachment)
            self.assertTrue(news_with_attachment.attachment.name.startswith('society_news/attachments/'))
            
            # Clean up the attachment file
            if news_with_attachment.attachment:
                path = news_with_attachment.attachment.path
                if os.path.isfile(path):
                    os.remove(path)

    def test_tags_field(self):
        """Test that tags can be added and retrieved as a JSON field"""
        tags = ["announcement", "important", "event"]
        
        # Create news with tags
        news_with_tags = SocietyNews.objects.create(
            society=self.society,
            title="Tagged News",
            content="This post has tags",
            author=self.student,
            tags=tags
        )
        
        # Retrieve from database to ensure tags are properly stored/retrieved
        retrieved_news = SocietyNews.objects.get(pk=news_with_tags.pk)
        self.assertEqual(retrieved_news.tags, tags)
        
        # Add a tag
        retrieved_news.tags.append("update")
        retrieved_news.save()
        
        # Verify tag was added
        updated_news = SocietyNews.objects.get(pk=news_with_tags.pk)
        self.assertEqual(len(updated_news.tags), 4)
        self.assertIn("update", updated_news.tags)

    def test_ordering(self):
        """Test that news posts are ordered by pinned status and creation date"""
        # Django's auto_now_add and auto_now fields can't be overridden with create()
        # We need a different approach to test ordering
        
        # First, delete the existing news post from setup to have a clean slate
        self.news_post.delete()
        
        # Create an older unpinned post
        older_unpinned = SocietyNews.objects.create(
            society=self.society,
            title="Older Unpinned Post",
            content="This post is not pinned and is older",
            author=self.student,
            is_pinned=False
        )
        
        # Manually update the created_at (bypassing auto_now_add)
        older_date = timezone.now() - timedelta(days=3)
        SocietyNews.objects.filter(pk=older_unpinned.pk).update(created_at=older_date)
        older_unpinned.refresh_from_db()
        
        # Create a newer unpinned post
        newer_unpinned = SocietyNews.objects.create(
            society=self.society,
            title="Newer Unpinned Post",
            content="This post is not pinned but is newer",
            author=self.student,
            is_pinned=False
        )
        
        # Create a pinned post (date doesn't matter as much since it should be first)
        pinned_post = SocietyNews.objects.create(
            society=self.society,
            title="Pinned Post",
            content="This post is pinned",
            author=self.student,
            is_pinned=True
        )
        # Set it to an older date
        older_pinned_date = timezone.now() - timedelta(days=5)
        SocietyNews.objects.filter(pk=pinned_post.pk).update(created_at=older_pinned_date)
        pinned_post.refresh_from_db()
        
        # Get ordered posts
        news_posts = list(SocietyNews.objects.filter(society=self.society))
        
        # Verify we have 3 posts
        self.assertEqual(len(news_posts), 3)
        
        # Pinned post should be first despite being older
        self.assertEqual(news_posts[0].id, pinned_post.id)
        self.assertTrue(news_posts[0].is_pinned)
        
        # Newer unpinned post should be second
        self.assertEqual(news_posts[1].id, newer_unpinned.id)
        
        # Older unpinned post should be last
        self.assertEqual(news_posts[2].id, older_unpinned.id)

    def test_author_deletion(self):
        """Test that news posts remain when author is deleted (SET_NULL)"""
        # We need a separate student for this test to avoid breaking other tests
        # and to avoid integrity errors with the society president relationship
        another_student = Student.objects.create_user(
            username="another_student",
            email="another@example.com",
            password="password123",
            role="student",
            first_name="Another",
            last_name="Student",
            status="Approved"
        )
        
        news_post = SocietyNews.objects.create(
            society=self.society,
            title="Orphaned News",
            content="This post will have its author deleted",
            author=another_student
        )
        
        # Store the post ID for later retrieval
        post_id = news_post.id
        
        # Delete the author
        another_student.delete()
        
        # Retrieve the post from database (refresh_from_db might not work if related object is deleted)
        orphaned_post = SocietyNews.objects.get(pk=post_id)
        
        # The post should still exist, but with author set to NULL
        self.assertIsNotNone(orphaned_post)
        self.assertIsNone(orphaned_post.author)

    def test_society_deletion(self):
        """Test that news posts are deleted when society is deleted (CASCADE)"""
        news_post = SocietyNews.objects.create(
            society=self.society,
            title="Doomed News",
            content="This post's society will be deleted",
            author=self.student
        )
        news_post_id = news_post.id
        
        # Delete the society
        self.society.delete()
        
        # The post should be deleted due to CASCADE
        with self.assertRaises(SocietyNews.DoesNotExist):
            SocietyNews.objects.get(id=news_post_id)

    def test_create_published_with_published_at(self):
        """Test creating a post with Published status sets published_at"""
        news_post = SocietyNews.objects.create(
            society=self.society,
            title="Published Directly",
            content="This post is published immediately",
            author=self.student,
            status="Published"
        )
        
        self.assertIsNotNone(news_post.published_at)
        self.assertEqual(news_post.status, "Published")

    def test_invalid_status_raises_error(self):
        """Test that invalid status values raise validation errors"""
        # Django doesn't validate choices at the database level by default
        # We need to use full_clean() to trigger validation
        invalid_post = SocietyNews(
            society=self.society,
            title="Invalid Status",
            content="This post has an invalid status",
            author=self.student,
            status="InvalidStatus"  # This is not a valid choice
        )
        
        # The validation should happen during full_clean
        from django.core.exceptions import ValidationError
        with self.assertRaises(ValidationError):
            invalid_post.full_clean()