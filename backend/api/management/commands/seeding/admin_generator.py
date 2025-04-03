from random import choice, random
from api.models import User, AdminReportRequest, Society, ReportReply
from api.management.commands.seeding.seeding_utility import create_report, \
    get_model_entries_as_list
from django.contrib.auth.hashers import make_password
from django.core.management import color_style


class AdminGenerator():
    """A class used to generate all data related to admins"""
    def __init__(self):
        self.style = color_style()

    def create_admin(self, n):
        """Create n different admins"""
        for i in range(1, n+1):
            print(f"Seeding admin {i}/{n}", end='\r', flush=True)
            User.objects.get_or_create(
                username=f"admin{i}",
                email=f"admin{i}@example.com",
                first_name=f"admin{i}",
                last_name="User",
                role="admin",
                is_staff=True,
                defaults={"password": make_password("adminpassword")},
            )
        print(self.style.SUCCESS(f"Seeding admin {n}/{n}"), flush=True)

    def create_super_admins(self):
        """Creates a pre-defined number of super-admins"""
        super_admins = [
            {"username": "superadmin1",
            "email": "superadmin1@example.com",
            "first_name": "Alice", "last_name": "Smith"},
            {"username": "superadmin2",
            "email": "superadmin2@example.com",
            "first_name": "Bob", "last_name": "Johnson"},
        ]

        for admin in super_admins:
            _, created = User.objects.get_or_create(
                username=admin["username"],
                email=admin["email"],  # Required field - must be passed directly
                first_name=admin["first_name"],  # Required field - must be passed directly
                last_name=admin["last_name"],  # Required field - must be passed directly
                defaults={
                    "password": make_password("superadminpassword"),
                    "is_super_admin": True,
                    "role": "admin",
                    "is_staff": True
                },
            )

            suffix = "created" if created else "already exists"
            style = self.style.SUCCESS if created else self.style.WARNING
            print(style(f"Super Admin '{admin['username']}' {suffix}."))

    def create_admin_reports(self, n):
        """Seeds the db with entries for AdminReportRequest & ReportReply"""
        types = ["Misconduct", "System Issue", "Society Issue", "Event Issue", "Other"]

        societies = get_model_entries_as_list(Society)
        if not societies:
            print("No society found to report within")
        else:
            for i in range(n):
                society = choice(societies)
                student = choice(list(society.society_members.all()))
                report_type = choice(types)
                report = create_report(society, student, report_type, i)
                self.create_report_responses(report)
                print(f"Created report: {report}")

    def create_report_responses(self, report_request: AdminReportRequest):
        """Seed repsonses to a report request"""
        prev_reply = None
        responder = None
        admins = list(User.get_admins())
        while random() < 0.8:
            if prev_reply is None or not prev_reply.is_admin_reply:
                responder = choice(admins)
            else:
                responder = report_request.from_student
            rep_reply = ReportReply.objects.create(
                report=report_request,
                parent_reply = prev_reply,
                content = "This is content for a report reply",
                replied_by = responder,
                is_admin_reply = True if responder in admins else False,
            )
            prev_reply = rep_reply
