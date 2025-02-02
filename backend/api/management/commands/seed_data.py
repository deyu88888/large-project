from datetime import date, timedelta, time
from random import choice, randint
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from api.models import (
    Admin,
    Student,
    Society,
    Event,
    Notification,
    SocietyRequest,
    EventRequest,
    UserRequest
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

        society, _ = get_or_create_object(
            Society,
            name="Robotics Club",
            leader=president,
        )
        society.approved_by = admin
        society.society_members.add(student)

        president.president_of.add(society)

        self.create_student(50)
        self.create_admin(5)
        self.create_society(20)
        self.create_event(20)

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

            student_randomised = Student.objects.order_by("?")
            society_leader = student_randomised.first()
            approved = self.handle_society_status(
                society_leader,
                f"Society{i}",
            )
            created = False
            society=None
            if approved:
                society, created = Society.objects.get_or_create(
                    name=f"Society{i}",
                    leader=society_leader,
                    category="General",
                    status="Approved",
                )
            if created:
                members = student_randomised.all()[:2]
                self.finalize_society_creation(society, members)
        print(self.style.SUCCESS(f"Seeding society {n}/{n}"), flush=True)

    def finalize_society_creation(self, society, members):
        """Finishes society creation"""
        society.leader.president_of.add(society)
        society.society_members.add(*members)
        society.roles = {
            "Treasurer": members[0], 
            "Social Manager": members[1]
        }
        admin_randomised = Admin.objects.order_by('?')
        society.approved_by = admin_randomised.first()

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
        event_list = [] # Create empty list to hold created events

        for i in range(1, n+1):
            print(f"Seeding event {i}/{n}", end='\r')
            approved = self.handle_event_status(i)
            if approved:
                event, created = self.generate_random_event(i)
                if created:
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

    def generate_random_event(self, i):
        """Generate 'i'th new event object"""
        location = self.get_random_location()
        society = Society.objects.order_by('?').first()
        return Event.objects.get_or_create(
            title=f'Event{i}',
            description=f'Event{i} organised by {society}',
            date=self.generate_random_date(),
            start_time=self.generate_reasonable_time(),
            duration=self.generate_random_duration(),
            hosted_by=society,
            location=location,
            status="Approved",
        )

    def handle_event_status(self, i):
        """Creates event requests if pending"""
        random_status = choice(["Pending", "Approved", "Rejected"])
        society = Society.objects.order_by('?').first()
        location = self.get_random_location()

        if random_status == "Approved":
            return True
        elif random_status == "Pending":
            EventRequest.objects.get_or_create(
                title=f'Event{i}',
                description=f'Event{i} organised by {society}',
                date=self.generate_random_date(),
                start_time=self.generate_reasonable_time(),
                duration=self.generate_random_duration(),
                hosted_by=society,
                from_student=society.leader,
                location=location,
                intent="CreateEve",
            )
        else:
            EventRequest.objects.get_or_create(
                title=f'Event{i}',
                description=f'Event{i} organised by {society}',
                date=self.generate_random_date(),
                start_time=self.generate_reasonable_time(),
                duration=self.generate_random_duration(),
                hosted_by=society,
                from_student=society.leader,
                location=location,
                intent="CreateEve",
                approved=True,
            )
        return False

    def generate_random_duration(self):
        """Generate and return a random duration from 1-3 hours"""
        duration_choices = [timedelta(hours=i) for i in range(1,4)]
        return choice(duration_choices)

    def generate_random_date(self):
        """Generate and return a random date up to a month in advance"""
        random_days = randint(1, 31)
        return date.today() + timedelta(days=random_days)

    def generate_reasonable_time(self):
        """Generate and return a random time from 9:00am to 8:45pm"""
        random_hour = randint(9, 20)
        random_minute = choice([0, 15, 30, 45])
        return time(hour=random_hour,minute=random_minute)

    def create_event_notifications(self, events):
        """Creates notifications from a list of events"""
        notification_dict = {}

        for event in events:
            members = event.hosted_by.society_members
            notification_dict[event] = members.all()

        count = 0
        total = self.count_all_event_participants(notification_dict)
        for event in events:
            print(f"Seeding notification {count}/{total}", end='\r')
            self.create_event_notification(event)
            count += len(notification_dict[event])
        print(self.style.SUCCESS(f"Seeding notification {count}/{total}"))

    def count_all_event_participants(self, event_dict):
        """Counts all the potential participants of events"""
        total = 0
        for _, members in event_dict.items():
            total += len(members)
        return total

    def create_event_notification(self, event):
        """Create the notifications for a specific event"""
        members = event.hosted_by.society_members

        for member in members.all():
            Notification.objects.create(
                for_event=event,
                for_student=member
            )

    def broadcast_updates(self):
        """Broadcast updates to the WebSocket"""
        from api.signals import broadcast_dashboard_update
        print("Broadcasting updates to WebSocket...")
        broadcast_dashboard_update()
