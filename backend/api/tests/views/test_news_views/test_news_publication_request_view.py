import json
import logging
from django.urls import reverse
from django.contrib.auth import get_user_model
from rest_framework import status
from rest_framework.test import APITestCase
from unittest.mock import patch, MagicMock

from api.models import SocietyNews, NewsPublicationRequest, Society, Student


class NewsPublicationRequestViewTests(APITestCase):
    def setUp(self):
        User = get_user_model()

        self.user = User.objects.create_user(
            username="normaluser",
            password="normalpass",
            email="normal@example.com"
        )

        self.student = Student.objects.create_user(
            username="studentuser",
            password="studentpass",
            email="student@example.com",
            major="Computer Science"
        )

        self.admin = User.objects.create_user(
            username="adminuser",
            password="adminpass",
            email="admin@example.com"
        )
        self.admin.role = "admin"
        self.admin.save()

        self.society = Society.objects.create(
            name="Test Society",
            description="Test society",
            president=self.student,
            social_media_links={}
        )
        self.news_post = SocietyNews.objects.create(
            society=self.society,
            title="Test News Post",
            content="Some content",
            status="Draft"
        )
        self.news_post.author = self.student
        self.news_post.save()

        pending_news = SocietyNews.objects.create(
            society=self.society,
            title="Pending News",
            content="Content pending",
            status="PendingApproval"
        )
        self.npr_pending = NewsPublicationRequest.objects.create(
            news_post=pending_news,
            requested_by=self.student,
            status="Pending",
            admin_notes=""
        )

        approved_news = SocietyNews.objects.create(
            society=self.society,
            title="Approved News",
            content="Content approved",
            status="Published"
        )
        self.npr_approved = NewsPublicationRequest.objects.create(
            news_post=approved_news,
            requested_by=self.student,
            status="Approved",
            admin_notes="Approved by admin"
        )

        superseded_news = SocietyNews.objects.create(
            society=self.society,
            title="Superseded News",
            content="Content superseded",
            status="Rejected"
        )
        self.npr_superseded = NewsPublicationRequest.objects.create(
            news_post=superseded_news,
            requested_by=self.student,
            status="Superseded_Approved",
            admin_notes="Superseded request"
        )
        self.url = reverse("news_publication_request")

    def test_post_not_student(self):
        self.client.force_authenticate(user=self.user)
        data = {"news_post": self.news_post.id}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get("error"), "Only students can submit publication requests")

    def test_post_missing_news_post_id(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("error"), "News post ID is required")

    @patch("api.views_files.news_views.get_object_by_id_or_name")
    def test_post_news_not_found(self, mock_get_object):
        self.client.force_authenticate(user=self.student)
        mock_get_object.return_value = None
        data = {"news_post": 9999}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data.get("error"), "News post not found")

    @patch("api.views_files.news_views.has_society_management_permission")
    @patch("api.views_files.news_views.get_object_by_id_or_name")
    def test_post_no_permission(self, mock_get_object, mock_has_permission):
        self.client.force_authenticate(user=self.student)
        self.news_post.author = None
        self.news_post.save()
        mock_get_object.return_value = self.news_post
        mock_has_permission.return_value = False

        data = {"news_post": self.news_post.id}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get("error"), "You do not have permission to publish this news post")

    @patch("api.views_files.news_views.NewsPublicationRequest.objects.filter")
    @patch("api.views_files.news_views.cancel_pending_requests")
    @patch("api.views_files.news_views.mark_previous_requests_superseded")
    @patch("api.views_files.news_views.has_society_management_permission")
    @patch("api.views_files.news_views.get_object_by_id_or_name")
    def test_post_existing_pending_request(self, mock_get_object, mock_has_permission, mock_mark_prev, mock_cancel_pending, mock_filter):
        self.client.force_authenticate(user=self.student)
        mock_get_object.return_value = self.news_post
        mock_qs = MagicMock()
        mock_qs.exists.return_value = True
        mock_filter.return_value = mock_qs

        data = {"news_post": self.news_post.id}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("error"), "A publication request for this news post is already pending")

    @patch("api.views_files.news_views.cancel_pending_requests")
    @patch("api.views_files.news_views.mark_previous_requests_superseded")
    @patch("api.views_files.news_views.has_society_management_permission")
    @patch("api.views_files.news_views.get_object_by_id_or_name")
    @patch("api.views_files.news_views.NewsPublicationRequest.objects.filter")
    def test_post_success(self, mock_filter, mock_get_object, mock_has_permission, mock_mark_prev, mock_cancel_pending):
        self.client.force_authenticate(user=self.student)
        mock_get_object.return_value = self.news_post
        mock_has_permission.return_value = True
        mock_mark_prev.return_value = None
        mock_cancel_pending.return_value = None

        mock_qs = MagicMock()
        mock_qs.exists.return_value = False
        mock_filter.return_value = mock_qs

        data = {"news_post": self.news_post.id}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("id", response.data)
        self.assertEqual(response.data.get("news_post"), self.news_post.id)
        self.assertEqual(response.data.get("status"), "Pending")

    def test_get_requests_as_student(self):
        self.client.force_authenticate(user=self.student)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        requests = response.data
        for req in requests:
            self.assertNotIn(req["status"], ["Superseded_Approved", "Superseded_Rejected"])
        self.assertEqual(len(requests), 2)

    def test_get_requests_as_admin_default(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        for req in response.data:
            self.assertEqual(req["status"], "Pending")
        self.assertEqual(len(response.data), 1)

    def test_get_requests_as_admin_all_statuses(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(self.url + "?all_statuses=true")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_get_requests_unauthorized(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data.get("error"), "Unauthorized")

    @patch("api.views_files.news_views.cancel_pending_requests")
    @patch("api.views_files.news_views.mark_previous_requests_superseded")
    @patch("api.views_files.news_views.has_society_management_permission")
    @patch("api.views_files.news_views.get_object_by_id_or_name")
    @patch("api.views_files.news_views.NewsPublicationRequest.objects.filter")
    def test_post_with_last_rejection_date(self, mock_filter, mock_get_object, mock_has_permission, mock_mark_prev, mock_cancel_pending):
        self.client.force_authenticate(user=self.student)
        from datetime import datetime
        dt = datetime(2025, 4, 1, 15, 30)
        self.news_post.last_rejection_date = dt

        mock_get_object.return_value = self.news_post
        mock_has_permission.return_value = True
        mock_mark_prev.return_value = None
        mock_cancel_pending.return_value = None
        mock_qs = MagicMock()
        mock_qs.exists.return_value = False
        mock_filter.return_value = mock_qs

        data = {"news_post": self.news_post.id}
        response = self.client.post(self.url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        expected_notes = f"Resubmission of previously rejected post (rejected on {dt.strftime('%Y-%m-%d %H:%M')})"
        self.assertEqual(response.data.get("admin_notes"), expected_notes)

