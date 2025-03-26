import uuid
from rest_framework.test import APITestCase
from rest_framework import status
from api.models import AdminReportRequest, ReportReply, Student, User, Society

class TestReportThreadView(APITestCase):

    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="adminuser",
            email=f"admin_{uuid.uuid4().hex}@example.com",
            password="adminpass",
            role="admin",
            is_super_admin=True,
            is_staff=True
        )

        self.student_user = Student.objects.create_user(
            username="studentuser",
            email=f"student_{uuid.uuid4().hex}@example.com",
            password="studentpass",
            role="student"
        )

        self.president_user = Student.objects.create_user(
            username="presidentuser",
            email=f"president_{uuid.uuid4().hex}@example.com",
            password="presidentpass",
            role="student"
        )

        self.society = Society.objects.create(
            name="Test Society",
            description="A society for testing.",
            president=self.president_user,
            approved_by=self.admin_user,
            status="Approved",
            category="General"
        )

        
        self.president_user.president_of = self.society
        self.president_user.save()

        self.other_user = Student.objects.create_user(
            username="otheruser",
            email=f"other_{uuid.uuid4().hex}@example.com",
            password="otherpass",
            role="student"
        )

        self.report = AdminReportRequest.objects.create(
            report_type="Feedback",
            subject="Test Subject",
            details="Test report details.",
            from_student=self.student_user
        )

        self.top_reply = ReportReply.objects.create(
            report=self.report,
            content="Admin initial reply",
            replied_by=self.admin_user,
            is_admin_reply=True
        )

    def test_president_can_access_report_thread(self):
        self.client.force_authenticate(self.president_user)

        
        self.president_user.refresh_from_db()
        print(f"President User ID: {self.president_user.id}")
        print(f"President User is_president: {self.president_user.is_president}")
        print(f"President of Society: {self.president_user.president_of.name if self.president_user.president_of else 'None'}")

        associated_societies = Society.objects.filter(president=self.president_user)
        print(f"Societies where user is president: {[soc.name for soc in associated_societies]}")

        response = self.client.get(f"/api/reports/thread/{self.report.id}/")

        print("Response Status Code:", response.status_code)
        print("Response Data:", response.data)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('replies', response.data)
        self.assertEqual(response.data['id'], self.report.id)
        self.assertTrue(any(reply['content'] == "Admin initial reply" for reply in response.data['replies']))