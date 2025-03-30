import json
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.utils import timezone
from rest_framework.test import APIRequestFactory
from django.contrib.auth.models import AnonymousUser
from io import BytesIO
from PIL import Image


from api.models import (
    User, Student, Society, SocietyNews, NewsComment, NewsPublicationRequest
)
from api.serializers import SocietyNewsSerializer


class SocietyNewsSerializerTest(TestCase):
    """Test suite for SocietyNewsSerializer"""

    def setUp(self):
        """Set up test data"""
        
        self.admin_user = User.objects.create_user(
            username="admin_user",
            email="admin@example.com",
            password="password123",
            role="admin"
        )
        self.admin_user.is_staff = True
        self.admin_user.save()
        
        self.student = Student._default_manager.create_user(
            username="student1",
            email="student1@example.com",
            password="password123",
            first_name="Student",
            last_name="One",
            role="student",
            major="Computer Science",
            status="Approved"
        )
        
        self.student2 = Student._default_manager.create_user(
            username="student2",
            email="student2@example.com",
            password="password123",
            first_name="Student",
            last_name="Two",
            role="student",
            major="Business",
            status="Approved"
        )
        
        self.society = Society.objects.create(
            name="Test Society",
            description="This is a test society",
            president=self.student,
            status="Approved",
            approved_by=self.admin_user,
            category="Academic"
        )
        
        image = BytesIO()
        Image.new('RGB', (100, 100)).save(image, 'JPEG')
        image.seek(0)
        self.test_image = SimpleUploadedFile("test_image.jpg", image.getvalue(), content_type="image/jpeg")
        
        self.test_attachment = SimpleUploadedFile("test_doc.pdf", b"Test document content", content_type="application/pdf")
        
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title="Test News",
            content="This is a test news post",
            author=self.student,
            status="Published",
            published_at=timezone.now(),
            is_featured=True,
            is_pinned=False,
            tags=["test", "news"]
        )
        
        self.comment1 = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student,
            content="This is a test comment"
        )
        
        self.comment2 = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student2,
            content="This is another test comment"
        )
        
        self.reply = NewsComment.objects.create(
            news_post=self.news_post,
            user=self.student,
            content="This is a reply",
            parent_comment=self.comment2
        )
        
        self.factory = APIRequestFactory()
        
    def test_serializer_contains_expected_fields(self):
        """Test that the serializer contains the expected fields"""
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        expected_fields = [
            'id', 'title', 'content', 'image_url', 'attachment_url', 'attachment_name', 
            'author_data', 'society_data', 'created_at', 'updated_at', 
            'published_at', 'status', 'is_featured', 'is_pinned',
            'tags', 'view_count', 'comment_count', 'is_author', 'comments',
            'admin_notes'
        ]
        
        self.assertEqual(set(data.keys()), set(expected_fields))
        
    def test_author_data_serialization(self):
        """Test that author data is correctly serialized"""
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertEqual(data['author_data']['id'], self.student.id)
        self.assertEqual(data['author_data']['username'], self.student.username)
        self.assertEqual(data['author_data']['first_name'], self.student.first_name)
        self.assertEqual(data['author_data']['last_name'], self.student.last_name)
        self.assertEqual(data['author_data']['full_name'], self.student.full_name)
        
    def test_society_data_serialization(self):
        """Test that society data is correctly serialized"""
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertEqual(data['society_data']['id'], self.society.id)
        self.assertEqual(data['society_data']['name'], self.society.name)
        
    def test_comment_count(self):
        """Test that comment count is correctly calculated"""
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertEqual(data['comment_count'], 3)
        
    def test_is_author_field_when_true(self):
        """Test is_author field returns True when current user is the author"""
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertTrue(data['is_author'])
        
    def test_is_author_field_when_false(self):
        """Test is_author field returns False when current user is not the author"""
        request = self.factory.get("/")
        request.user = self.student2
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertFalse(data['is_author'])
        
    def test_comments_serialization(self):
        """Test that comments are correctly serialized"""
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertEqual(len(data['comments']), 2)
        
        comment_ids = [comment['id'] for comment in data['comments']]
        self.assertIn(self.comment1.id, comment_ids)
        self.assertIn(self.comment2.id, comment_ids)
        
    def test_admin_notes_when_rejected(self):
        """Test admin_notes field when news post is rejected"""
        
        self.news_post.status = "Rejected"
        self.news_post.save()
        
        rejection_notes = "Content not appropriate for the platform"
        rejected_request = NewsPublicationRequest.objects.create(
            news_post=self.news_post,
            requested_by=self.student,
            reviewed_by=self.admin_user,
            status="Rejected",
            reviewed_at=timezone.now(),
            admin_notes=rejection_notes
        )
        
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertEqual(data['admin_notes'], rejection_notes)
        
    def test_admin_notes_when_not_rejected(self):
        """Test admin_notes field when news post is not rejected"""
        
        self.news_post.status = "Published"
        self.news_post.save()
        
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertIsNone(data['admin_notes'])
        
    def test_validate_valid_data(self):
        """Test validation with valid data"""
        valid_data = {
            'society': self.society.id,
            'title': 'New Test Title',
            'content': 'New test content',
            'status': 'Draft',
            'tags': ['test', 'new']
        }
        
        serializer = SocietyNewsSerializer(data=valid_data)
        self.assertTrue(serializer.is_valid())
        
    def test_validate_missing_title_for_published(self):
        """Test validation rejects published post without title"""
        invalid_data = {
            'content': 'Test content',
            'status': 'Published',
            'tags': ['test']
        }
        
        serializer = SocietyNewsSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('title', serializer.errors)
        
    def test_validate_invalid_status(self):
        """Test validation rejects invalid status"""
        invalid_data = {
            'title': 'Test Title',
            'content': 'Test content',
            'status': 'InvalidStatus',
        }
        
        serializer = SocietyNewsSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('status', serializer.errors)
        
    def test_validate_tags_conversion(self):
        """Test validation converts string tags to list"""
        data_with_string_tags = {
            'society': self.society.id,
            'title': 'Test Title',
            'content': 'Test content',
            'status': 'Draft',
            'tags': json.dumps(['test', 'tags'])
        }
        
        serializer = SocietyNewsSerializer(data=data_with_string_tags)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['tags'], ['test', 'tags'])
        
    def test_create_with_author_from_request(self):
        """Test create sets author from request context"""
        request = self.factory.post("/")
        request.user = self.student
        
        data = {
            'society': self.society.id,
            'title': 'New Test News',
            'content': 'This is new test content',
            'status': 'Draft',
            'tags': ['new', 'test']
        }
        
        serializer = SocietyNewsSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        news = serializer.save()
        
        self.assertEqual(news.author, self.student)
        self.assertEqual(news.title, 'New Test News')
        
    def test_create_with_file_uploads(self):
        """Test create with image and attachment uploads"""
        request = self.factory.post("/")
        request.user = self.student
        
        data = {
            'society': self.society.id,
            'title': 'Test with Files',
            'content': 'This is a test with file uploads',
            'status': 'Draft',
            'image': self.test_image,
            'attachment': self.test_attachment
        }
        
        serializer = SocietyNewsSerializer(data=data, context={'request': request})
        self.assertTrue(serializer.is_valid())
        
        news = serializer.save()
        
        self.assertIsNotNone(news.image)
        self.assertIsNotNone(news.attachment)
        
    def test_serializer_with_multiple_news_posts(self):
        """Test serializer with multiple news posts"""
        
        news2 = SocietyNews.objects.create(
            society=self.society,
            title="Second News",
            content="This is the second test news post",
            author=self.student,
            status="Draft"
        )
        
        news3 = SocietyNews.objects.create(
            society=self.society,
            title="Third News",
            content="This is the third test news post",
            author=self.student2,
            status="PendingApproval"
        )
        
        request = self.factory.get("/")
        request.user = self.student
        
        news_posts = SocietyNews.objects.filter(society=self.society)
        serializer = SocietyNewsSerializer(news_posts, many=True, context={'request': request})
        data = serializer.data
        
        self.assertEqual(len(data), 3)
        
        for item in data:
            self.assertIn('id', item)
            self.assertIn('title', item)
            self.assertIn('content', item)
            self.assertIn('author_data', item)
            
    
    def test_attachment_url_serialization(self):
        """Test that attachment URL is correctly serialized"""
        news_with_attachment = SocietyNews.objects.create(
            society=self.society,
            title="News with Attachment",
            content="This post has an attachment",
            author=self.student,
            status="Published",
            attachment=self.test_attachment
        )
        
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(news_with_attachment, context={"request": request})
        data = serializer.data
        
        self.assertIsNotNone(data['attachment_url'])
        self.assertIsNotNone(data['attachment_name'])
        
        attachment_name = data['attachment_name']
        self.assertTrue(attachment_name.startswith("test_doc"))
        self.assertTrue(attachment_name.endswith(".pdf"))
    
    def test_tags_conversion_with_single_string(self):
        """Test tags conversion with a single string value"""
        data_with_single_string = {
            'society': self.society.id,
            'title': 'Test Title',
            'content': 'Test content',
            'status': 'Draft',
            'tags': 'singletag'
        }
        
        serializer = SocietyNewsSerializer(data=data_with_single_string)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['tags'], ['singletag'])
    
    def test_tags_conversion_with_empty_string(self):
        """Test tags conversion with an empty string"""
        data_with_empty_string = {
            'society': self.society.id,
            'title': 'Test Title',
            'content': 'Test content',
            'status': 'Draft',
            'tags': ''
        }
        
        serializer = SocietyNewsSerializer(data=data_with_empty_string)
        self.assertTrue(serializer.is_valid())
        
        tags_value = serializer.validated_data.get('tags', None)
        self.assertTrue(tags_value == [] or tags_value == '' or tags_value is None, 
                      f"Expected empty value, got: {tags_value}")
    
    def test_tags_conversion_with_non_string_non_list(self):
        """Test tags conversion with a non-string, non-list value (like a number)"""
        data_with_number = {
            'society': self.society.id,
            'title': 'Test Title',
            'content': 'Test content',
            'status': 'Draft',
            'tags': 123
        }
        
        serializer = SocietyNewsSerializer(data=data_with_number)
        self.assertTrue(serializer.is_valid())
        self.assertEqual(serializer.validated_data['tags'], ['123'])
    
    def test_author_data_with_no_author(self):
        """Test behavior when news post has no author"""
        news_without_author = SocietyNews.objects.create(
            society=self.society,
            title="No Author News",
            content="This post has no author",
            status="Draft"
        )
        
        request = self.factory.get("/")
        request.user = self.student
        
        serializer = SocietyNewsSerializer(news_without_author, context={"request": request})
        data = serializer.data
        
        self.assertIsNone(data['author_data'])
    
    def test_is_author_when_not_authenticated(self):
        """Test is_author field when user is not authenticated"""
        request = self.factory.get("/")
        request.user = AnonymousUser()
        
        serializer = SocietyNewsSerializer(self.news_post, context={"request": request})
        data = serializer.data
        
        self.assertFalse(data['is_author'])
    
    def test_create_without_request_context(self):
        """Test create method behavior without request context"""
        data = {
            'society': self.society.id,
            'title': 'Test Without Context',
            'content': 'This post is created without request context',
            'status': 'Draft',
            'author': self.student.id  # Explicitly provide author
        }
        
        serializer = SocietyNewsSerializer(data=data)
        self.assertTrue(serializer.is_valid())
        
        news = serializer.save()
        
        self.assertEqual(news.author, self.student)
        self.assertEqual(news.title, 'Test Without Context')