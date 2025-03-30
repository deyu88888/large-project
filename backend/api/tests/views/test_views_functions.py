from datetime import date, timedelta
import json
import os
from random import choice
from unittest.mock import patch
from django.conf import settings
from django.urls import reverse
from PIL import Image
from rest_framework.test import APITestCase
from api.models import Student, User, Society, Event, Comment
from api.views import *
from api.tests.file_deletion import delete_file


class TestViewFunctions(APITestCase):
    """Unit tests for the toggle_follow view."""

    def setUp(self):
        self.admin = User.objects.create(
            username="admin_user",
            first_name="John",
            last_name="Smith",
            email="admin@example.com",
            role="admin",
            password="adminpassword",
        )
        self.student = Student.objects.create(
            username="QWERTY",
            first_name="QWE",
            last_name="RTY",
            email="qwerty@kcl.ac.uk",
            role="student",
            major="CompSci",
        )
        self.student1 = Student.objects.create(
            username="John",
            first_name="John",
            last_name="Smith",
            email="JohnSmith@gmail.com",
            role="student",
            major="CompSci",
        )

        self.society = Society.objects.create(
            name="Tech",
            president=self.student1,
            approved_by=self.admin,
            category="Technology",
            social_media_links={"Email": "techsociety@example.com"},
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.student1.is_president = True
        self.student1.president_of = self.society
        self.student1.save()

    def test_get_popular_societies(self):
        """Test that get_popular_societies gets the 5 most popular societies"""
        society2 = Society.objects.create(
            name="Maths",
            president=self.student,
            approved_by=self.admin,
            category="Technology",
            social_media_links={"Email": "techsociety@example.com"},
            membership_requirements="Members must attend at least 3 events per semester",
            upcoming_projects_or_plans="Plan to host a Tech Fest in May",
        )
        self.student.is_president = True
        self.student.president_of = society2
        self.student.save()
        for i in range(5):
            student = Student.objects.create(
                username=f"QWERTY{i}",
                first_name="QWE",
                last_name="RTY",
                email=f"qwerty{i}@gmail.com",
                role="student",
                major="CompSci",
            )
            society2.society_members.add(student)
            society2.save()
        self.client.force_authenticate(user=self.student)

        url = reverse("popular_societies")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertGreater(
            society2.society_members.count(),
            self.society.society_members.count()
        )
        self.assertEqual(response.data[0]["id"], self.society.id)
        self.assertEqual(response.data[1]["id"], society2.id)
        with self.assertRaises(IndexError):
            response.data[2]

    def test_get_upcoming_events(self):
        """Test that get_upcoming_events gets the 5 soonest events"""
        event_list = self.get_list_of_events()
        self.client.force_authenticate(user=self.student)

        url = reverse("upcoming_events")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 5)
        for i in range(5):
            self.assertEqual(event_list[i].id, response.data[i]["id"])
        with self.assertRaises(IndexError):
            response.data[5]

    def test_get_sorted_events(self):
        """Test that get_sorted_events gets all events by time"""
        event_list = self.get_list_of_events()
        self.client.force_authenticate(user=self.student)

        url = reverse("sorted_events")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 6)
        for i in range(6):
            self.assertEqual(event_list[i].id, response.data[i]["id"])
        with self.assertRaises(IndexError):
            response.data[6]

    def test_custom_media_view_jpg(self):
        """Test that custom_media_view correctly serves media files"""
        image_path = self.student.icon

        self.client.force_authenticate(user=self.student)

        url = reverse("media", kwargs={"path": image_path})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response["Content-Type"], "image/jpeg")

        try:
            expected_file_path = os.path.join(settings.MEDIA_ROOT, image_path.name)
            with open(expected_file_path, "rb") as f:
                expected_content = f.read()
        except FileNotFoundError as error:
            self.fail(error)

        actual_content = b"".join(response.streaming_content)
        self.assertEqual(actual_content, expected_content)

    def test_custom_media_view_pdf(self):
        """Test that custom_media_view correctly serves media files"""
        pdf_path = "test_document.pdf"
        expected_file_path = os.path.join(settings.MEDIA_ROOT, pdf_path)
        os.makedirs(os.path.dirname(expected_file_path), exist_ok=True)

        pdf_content = b"%PDF-1.4\n%%EOF\n"
        try:
            with open(expected_file_path, "wb") as f:
                f.write(pdf_content)
        except FileNotFoundError as error:
            self.fail(f"Failed to create test PDF: {error}")

        self.client.force_authenticate(user=self.student)

        url = reverse("media", kwargs={"path": pdf_path})
        response = self.client.get(url)
        self.assertEqual(response.status_code, 200)

        self.assertEqual(response["Content-Type"], "application/pdf")

        try:
            with open(expected_file_path, "rb") as f:
                expected_content = f.read()
        except FileNotFoundError as error:
            self.fail(error)

        actual_content = b"".join(response.streaming_content)
        self.assertEqual(actual_content, expected_content)
        delete_file(expected_file_path)

    def test_like_comment(self):
        """Test that like_comment adds/removes a user to a Comment likes"""
        event = Event.objects.create(
            title="Event1",
            main_description="Description",
            location="Online",
            status="Approved",
            hosted_by=self.society,
            date=date.today() + timedelta(days=1)
        )
        comment = Comment.objects.create(
            event=event,
            user=choice(self.society.society_members.all()),
            content="content",
        )
        self.client.force_authenticate(user=self.student)
        student_user = User.objects.get(pk=self.student.pk)

        url = reverse("like_comment", kwargs={"comment_id": comment.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn(student_user, comment.likes.all())

        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(student_user, comment.likes.all())

    def test_dislike_comment(self):
        """Test that dislike_comment adds/removes a user to a Comment dislikes"""
        event = Event.objects.create(
            title="Event1",
            main_description="Description",
            location="Online",
            status="Approved",
            hosted_by=self.society,
            date=date.today() + timedelta(days=1)
        )
        comment = Comment.objects.create(
            event=event,
            user=choice(self.society.society_members.all()),
            content="content",
        )
        self.client.force_authenticate(user=self.student)
        student_user = User.objects.get(pk=self.student.pk)

        url = reverse("dislike_comment", kwargs={"comment_id": comment.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertIn(student_user, comment.dislikes.all())

        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(student_user, comment.dislikes.all())

    def test_follow_self(self):
        """Test correct behaviour when we try to follow ourself"""
        self.client.force_authenticate(user=self.student)
        url = reverse("toggle_follow", kwargs={"user_id": self.student.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 400)

        student_user = User.objects.get(pk=self.student.pk)
        self.assertNotIn(student_user, self.student.following.all())
        self.assertNotIn(student_user, self.student.follower.all())

    def test_follow_other(self):
        """Test correct behaviour when we try to follow ourself"""
        self.client.force_authenticate(user=self.student)
        url = reverse("toggle_follow", kwargs={"user_id": self.student1.id})
        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)

        student1_user = User.objects.get(pk=self.student1.pk)
        student_user = User.objects.get(pk=self.student.pk)
        self.assertIn(student1_user, self.student.following.all())

        response = self.client.post(url)
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(student1_user, self.student.following.all())

    def test_check_email_pass(self):
        """Test that the email verification fails with no data passed"""
        self.client.force_authenticate(user=self.student)
        url = reverse("check_email")
        response = self.client.post(url)
        self.assertEqual(response.status_code, 500)

    def test_check_email_not_post(self):
        """Test that the email verification fails if not accessed as post"""
        self.client.force_authenticate(user=self.student)
        url = reverse("check_email")
        response = self.client.put(url)
        self.assertEqual(response.status_code, 400)
        response = self.client.get(url)
        self.assertEqual(response.status_code, 400)

    def test_check_email_valid(self):
        """Test that the email verification succeeds for kcl email"""
        data = {"email": self.student.email}
        self.client.force_authenticate(user=self.student)
        url = reverse("check_email")
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 200)

    def test_check_email_invalid(self):
        """Test that the email verification fails for non-kcl email"""
        data = {"email": self.student1.email}
        self.client.force_authenticate(user=self.student)
        url = reverse("check_email")
        response = self.client.post(
            url,
            data=json.dumps(data),
            content_type="application/json"
        )
        self.assertEqual(response.status_code, 400)

    def test_upload_avatar_not_post(self):
        """Test the outcome when not calling via a post request"""
        self.client.force_authenticate(user=self.student)
        url = reverse("upload_avatar")
        response = self.client.get(url)
        self.assertEqual(response.status_code, 405)
        response = self.client.put(url)
        self.assertEqual(response.status_code, 405)

    def test_upload_avatar_invalid_student(self):
        """Test that if an invalid_student tries to upload an avatar it fails"""
        self.client.force_authenticate(user=self.admin)
        url = reverse("upload_avatar")
        response = self.client.post(url)
        self.assertEqual(response.status_code, 403)

    def test_upload_avatar_invalid_crop(self):
        """Test failure with invalid crop params"""
        self.client.force_authenticate(user=self.student)
        image_file = self.student.icon
        crop_data = {
            "crop_x": -10,
            "crop_y": 50,
            "crop_width": 0.124,
            "crop_height": 50,
        }

        url = reverse("upload_avatar")
        response = self.client.post(
            url,
            data={**crop_data, "image": image_file},
            format="multipart"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "Invalid crop params.")

    @patch ("api.views.Image.open")
    def test_upload_avatar_image_corrupt(self, mock_open):
        """Test failure with corrupt image"""
        mock_open.return_value = None
        self.client.force_authenticate(user=self.student)
        image_file = self.student.icon
        crop_data = {
            "crop_x": 50,
            "crop_y": 50,
            "crop_width": 50,
            "crop_height": 50,
        }

        url = reverse("upload_avatar")
        response = self.client.post(
            url,
            data={**crop_data, "image": image_file},
            format="multipart"
        )
        self.assertEqual(response.status_code, 500)
        self.assertEqual(response.data["detail"], "Image processing failed.")

    def test_upload_avatar_no_image(self):
        """Test failure when upload has no image"""
        self.client.force_authenticate(user=self.student)
        crop_data = {
            "crop_x": 50,
            "crop_y": 50,
            "crop_width": 50,
            "crop_height": 50,
        }

        url = reverse("upload_avatar")
        response = self.client.post(
            url,
            data={**crop_data},
            format="multipart"
        )
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.data["detail"], "No image uploaded.")

    def test_upload_avatar_success(self):
        """Test successful avatar upload by an authenticated student."""
        self.client.force_authenticate(user=self.student)
        image_file = self.student.icon
        crop_data = {
            "crop_x": 50,
            "crop_y": 50,
            "crop_width": 50,
            "crop_height": 50,
        }

        url = reverse("upload_avatar")
        response = self.client.post(
            url,
            data={**crop_data, "image": image_file},
            format="multipart"
        )

        self.assertEqual(response.status_code, 200)
        self.assertIn("icon", response.data)
        self.assertTrue(response.data["icon"].startswith("/api/media/"), response.data["icon"])

        self.student.refresh_from_db()
        saved_img = Image.open(self.student.icon.path)
        self.assertEqual(saved_img.size, (300, 300))

    def get_list_of_events(self):
        """Returns a list of 6 events ordered by date"""
        event_list = []
        for i in range(6):
            event_list.append(Event.objects.create(
                title=f"Event{i}",
                main_description="Description",
                location="Online",
                status="Approved",
                hosted_by=self.society,
                date=date.today() + timedelta(days=i+1)
            ))
        return event_list
