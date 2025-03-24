from random import choice, randint, random
from datetime import date
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
    SocietyRequest,
    EventRequest,
    User,
    UserRequest,
    Award,
    AwardStudent,
)

class Command(BaseCommand):
    """Seeds the database with super admins, admins, students, societies, and events"""
    help = "Seed the database with super admins, normal admins, students, societies, and events"

    def __init__(self):
        self.event_generator = RandomEventDataGenerator()
        self.student_generator = RandomStudentDataGenerator()
        self.society_generator = RandomSocietyDataGenerator()
        super().__init__()

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

        # Create/Get Admin using create_admin, to avoid code duplication
        self.create_admin(5)
        self.create_super_admins()

        self.create_student(100)

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
        event_manager, _ = get_or_create_user(
            Student,
            username="event_manager_user",
            email="eventmanager@example.com",
            first_name="Event",
            last_name="Manager",
            defaults={
                "password": make_password("eventmanagerpassword"),
                "major": "Digital Arts"
            },
        )

        self.create_robotics_society(
            president=president,
            student=student,
            vice_president=vice_president,
            event_manager=event_manager,
        )

        self.create_society(35)
        self.create_event(35)
        self.create_event(5, True)

        self.pre_define_awards()
        self.randomly_assign_awards(200)

        self.broadcast_updates()

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))

    def create_student(self, n):
        """Create n different students"""
        created_count = 0

        while created_count < n:
            created_count += 1
            print(f"Seeding student {created_count}/{n}", end='\r', flush=True)

            data = self.student_generator.generate()

            email = f"{data['username']}@kcl.ac.uk"

            student = Student.objects.create(
                email=email,
                username=data["username"],
                first_name=data["first_name"],
                last_name=data["last_name"],
                major=data["major"],
                password=make_password("studentpassword"),
            )
            self.handle_user_status(student)
            student.save()

        print(self.style.SUCCESS(f"Seeding student {created_count}/{n}"), flush=True)
        return created_count

    def handle_user_status(self, user):
        """Creates user requests if pending"""
        update_request = choice((True, False))

        if update_request:
            UserRequest.objects.create(
                major="CompSci",
                from_student=user,
                intent="UpdateUse",
            )
        return update_request

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
            {"username": "superadmin1", "email": "superadmin1@example.com", "first_name": "Alice", "last_name": "Smith"},
            {"username": "superadmin2", "email": "superadmin2@example.com", "first_name": "Bob", "last_name": "Johnson"},
        ]

        for admin in super_admins:
            _, created = User.objects.get_or_create(
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

    def create_robotics_society(self, president, student, vice_president, event_manager):
        """Seeds the example society, Robotics Society"""
        if president.is_event_manager or president.is_vice_president:
            president.is_event_manager = False
            president.is_vice_president = False
            president.save()

        self.create_society(name="Robotics Club", president_force=president)

        society = Society.objects.filter(name="Robotics Club").first()
        president.president_of = society
        self.seed_society_showreel(society, n=10)
        self.generate_random_event(society)

        society.vice_president = vice_president
        society.event_manager = event_manager
        society.icon = "pre-seed-icons/robotics.jpg"
        society.society_members.add(student, vice_president, event_manager)

        vice_president.is_vice_president = True
        event_manager.is_event_manager = True

        president.save()
        vice_president.save()
        event_manager.save()
        society.save()

    def create_society(self, n=1, name=None, president_force=None):
        """
        Create n different societies owned by random students
        or creates a society with the name 'name'
        """
        for i in range(1, n+1):
            print(f"Seeding society {i}/{n}", end='\r', flush=True)

            available_students = Student.objects.order_by("?").filter(is_active=True)
            if not available_students.exists():
                print(self.style.WARNING("No available students."))
                break

            # Get an admin for the required approved_by field
            admin = User.get_admins().order_by('?').first()
            if not admin:
                print(self.style.WARNING("No admin users found. Creating one."))
                self.create_admin(1)
                admin = User.get_admins().first()

            data = self.society_generator.generate()
            approved = True
            society = None
            president = president_force
            viable_presidents = (
                available_students
                .filter(president_of=None)
                .filter(is_vice_president=False)
                .filter(is_event_manager=False)
            )
            if not president_force:
                president = viable_presidents.first()
            if not name:
                approved = self.handle_society_status(
                    president,
                    data["name"],
                )
            else:
                data["name"] = name
            if approved:
                # Add default for social_media_links
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

        # Ensure at least 5 members
        all_students = list(Student.objects.exclude(id=society.president.id).order_by("?").filter(is_active=True))
        members_num = 5
        while members_num < Student.objects.filter(is_active=True).count()-1 and random() <= 0.912:
            members_num += 1
        selected_members = all_students[:members_num]

        # Ensure the president is always a member
        society.society_members.add(society.president)
        society.society_members.add(*selected_members)
        society.save()

        selected_members = list(
            society.society_members
            .filter(is_vice_president=False)
            .filter(is_event_manager=False)
            .filter(is_president=False)
        )
        # Assign roles (ensure at least 2 for vp and event manager)
        if len(selected_members) >= 2:
            # Assign vice president and set flag
            society.vice_president = selected_members[0]
            society.vice_president.is_vice_president = True
            society.vice_president.save()
                
            # Assign event manager and set flag
            society.event_manager = selected_members[1]
            society.event_manager.is_event_manager = True
            society.event_manager.save()

        # Assign an admin
        society.approved_by = User.get_admins().order_by('?').first()

        self.set_society_socials(society)   # Assigns socials
        self.seed_society_showreel(society) # Seed showreel entries

        society.save()
        society.president.save()

    def handle_society_status(self, president, name):
        """Creates society requests if pending, else assigns an admin to approved_by"""
        # At least half of the societies should be approved
        random_status = choice(["Approved", "Approved", "Pending", "Rejected"])

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

    def create_event(self, n, past=False):
        """Create n different events"""
        societies = list(Society.objects.all())
        if not societies:
            print(self.style.WARNING("No societies found. Skipping event creation."))
            return

        for i in range(1, n + 1):
            print(f"Seeding event {i}/{n}", end='\r')
            society = choice(societies)

            data = self.event_generator.generate(society.name, past)

            approved = self.handle_event_status(society, data)
            if approved:
                event, _ = self.generate_random_event(society, data)
                if past:
                    self.handle_attendance(event)

        print(self.style.SUCCESS(
            f"Seeding {'past' if past else ''} event {n}/{n}"
        ), flush=True)

    def handle_attendance(self, event):
        """Records seeded attendance for event attendees"""
        attendees = event.current_attendees.all()
        for attendee in attendees:
            attended = choice((True, False))
            if attended:
                attendee.attended_events.add(event)

    def generate_random_event(self, society, data=None):
        """Generate a random event and ensure attendees are added."""
        if not data:
            data = self.event_generator.generate(society.name)
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
        """
        random_status = choice(["Pending", "Approved", "Rejected"])
        if not data:
            data = self.event_generator.generate(society.name)
        if data["event_date"] < date.today():
            random_status = "Approved" if random_status == "Pending" else random_status

        # If the society has no president, pick any random student to avoid NULL
        default_student = society.president if society.president else Student.objects.filter(is_active=True).first()
        if not default_student:
            print(
                "No student available to assign from_student. "
                "Cannot create this event request."
            )
            return False

        # Always create an initial request
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

        if random_status == "Approved":
            event_request.approved = True
            event_request.save()
            return True
        elif random_status == "Rejected":
            event_request.approved = False
        event_request.save()
        return False

    def broadcast_updates(self):
        """Broadcast updates to the WebSocket"""
        # print("Broadcasting updates to WebSocket...") # Debugging statement
        api.signals.broadcast_dashboard_update()

    def pre_define_awards(self):
        """Pre-define automatic awards"""
        rank_to_name = {"Bronze": "Novice", "Silver": "Enthusiast", "Gold": "Veteran"}
        self.initialise_society_awards(rank_to_name)
        self.initialise_event_awards(rank_to_name)
        self.initialise_organiser_awards(rank_to_name)

    def initialise_society_awards(self, rank_to_name):
        """Define automatic society awards"""
        rank_to_num = {"Bronze": 1, "Silver": 3, "Gold": 5}
        for rank, num in rank_to_num.items():
            Award.objects.create(
                title=f"Society {rank_to_name[rank]}",
                description=f"Belong to {num} or more societies!",
                rank=rank,
            )

    def initialise_event_awards(self, rank_to_name):
        """Define automatic event awards"""
        rank_to_num = {"Bronze": 1, "Silver": 5, "Gold": 20}
        for rank, num in rank_to_num.items():
            Award.objects.create(
                title=f"Event {rank_to_name[rank]}",
                description=f"Attend {num} or more events!",
                rank=rank,
            )

    def initialise_organiser_awards(self, rank_to_name):
        """Define automatic organiser awards"""
        rank_to_num = {"Bronze": 1, "Silver": 3, "Gold": 10}
        for rank, num in rank_to_num.items():
            Award.objects.create(
                title=f"Organisation {rank_to_name[rank]}",
                description=f"Organise {num} or more events with 10+ attendees!",
                rank=rank,
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
        students = list(Student.objects.filter(is_active=True))
        awards = list(Award.objects.all())
        for i in range(1, n+1):
            print(f"Seeding awards {i}/{n}", end='\r')
            random_student = choice(students)
            random_award = choice(awards)
            self.enforce_award_validity(random_award, random_student)
        print(self.style.SUCCESS(f"Seeding awards {n}/{n}"))

    def seed_society_showreel(self, society, caption="A sample caption", n=randint(1, 10)):
        """
        Adds up to 'n' new SocietyShowreel entries (max 10) for a society.
        Before creating new showreels, we get the current number of entries
        ensuring we don't surpass the limit
        """
        current_entries = SocietyShowreel.objects.filter(society=society).count()
        new_entries = n - current_entries

        # Create up to 'n' new showreel entries, but never more than 10
        for _ in range(new_entries):
            colour = (randint(0, 255), randint(0, 255), randint(0,255))
            size = (100, 100)
            image = Image.new('RGB', size=size, color=colour)
            buffer = BytesIO()
            image.save(buffer, format='JPEG')
            buffer.seek(0)

            uploaded_file = SimpleUploadedFile(
                f"showreel_{society.id}.jpeg",
                buffer.read(),
                content_type='image/jpeg'
            )

            SocietyShowreel.objects.create(
                society=society,
                photo=uploaded_file,
                caption=caption
            )
