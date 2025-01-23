from django.core.management.base import BaseCommand
from api.models import Admin, Advisor, Student, Society

class Command(BaseCommand):
    help = "Seed the database with admin, advisor, student, and president users"

    def handle(self, *args, **kwargs):
        # Create Admin
        admin, created = Admin.objects.get_or_create(
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            defaults={"password": "adminpassword"}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Admin created: {admin.username}"))
        else:
            self.stdout.write(f"Admin already exists: {admin.username}")

        # Create Advisor
        advisor, created = Advisor.objects.get_or_create(
            username="advisor_user",
            email="advisor@example.com",
            first_name="Advisor",
            last_name="User",
            defaults={"password": "advisorpassword", "department": "Engineering"},
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Advisor created: {advisor.username}"))
        else:
            self.stdout.write(f"Advisor already exists: {advisor.username}")

        # Create a regular Student
        student, created = Student.objects.get_or_create(
            username="student_user",
            email="student@example.com",
            first_name="Student",
            last_name="User",
            defaults={"password": "studentpassword", "major": "Computer Science"}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"Student created: {student.username}"))
        else:
            self.stdout.write(f"Student already exists: {student.username}")

        # Create a President Student
        president, created = Student.objects.get_or_create(
            username="president_user",
            email="president@example.com",
            first_name="President",
            last_name="User",
            defaults={"password": "presidentpassword", "major": "Mechanical Engineering"}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f"President created: {president.username}"))
        else:
            self.stdout.write(f"President already exists: {president.username}")

        # Create or get a Society; must be approved by an Advisor
        society, _ = Society.objects.get_or_create(
            name="Robotics Club",
            leader=president,      # optional: single leader
            approved_by=advisor    # must be an Advisor, not Admin
        )

        # Instead of society.president.add(...), we do:
        # This triggers the signals with instance = president (student).
        president.president_of.add(society)

        # Done!
        self.stdout.write(self.style.SUCCESS(
            f"Society '{society.name}' created/retrieved. President: {president.username}"
        ))
        self.stdout.write(self.style.SUCCESS("Seeding complete!"))