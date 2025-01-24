from django.core.management.base import BaseCommand
from api.models import Admin, Student, Society

class Command(BaseCommand):
    help = "Seed the database with admin, student, and president users"

    def handle(self, *args, **kwargs):

        def get_or_create_user(model, username, email, first_name, last_name, defaults):
            """
            Get or create a user (Admin or Student).
            """
            user, created = model.objects.get_or_create(
                username=username,
                email=email,
                first_name=first_name,
                last_name=last_name,
                defaults=defaults,
            )
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"{model.__name__} created: {user.username}")
                )
            else:
                self.stdout.write(f"{model.__name__} already exists: {user.username}")
            return user, created

        def get_or_create_object(model, **kwargs):
            """
            Get or create a generic object.
            """
            obj, created = model.objects.get_or_create(**kwargs)
            if created:
                self.stdout.write(
                    self.style.SUCCESS(f"{model.__name__} created: {kwargs}")
                )
            else:
                self.stdout.write(f"{model.__name__} already exists: {kwargs}")
            return obj, created

        admin, _ = get_or_create_user(
            Admin,
            username="admin_user",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
            defaults={"password": "adminpassword"},
        )

        student, _ = get_or_create_user(
            Student,
            username="student_user",
            email="student@example.com",
            first_name="Student",
            last_name="User",
            defaults={"password": "studentpassword", "major": "Computer Science"},
        )

        president, _ = get_or_create_user(
            Student,
            username="president_user",
            email="president@example.com",
            first_name="President",
            last_name="User",
            defaults={"password": "presidentpassword", "major": "Mechanical Engineering"},
        )

        society, _ = get_or_create_object(
            Society,
            name="Robotics Club",
            leader=president,
            approved_by=admin,
        )

        president.president_of.add(society)

        self.stdout.write(
            self.style.SUCCESS(
                f"Society '{society.name}' created/retrieved. President: {president.username}"
            )
        )
        self.stdout.write(self.style.SUCCESS("Seeding complete!"))