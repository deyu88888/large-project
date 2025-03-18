from datetime import date, datetime, time, timedelta
from random import choice, randint, random
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

import api
from api.management.commands.data.society_generator import RandomSocietyDataGenerator
from api.management.commands.data.student_generator import RandomStudentDataGenerator
from api.management.commands.data.event_generator import RandomEventDataGenerator
from api.models import (
    Student,
    Society,
    SocietyShowreel,
    Event,
    Notification,
    SocietyRequest,
    EventRequest,
    User,
    UserRequest,
    Award,
    AwardStudent,
)
from api.signals import broadcast_dashboard_update

class Command(BaseCommand):
    help = "Seed the database with super admins, normal admins, students, societies, and events"

    def handle(self, *args, **kwargs):
        """Handles database seeding"""

        def get_or_create_user(model, username, email, first_name, last_name, defaults):
            user, created = model.objects.get_or_create(
                email=email,
                defaults={
                    "username": username,
                    "first_name": first_name,
                    "last_name": last_name,
                    **defaults,
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"{model.__name__} created: {user.username}"))
            else:
                self.stdout.write(f"{model.__name__} already exists: {user.username}")
            return user, created

        super_admins = [
            {"username": "superadmin1", "email": "superadmin1@example.com", "first_name": "Alice", "last_name": "Smith"},
            {"username": "superadmin2", "email": "superadmin2@example.com", "first_name": "Bob", "last_name": "Johnson"},
        ]

        for admin in super_admins:

            user, created = User.objects.get_or_create(
                username=admin["username"],
                email=admin["email"],  # Required field - must be passed directly
                first_name=admin["first_name"],  # Required field - must be passed directly
                last_name=admin["last_name"],  # Required field - must be passed directly
                defaults={"password": make_password("superadminpassword"), "is_super_admin": True,  "role": "admin", "is_staff": True},  # Only optional fields in defaults
            )

            if created:
                self.stdout.write(self.style.SUCCESS(f"Super Admin '{admin['username']}' created."))
            else:
                self.stdout.write(self.style.WARNING(f"Super Admin '{admin['username']}' already exists."))

        # Create/Get Admin using create_admin, to avoid code duplication
        self.create_admin(5)

        self.create_student(100)

        president, _ = Student.objects.get_or_create(
            username="president_user",
            defaults={
                "email": "president@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "password": make_password("presidentpassword"),
                "major": "Mechanical Engineering",
            },
        )
        self.create_society(name="Robotics Club", president_force=president)
        self.create_society(35)

        self.create_event(20)

        self.pre_define_awards()
        self.randomly_assign_awards(50)

        self.broadcast_updates()

        self.stdout.write(self.style.SUCCESS("🎉 Seeding complete!"))

        student, _ = get_or_create_user(
            Student,
            username="student_user",
            email="student@example.com",
            first_name="John",
            last_name="Smith",
            defaults={
                "password": make_password("studentpassword"),
                "major": "Computer Science",
            },
        )
        student.save()

        # Create/Get President
        president, _ = get_or_create_user(
            Student,
            username="president_user",
            email="president@example.com",
            first_name="John",
            last_name="Doe",
            defaults={
                "password": make_password("presidentpassword"),
                "major": "Mechanical Engineering"
            },
        )

        vice_president, _ = get_or_create_user(
             Student,
             username="vice_president_user",
             email="vicepresident@example.com",
             first_name="Vice",
             last_name="President",
             defaults={
                 "password": make_password("vicepresidentpassword"),
                 "major": "Electrical Engineering"
             },
         )

        self.create_student(100)
        self.create_society(
            name="Robotics Club",
            president_force=president,
        )
        self.create_society(35)

        self.create_society(name="Robotics Club", president_force=president)
        society = Society.objects.filter(name="Robotics Club").first()
        society.society_members.add(student)
        society.icon = "pre-seed-icons/robotics.jpg"

        self.seed_society_showreel(society, n=10)

        president.president_of = society
        president.save()
        self.generate_random_event(society)
        society.vice_president = vice_president
        society.society_members.add(vice_president)
        society.save()

        self.create_society(35)  # Continue creating other societies
        self.create_event(35)
        self.pre_define_awards()
        self.randomly_assign_awards(50)

        # Broadcast updates to the WebSocket
        self.broadcast_updates()

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))

    def create_student(self, n):
        """Create n different students"""
        generator = RandomStudentDataGenerator()

        for i in range(1, n + 1):
            print(f"Seeding student {i}/{n}", end='\r', flush=True)

            data = generator.generate()
            email = f"{data['username']}@kcl.ac.uk"

            # Ensure unique email constraint is respected
            student, created = Student.objects.get_or_create(
                email=email,  # Email is the lookup field to prevent duplicates
                username=data["username"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                major=data["major"],
                defaults={
                    "username": data["username"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "major": data["major"],
                    "password": make_password("studentpassword"),
                },
            )

            if created:
                self.handle_user_status(student)  # Handle additional setup if needed

        print(self.style.SUCCESS(f"Seeding student {n}/{n}"), flush=True)

    def handle_user_status(self, user):
        """Creates user requests if pending"""
        update_request = choice((True, False))

        if update_request:
            UserRequest.objects.create(
                major="CompSci",
                from_student=user,
                intent="UpdateUse",
            )

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

    def create_society(self, n=1, name=None, president_force=None):
        """
        Create n different societies owned by random students
        or creates a society with the name 'name'
        """
        generator = RandomSocietyDataGenerator()
        for i in range(1, n+1):
            print(f"Seeding society {i}/{n}", end='\r', flush=True)

            available_students = Student.objects.order_by("?")

            if not available_students.exists():
                print(self.style.WARNING("No available students left to be society presidents. Skipping."))
                break

            # Get an admin for the required approved_by field
            admin = User.objects.filter(role='admin').order_by('?').first()
            if not admin:
                print(self.style.WARNING("No admin users found. Creating one."))
                admin = User.objects.create_user(
                    username="auto_admin",
                    email="auto_admin@example.com",
                    first_name="Auto",
                    last_name="Admin",
                    password=make_password("adminpassword")
                )

            data = generator.generate()
            approved = True
            created = False
            society = None
            president = president_force
            if not president_force:
                for student in available_students:
                    if not student.president_of:
                        president = available_students.first()
                        break
            if not name:
                approved = self.handle_society_status(
                    president,
                    data["name"],
                )
            else:
                data["name"] = name
            if approved:
                # Add empty dict as default for social_media_links
                if "social_media_links" not in data or not data["social_media_links"]:
                    data["social_media_links"] = {"Email": f"{data['name'].lower().replace(' ', '')}@example.com"}

                society, created = Society.objects.get_or_create(
                    name=data["name"],
                    president=president,
                    category=data["category"],
                    status="Approved",
                    description=data["description"],
                    tags=data["tags"],
                    icon=data["icon"],
                    approved_by=admin,  # Set the required approved_by field
                    social_media_links=data["social_media_links"]  # Ensure social_media_links are included
                )
            if created:
                self.finalize_society_creation(society)

                num_events = randint(2, 5)
                for _ in range(num_events):
                    self.generate_random_event(society)

        print(self.style.SUCCESS(f"Seeding society {n}/{n}"), flush=True)

    def set_society_socials(self, society : Society):
        """Assigns socials to a society (placeholder kclsu)"""
        socials_dict = {
            "Facebook": "https://www.facebook.com/kclsupage/",
            "Instagram": "https://www.instagram.com/kclsu/",
            "X": "https://x.com/kclsu",
        }
        society.social_media_links = socials_dict

    def finalize_society_creation(self, society):
        """Finishes society creation with proper members and roles"""
        society.president.president_of = society
        society.president.is_president = True

        # Ensure at least 5-15 members
        all_students = list(Student.objects.exclude(id=society.president.id).order_by("?"))
        members_num = 5
        while members_num < Student.objects.count():
            if random() <= 0.912:
                members_num += 1
            else:
                break
        selected_members = all_students[:members_num]

        # Ensure the president is always a member
        society.society_members.add(society.president)
        society.society_members.add(*selected_members)

        # Assign roles (ensure at least 2 roles)
        if len(selected_members) >= 3:
            # Assign vice president and set flag
            society.vice_president = selected_members[0]
            if society.vice_president:
                society.vice_president.is_vice_president = True
                society.vice_president.save()
            society.event_manager = selected_members[2]

        # Assign an admin
        admin_randomised = User.objects.order_by('?')
        society.approved_by = admin_randomised.first()

        # Assigns tags and socials
        self.set_society_socials(society)

        # Seed showreel entries for newly created society
        self.seed_society_showreel(society)

        society.save()
        society.president.save()

    def handle_society_status(self, president, name):
        """Creates society requests if pending, else assigns an admin to approved_by"""
        random_status = choice(["Pending", "Approved", "Rejected"])

        if random_status == "Approved":
            society_request, _ = SocietyRequest.objects.get_or_create(
                name=name,
                president=president,
                category="Tech",
                from_student=president,
                intent="CreateSoc",
            )

            society_request.approved = True
            society_request.save()
            return True
        elif random_status == "Pending":
            SocietyRequest.objects.get_or_create(
                name=name,
                president=president,
                category="Tech",
                from_student=president,
                intent="CreateSoc",
            )
        else:
            SocietyRequest.objects.get_or_create(
                name=name,
                president=president,
                from_student=president,
                category="Tech",
                intent="CreateSoc",
                approved=False,
            )
        return False

    def create_event(self, n):
        """Create n different events"""
        event_list = []

        societies = list(Society.objects.all())

        for i in range(1, n + 1):
            print(f"Seeding event {i}/{n}", end='\r')

            if not societies:
                print(self.style.WARNING("No societies found. Skipping event creation."))
                break

            society = choice(societies)

            generator = RandomEventDataGenerator()
            data = generator.generate(society.name)

            approved = self.handle_event_status(society, data)
            if approved:
                event, _ = self.generate_random_event(society, data)
                event_list.append(event)

        print(self.style.SUCCESS(f"Seeding event {n}/{n}"), flush=True)
        self.create_event_notifications(event_list)

    def generate_random_event(self, society, data=None):
        """Generate a random event and ensure attendees are added."""
        if not data:
            generator = RandomEventDataGenerator()
            data = generator.generate(society.name)
        event, created = Event.objects.get_or_create(
            title=data["name"],
            description=data["description"],
            date=data["event_date"],
            start_time=data["event_time"],
            duration=data["duration"],
            hosted_by=society,
            location=data["location"],
            status="Approved",
        )

        if created:
            all_students = list(society.society_members.all())
            num_attendees = min(randint(5, 20), len(all_students))
            selected_attendees = all_students[:num_attendees]

            event.current_attendees.add(*selected_attendees)
            event.save()
            print(self.style.SUCCESS(f"Event Created: {event.title} ({event.date})"))

        return event, created

    def handle_event_status(self, society, data=None):
        """
        Creates event requests if random_status is Pending/Rejected.
        If 'Approved', we simply don't create an EventRequest object.
        
        Fix: Ensure from_student is always a valid Student.
        """
        random_status = choice(["Pending", "Approved", "Rejected"])
        if not data:
            generator = RandomEventDataGenerator()
            data = generator.generate(society.name)

        # If the society has no president, pick any random student to avoid NULL
        default_student = society.president
        if not default_student:
            default_student = Student.objects.first()
            if not default_student:
                print(
                    "No student available to assign from_student. "
                    "Cannot create this event request."
                )
                return False

        if random_status == "Approved":
            event_request, _ = EventRequest.objects.get_or_create(
                title=data["name"],
                description=data["description"],
                date=data["event_date"],
                start_time=data["event_time"],
                duration=data["duration"],
                hosted_by=society,
                from_student=default_student,  # Always assign a valid student
                location=data["location"],
                intent="CreateEve",
            )
            event_request.approved = True
            event_request.save()
            return True
        elif random_status == "Pending":
            EventRequest.objects.get_or_create(
                title=data["name"],
                description=data["description"],
                date=data["event_date"],
                start_time=data["event_time"],
                duration=data["duration"],
                hosted_by=society,
                from_student=default_student,  # Always assign a valid student
                location=data["location"],
                intent="CreateEve",
            )
        else:
            EventRequest.objects.get_or_create(
                title=data["name"],
                description=data["description"],
                date=data["event_date"],
                start_time=data["event_time"],
                duration=data["duration"],
                hosted_by=society,
                from_student=default_student,  # Always assign a valid student
                location=data["location"],
                intent="CreateEve",
                approved=False,
            )
        return False

    def create_event_notifications(self, events):
        """Creates notifications for event attendees"""
        count = 0

        for event in events:
            print(f"Seeding notifications for {event.title}", end='\r')
            self.create_event_notification(event)
            count += event.current_attendees.count()
        print(self.style.SUCCESS(f"Seeding notifications for {count} attendees across events"))

    def create_event_notification(self, event):
        """Create notifications only for students attending"""
        members = event.current_attendees.all()

        for member in members:
            Notification.objects.create(
                header=f"Attend {str(event)}!",
                body=f"Your favourite society {event.hosted_by.name} is "
                f"hosting the event {str(event)}",
                for_user=member,
            )

        print(self.style.SUCCESS(f"Created notifications for {len(members)} attendees of {event.title}"))

    def count_all_event_participants(self, event_dict):
        """Counts all the potential participants of events"""
        total = 0
        for _, members in event_dict.items():
            total += len(members)
        return total

    def broadcast_updates(self):
        """Broadcast updates to the WebSocket"""
        print("Broadcasting updates to WebSocket...")
        api.signals.broadcast_dashboard_update()

    def pre_define_awards(self):
        """Pre-define automatic awards"""
        self.initialise_society_awards()
        self.initialise_event_awards()
        self.initialise_organiser_awards()

    def initialise_society_awards(self):
        """Define automatic society awards"""
        Award.objects.create(
            title="Society Novice",
            description="Belong to 1 or more society!",
            rank="Bronze",
        )
        Award.objects.create(
            title="Society Enthusiast",
            description="Belong to 3 or more societies!",
            rank="Silver",
        )
        Award.objects.create(
            title="Society Veteran",
            description="Belong to 5 or more societies!",
            rank="Gold",
        )

    def initialise_event_awards(self):
        """Define automatic event awards"""
        Award.objects.create(
            title="Event Novice",
            description="Attend 1 or more event!",
            rank="Bronze",
        )
        Award.objects.create(
            title="Event Enthusiast",
            description="Attend 5 or more events!",
            rank="Silver",
        )
        Award.objects.create(
            title="Event Veteran",
            description="Attend 20 or more events!",
            rank="Gold",
        )

    def initialise_organiser_awards(self):
        """Define automatic organiser awards"""
        Award.objects.create(
            title="Organisation Novice",
            description="Organise 1 or more events with 10+ attendees!",
            rank="Bronze",
        )
        Award.objects.create(
            title="Organisation Enthusiast",
            description="Organise 3 or more events with 10+ attendees!",
            rank="Silver",
        )
        Award.objects.create(
            title="Organisation Veteran",
            description="Organise 10 or more events with 10+ attendees!",
            rank="Gold",
        )

    def student_has_reward(self, category, rank, student):
        """Check if a student already has an award of a specific rank & category."""
        return AwardStudent.objects.filter(
            award__title__startswith=category,
            award__rank=rank,
            student=student
        ).exists()

    def enforce_award_validity(self, award, student):
        """Award in a structured way so gold for a category relies on silver/bronze."""
        if award.rank == "Bronze":
            AwardStudent.objects.get_or_create(
                award=award,
                student=student,
            )
            return

        lower_ranks = {"Gold": "Silver", "Silver": "Bronze"}
        lower_rank = lower_ranks[award.rank]
        category = award.title.split()[0]

        if self.student_has_reward(category, lower_rank, student):
            AwardStudent.objects.get_or_create(
                award=award,
                student=student,
            )
        else:
            lower_award = Award.objects.filter(
                title__startswith=category,
                rank=lower_rank
            ).first()
            self.enforce_award_validity(award=lower_award, student=student)

    def randomly_assign_awards(self, n):
        """Give out n random awards to random students"""
        students = list(Student.objects.all())
        awards = list(Award.objects.all())
        for i in range(1, n+1):
            print(f"Seeding awards {i}/{n}", end='\r')
            random_student = choice(students)
            random_award = choice(awards)
            self.enforce_award_validity(random_award, random_student)
        print(self.style.SUCCESS(f"Seeding awards {n}/{n}"))

    def seed_society_showreel(self, society, caption="A sample caption", n=None):
        """
        Adds up to 'n' new SocietyShowreel entries (max 10) for a society.
        Before creating new showreels, we delete all existing ones to ensure
        we never exceed the 10-image limit.
        """
        # --- NEW: Delete existing showreels for this society ---
        SocietyShowreel.objects.filter(society=society).delete()

        if not n:
            n = randint(1, 10)

        # Create up to 'n' new showreel entries, but never more than 10
        for _ in range(min(n, 10)):
            colour = (randint(0, 255), randint(0, 255), randint(0,255))
            size = (100, 100)
            image = Image.new('RGB', size=size, color=colour)

            buffer = BytesIO()
            image.save(buffer, format='JPEG')
            buffer.seek(0)

            file_name = f"showreel_{society.id}.jpeg"
            uploaded_file = SimpleUploadedFile(
                file_name, 
                buffer.read(), 
                content_type='image/jpeg'
            )

            showreel_entry = SocietyShowreel.objects.create(
                society=society,
                photo=uploaded_file,
                caption=caption
            )

        return showreel_entry