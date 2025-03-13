from datetime import date, datetime, time, timedelta
import random
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from random import choice, randint
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from api.models import (
    Admin,
    Student,
    Society,
    SocietyShowreel,
    Event,
    Notification,
    SocietyRequest,
    EventRequest,
    UserRequest,
    Award,
    AwardStudent,
)


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
            defaults={"password": make_password("adminpassword")},
        )
        admin.save()

        student, _ = get_or_create_user(
            Student,
            username="student_user",
            email="student@example.com",
            first_name="Student",
            last_name="User",
            defaults={
                "password": make_password("studentpassword"),
                "major": "Computer Science",
            },
        )

        president, _ = get_or_create_user(
            Student,
            username="president_user",
            email="president@example.com",
            first_name="President",
            last_name="User",
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

        society, _ = get_or_create_object(
            Society,
            name="Robotics Club",
            leader=president,
        )
        society.approved_by = admin
        society.society_members.add(student)
        
        society.vice_president = vice_president
        society.society_members.add(vice_president)
        society.save()
        
        self.seed_society_showreel(society, n=10)

        president.president_of = society
        president.save()
        
        vice_president.save()
        


        self.create_student(50)
        self.create_admin(5)
        self.create_society(20)
        self.create_event(20)
        self.pre_define_awards()
        self.randomly_assign_awards(50)
        # Broadcast updates to the WebSocket
        self.broadcast_updates()

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))

    def create_student(self, n):
        """Create n different students"""
        majors = ["Computer Science", "Maths", "Music"]
        for i in range(1, n+1):
            print(f"Seeding student {i}/{n}", end='\r', flush=True)
            student, created = Student.objects.get_or_create(
                username=f"student{i}",
                email=f"student{i}@example.com",
                first_name=f"student{i}",
                last_name="User",
                defaults={
                    "password": make_password("studentpassword"),  
                    "major": choice(majors),
                },
            )
            if created:
                self.handle_user_status(student)
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
            Admin.objects.get_or_create(
                username=f"admin{i}",
                email=f"admin{i}@example.com",
                first_name=f"admin{i}",
                last_name="User",
                defaults={"password": make_password("adminpassword")},
            )
        print(self.style.SUCCESS(f"Seeding admin {n}/{n}"), flush=True)

    def create_society(self, n):
        """Create n different societies owned by random students"""
        for i in range(1, n+1):
            print(f"Seeding society {i}/{n}", end='\r', flush=True)

            # Only select students who are NOT already leading a society
            available_students = Student.objects.exclude(president_of__isnull=False).order_by("?")
        
            if not available_students.exists():
                print(self.style.WARNING("No available students left to be society leaders. Skipping."))
                break

            society_leader = available_students.first()
            approved = self.handle_society_status(
                society_leader,
                f"Society{i}",
            )
            created = False
            society = None
            if approved:
                society, created = Society.objects.get_or_create(
                    name=f"Society{i}",
                    leader=society_leader,
                    category="General",
                    status="Approved",
                    description=self.generic_description()
                )
            if created:
                # Ensure the leader is always a member
                society.society_members.add(society_leader)
                self.finalize_society_creation(society)

                num_events = randint(2, 5)
                for _ in range(num_events):
                    self.generate_random_event(society)

        print(self.style.SUCCESS(f"Seeding society {n}/{n}"), flush=True)

    def generic_description(self):
        """Returns a generic society description"""
        return ("A vibrant community dedicated to bringing like-minded individu"
        + "als together. We organize events, discussions, and activities to fos"
        + "ter engagement, learning, and collaboration. \n\nWhether you're a beginn"
        + "er or an expert, there's something for everyone. \nJoin us to connect,"
        + " grow, and be part of something exciting!")

    def add_random_tags(self, society, n):
        """Adds n random tags to a society"""
        tags = [
            "Networking", "Technology", "Innovation", "Entrepreneurship",
            "Volunteering", "SocialImpact", "Wellness", "Sustainability",
            "Education", "Arts&Culture", "Leadership", "Diversity",
            "MentalHealth", "Gaming", "Sports", "Music", "Debate",
            "Literature", "Photography", "Sustainability",
        ]

        for _ in range(min(20, n)):
            tag = choice(tags)
            tags.remove(tag)
            society.tags.append(tag)

    def set_society_socials(self, society : Society):
        """Assigns socials to a society (placeholder kclsu)"""
        socials_dict = {
            "facebook": "https://www.facebook.com/kclsupage/",
            "instagram": "https://www.instagram.com/kclsu/",
            "x": "https://x.com/kclsu",
        }
        society.social_media_links = socials_dict

    def finalize_society_creation(self, society):
        """Finishes society creation with proper members and roles"""
        society.leader.president_of = society

        # Ensure at least 5-15 members
        all_students = list(Student.objects.exclude(id=society.leader.id).order_by("?"))
        selected_members = all_students[:randint(5, 15)]

        society.society_members.add(*selected_members)

        # Assign roles (ensure at least 2 roles)
        if len(selected_members) >= 2:
            # Assign vice president and set flag
            society.vice_president = selected_members[0]
            if society.vice_president:
                society.vice_president.is_vice_president = True
                society.vice_president.save()
            society.event_manager = selected_members[2]

        # Assign an admin
        admin_randomised = Admin.objects.order_by('?')
        society.approved_by = admin_randomised.first()

        # Assigns tags and socials
        self.add_random_tags(society, 3)
        self.set_society_socials(society)

        self.seed_society_showreel(society)
        society.save()

    def handle_society_status(self, leader, name):
        """Creates society requests if pending, else assigns an admin to approved_by"""
        random_status = choice(["Pending", "Approved", "Rejected"])

        if random_status == "Approved":
            return True
        elif random_status == "Pending":
            SocietyRequest.objects.get_or_create(
                name=name,
                leader=leader,
                category="Tech",
                from_student=leader,
                intent="CreateSoc",
            )
        else:
            SocietyRequest.objects.get_or_create(
                name=name,
                leader=leader,
                from_student=leader,
                category="Tech",
                intent="CreateSoc",
                approved=True,
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

            approved = self.handle_event_status(society, i)
            if approved:
                event, _ = self.generate_random_event(society)
                event_list.append(event)

        print(self.style.SUCCESS(f"Seeding event {n}/{n}"), flush=True)
        self.create_event_notifications(event_list)

    def get_random_location(self):
        """Generates a random location for an event"""
        locations = [
            'Main Auditorium',
            'Library Conference Room',
            'Sports Hall',
            'Computer Lab',
            'Music Hall'
        ]
        return choice(locations)

    def generate_random_event(self, society):
        """Generate a random event and ensure attendees are added."""
        location = self.get_random_location()
        event_date = self.generate_random_date()
        # Use generate_reasonable_time to ensure that the start time is in the future.
        # If the event is scheduled for today, this function will pick a time after now.
        event_time = self.generate_reasonable_time(event_date)
        
        event, created = Event.objects.get_or_create(
            title=f"{society.name} Event",
            description=f"An exciting event by {society.name}",
            date=event_date,
            start_time=event_time,
            duration=self.generate_random_duration(),
            hosted_by=society,
            location=location,
            status="Approved",
        )

        if created:
            all_students = list(Student.objects.exclude(id=society.leader.id))
            num_attendees = min(randint(5, 20), len(all_students))
            selected_attendees = all_students[:num_attendees]

            event.current_attendees.add(*selected_attendees)
            event.save()
            print(self.style.SUCCESS(f"📅 Event Created: {event.title} ({event.date})"))

        return event, created

    def handle_event_status(self, society, i):
        """Creates event requests if pending"""
        random_status = choice(["Pending", "Approved", "Rejected"])
        location = self.get_random_location()
        
        event_date = self.generate_random_date()  # ✅ Generate event date first
        event_time = self.generate_reasonable_time(event_date)  # ✅ Pass event_date

        if random_status == "Approved":
            return True
        elif random_status == "Pending":
            EventRequest.objects.get_or_create(
                title=f'Event{i}',
                description=f'Event{i} organised by {society.name}',
                date=event_date,  # ✅ Use generated event_date
                start_time=event_time,  # ✅ Use generated event_time
                duration=self.generate_random_duration(),
                hosted_by=society,
                from_student=society.leader,
                location=location,
                intent="CreateEve",
            )
        else:
            EventRequest.objects.get_or_create(
                title=f'Event{i}',
                description=f'Event{i} organised by {society.name}',
                date=event_date,  # ✅ Use generated event_date
                start_time=event_time,  # ✅ Use generated event_time
                duration=self.generate_random_duration(),
                hosted_by=society,
                from_student=society.leader,
                location=location,
                intent="CreateEve",
                approved=True,
            )
        return False

    def generate_random_duration(self):
        """Generate and return a random duration from 1-3 hours."""
        duration_choices = [timedelta(hours=i) for i in range(1, 4)]
        return choice(duration_choices)

    def generate_random_date(self):
        """Generate a future event date within the next 30 days.
        
        If the current time is past the allowed event hours (after 8:45 PM), 
        then events will not be scheduled for today.
        """
        today = date.today()
        now_time = datetime.now().time()
        latest_allowed_time = time(20, 45)  # 8:45 PM as the latest allowed event time
        # If it's already too late today, start from tomorrow (i.e. add at least 1 day)
        if now_time > latest_allowed_time:
            random_days = randint(1, 30)
        else:
            random_days = randint(0, 30)
        return today + timedelta(days=random_days)


    def generate_reasonable_time(self, event_date):
        """Generate a future time (9:00 AM to 8:45 PM), ensuring it's always after the current time if today."""
        now = datetime.now()

        valid_hours = list(range(9, 21))  # 9 AM to 8:45 PM
        valid_minutes = [0, 15, 30, 45]

        if event_date > now.date():
            return time(hour=choice(valid_hours), minute=choice(valid_minutes))

        elif event_date == now.date():
            # Filter times that are strictly in the future
            possible_times = [
                time(hour=h, minute=m)
                for h in valid_hours
                for m in valid_minutes
                if datetime.combine(event_date, time(hour=h, minute=m)) > now
            ]

            if possible_times:
                return choice(possible_times)  # ✅ Randomly select a valid future time today

            # If no valid times remain, schedule the event for tomorrow at 9:00 AM
            return time(hour=9, minute=0)
    
    def generate_random_time(self):
        """Generates a random time within a day."""
        hours = random.randint(0, 23)  # Random hour between 0-23
        minutes = random.randint(0, 59)  # Random minute between 0-59
        return time(hour=hours, minute=minutes)

    def create_event_notifications(self, events):
        """Creates notifications from a list of events"""
        count = 0
        # Instead of building a dictionary, simply iterate over the events.
        for event in events:
            print(f"Seeding notifications for {event.title}", end='\r')
            self.create_event_notification(event)
            count += event.current_attendees.count()
        print(self.style.SUCCESS(f"Seeding notifications for {count} attendees across events"))

    def count_all_event_participants(self, event_dict):
        """Counts all the potential participants of events"""
        total = 0
        for _, members in event_dict.items():
            total += len(members)
        return total

    def create_event_notification(self, event):
        """Create notifications only for students attending"""
        members = event.current_attendees.all()  # ✅ Get attendees dynamically

        for member in members:
            Notification.objects.create(
                for_event=event,
                for_student=member
            )

        print(self.style.SUCCESS(f"Created notifications for {len(members)} attendees of {event.title}"))

    def broadcast_updates(self):
        """Broadcast updates to the WebSocket"""
        from api.signals import broadcast_dashboard_update
        print("Broadcasting updates to WebSocket...")
        broadcast_dashboard_update()

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
        """True if a student has an award of category of a certain rank"""
        return AwardStudent.objects.filter(
            award__title__startswith=category,
            award__rank=rank,
            student=student
        ).exists()

    def enforce_award_validity(self, award, student):
        """Award in a way so gold for a category relies on bronze & silver"""
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
        """Awards n random awards to random students"""
        students = list(Student.objects.all())
        awards = list(Award.objects.all())
        for i in range(1, n+1):
            print(f"Seeding awards {i}/{n}", end='\r')
            random_student = choice(students)
            random_award = choice(awards)
            self.enforce_award_validity(random_award, random_student)
        print(self.style.SUCCESS(f"Seeding awards {n}/{n}"))

    def seed_society_showreel(self, society, caption="A sample caption", n=None):
        """Adds a SocietyShowreel entry to a specific society"""
        if not n:
            n = randint(1, 10)
        for _ in range(min(n, 10)):
            colour = (randint(0, 255), randint(0, 255), randint(0,255))
            size = (100, 100)
            image = Image.new('RGB', size=size, color=colour)

            buffer = BytesIO()
            image.save(buffer, format='JPEG')
            buffer.seek(0)
            file_name = f"showreel_{society.id}.jpeg"
            uploaded_file = SimpleUploadedFile(file_name, buffer.read(), content_type='image/jpeg')

            showreel_entry = SocietyShowreel.objects.create(
                society=society,
                photo=uploaded_file,
                caption=caption
            )

        return showreel_entry
