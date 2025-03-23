import pytest
from django.utils import timezone
from django.db import IntegrityError, transaction
from django.core.exceptions import ValidationError
from datetime import timedelta

from api.models import (
    NewsPublicationRequest, 
    SocietyNews,
    Student, 
    User, 
    Society
)


@pytest.fixture
def admin_user():
    """Create an admin user for testing."""
    return User.objects.create_user(
        username='adminuser',
        email='admin@example.com',
        password='adminpassword',
        first_name='Admin',
        last_name='User',
        role='admin',
        is_staff=True
    )


@pytest.fixture
def student_user():
    """Create a student user for testing."""
    return Student.objects.create(
        username='studentuser',
        email='student@example.com',
        password='studentpassword',
        first_name='Student',
        last_name='User',
        role='student'
    )


@pytest.fixture
def society(student_user, admin_user):
    """Create a society for testing."""
    return Society.objects.create(
        name='Test Society',
        description='Society for testing',
        president=student_user,
        approved_by=admin_user,
        status='Approved'
    )


@pytest.fixture
def news_post(society, student_user):
    """Create a news post for testing."""
    return SocietyNews.objects.create(
        society=society,
        title='Test News Post',
        content='This is a test news post content',
        author=student_user,
        status='Draft'
    )


@pytest.fixture
def publication_request(news_post, student_user):
    """Create a publication request for testing."""
    return NewsPublicationRequest.objects.create(
        news_post=news_post,
        requested_by=student_user,
        status='Pending'
    )


@pytest.mark.django_db
class TestNewsPublicationRequestModel:
    """Test cases for the NewsPublicationRequest model."""

    def test_create_publication_request(self, news_post, student_user):
        """Test creating a new publication request."""
        request = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user
        )
        
        assert request.news_post == news_post
        assert request.requested_by == student_user
        assert request.status == 'Pending'  # Default status
        assert request.reviewed_by is None
        assert request.reviewed_at is None
        assert request.admin_notes is None
        
        # Check that requested_at is set and close to now
        assert request.requested_at is not None
        now = timezone.now()
        assert abs((request.requested_at - now).total_seconds()) < 10

    def test_string_representation(self, publication_request):
        """Test the string representation of the model."""
        expected_string = f"Publication request for '{publication_request.news_post.title}' - {publication_request.status}"
        assert str(publication_request) == expected_string

    def test_ordering(self, news_post, student_user):
        """Test that requests are ordered by requested_at in descending order."""
        # Create requests with different timestamps
        first_req = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user
        )
        
        # Manually set an older timestamp for the first request
        first_req.requested_at = timezone.now() - timedelta(days=1)
        first_req.save(update_fields=['requested_at'])
        
        second_req = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user
        )
        
        # Get all requests ordered by the model's Meta ordering
        requests = list(NewsPublicationRequest.objects.all())
        
        # The most recent request should come first
        assert requests[0] == second_req
        assert requests[1] == first_req

    def test_required_fields(self, news_post, student_user):
        """Test that required fields cannot be null."""
        # Test missing news_post - using transaction.atomic to contain the error
        from django.db import transaction
        
        # Test missing news_post
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                NewsPublicationRequest.objects.create(
                    requested_by=student_user
                )
        
        # Test missing requested_by
        with pytest.raises(IntegrityError):
            with transaction.atomic():
                NewsPublicationRequest.objects.create(
                    news_post=news_post
                )

    def test_approve_request(self, publication_request, admin_user):
        """Test approving a publication request."""
        # Initial state
        assert publication_request.status == 'Pending'
        assert publication_request.reviewed_by is None
        assert publication_request.reviewed_at is None
        assert publication_request.news_post.status == 'Draft'
        
        # Approve the request
        publication_request.status = 'Approved'
        publication_request.reviewed_by = admin_user
        publication_request.save()
        
        # Refresh from database
        publication_request.refresh_from_db()
        publication_request.news_post.refresh_from_db()
        
        # Check changes
        assert publication_request.status == 'Approved'
        assert publication_request.reviewed_by == admin_user
        assert publication_request.reviewed_at is not None
        assert publication_request.news_post.status == 'Published'
        assert publication_request.news_post.published_at is not None

    def test_reject_request(self, publication_request, admin_user):
        """Test rejecting a publication request."""
        # Initial state
        assert publication_request.status == 'Pending'
        assert publication_request.reviewed_by is None
        assert publication_request.reviewed_at is None
        assert publication_request.news_post.status == 'Draft'
        
        # Reject the request with notes
        publication_request.status = 'Rejected'
        publication_request.reviewed_by = admin_user
        publication_request.admin_notes = 'Content needs improvement'
        publication_request.save()
        
        # Refresh from database
        publication_request.refresh_from_db()
        publication_request.news_post.refresh_from_db()
        
        # Check changes
        assert publication_request.status == 'Rejected'
        assert publication_request.reviewed_by == admin_user
        assert publication_request.reviewed_at is not None
        assert publication_request.admin_notes == 'Content needs improvement'
        assert publication_request.news_post.status == 'Rejected'

    def test_save_without_status_change(self, publication_request):
        """Test that save without changing status doesn't update timestamp."""
        # Initial state check
        assert publication_request.reviewed_at is None
        
        # Save without changing status
        publication_request.admin_notes = 'Just a note'
        publication_request.save()
        
        # Verify reviewed_at is still None
        assert publication_request.reviewed_at is None
        
        # Verify news_post status hasn't changed
        assert publication_request.news_post.status == 'Draft'

    def test_delete_news_post_cascade(self, publication_request):
        """Test that deleting a news post cascades to the publication request."""
        news_post = publication_request.news_post
        news_post_id = news_post.id
        
        # Delete the news post
        news_post.delete()
        
        # Verify publication request is deleted
        with pytest.raises(NewsPublicationRequest.DoesNotExist):
            NewsPublicationRequest.objects.get(news_post_id=news_post_id)

    def test_delete_student_cascade(self, publication_request):
        """Test that deleting a student cascades to the publication request."""
        student = publication_request.requested_by
        request_id = publication_request.id
        
        # First detach the student from societies to avoid integrity errors
        Society.objects.filter(president=student).update(president=None)
        
        # Now delete the student
        student.delete()
        
        # Verify publication request is deleted
        with pytest.raises(NewsPublicationRequest.DoesNotExist):
            NewsPublicationRequest.objects.get(id=request_id)

    def test_delete_reviewer_set_null(self, publication_request, admin_user):
        """Test that deleting a reviewer sets the reviewer to NULL."""
        # Set a reviewer
        publication_request.status = 'Approved'
        publication_request.reviewed_by = admin_user
        publication_request.save()
        
        # Refresh from database
        publication_request.refresh_from_db()
        assert publication_request.reviewed_by == admin_user
        
        # Delete the admin user
        admin_user.delete()
        
        # Refresh from database
        publication_request.refresh_from_db()
        
        # Verify reviewer is set to None
        assert publication_request.reviewed_by is None
        
        # Verify the publication request still exists
        assert NewsPublicationRequest.objects.filter(id=publication_request.id).exists()

    def test_multiple_requests_for_same_news_post(self, news_post, student_user):
        """Test creating multiple publication requests for the same news post."""
        # Create a first request
        first_request = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user
        )
        
        # A second request should be allowed (no unique constraint)
        second_request = NewsPublicationRequest.objects.create(
            news_post=news_post,
            requested_by=student_user
        )
        
        assert first_request.id != second_request.id
        assert NewsPublicationRequest.objects.filter(news_post=news_post).count() == 2

    def test_invalid_status(self, publication_request):
        """Test that invalid status values are not allowed."""
        # Try to set an invalid status
        publication_request.status = 'InvalidStatus'
        
        # This should raise a validation error
        with pytest.raises(ValidationError):
            publication_request.full_clean()

    def test_direct_status_transition(self, publication_request, admin_user):
        """Test changing from Pending directly to other statuses."""
        # Set to Approved
        original_request_time = publication_request.requested_at
        
        # Wait a moment to ensure different timestamps
        time_before_approval = timezone.now()
        
        # Approve the request
        publication_request.status = 'Approved'
        publication_request.reviewed_by = admin_user
        publication_request.save()
        
        # Check status and timestamps
        publication_request.refresh_from_db()
        assert publication_request.status == 'Approved'
        assert publication_request.requested_at == original_request_time
        assert publication_request.reviewed_at >= time_before_approval

    def test_update_existing_review(self, publication_request, admin_user):
        """Test updating an already reviewed request."""
        # First approve the request
        publication_request.status = 'Approved'
        publication_request.reviewed_by = admin_user
        publication_request.save()
        
        first_review_time = publication_request.reviewed_at
        
        # Check the news post status after approval
        publication_request.news_post.refresh_from_db()
        assert publication_request.news_post.status == 'Published'
        
        # Change to Rejected
        publication_request.status = 'Rejected'
        publication_request.admin_notes = 'Changed my mind'
        publication_request.save()
        
        # Refresh from database
        publication_request.refresh_from_db()
        publication_request.news_post.refresh_from_db()
        
        # Check that reviewed_at was not updated again
        assert publication_request.reviewed_at == first_review_time
        
        # The news post status should remain 'Published' when changing from
        # 'Approved' to 'Rejected' because the model's save method only updates
        # the news post status on the initial status change, not on subsequent changes
        assert publication_request.news_post.status == 'Published'