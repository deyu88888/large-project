from datetime import date, timedelta, time
from random import choice, randint
from django.core.management.base import BaseCommand
from api.models import Admin, Student, Society, Event, Notification

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
        admin.save()

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
        )
        society.approved_by = admin

        president.president_of.add(society)

        self.stdout.write(
            self.style.SUCCESS(
                f"Society '{society.name}' created/retrieved. President: {president.username}"
            )
        )

        self.create_society(10)
        self.create_event(10)

        self.stdout.write(self.style.SUCCESS("Seeding complete!"))

    def create_society(self, n):
        """ Create n different societies owned by random students """
        for i in range(1, n+1):
            print(f"Seeding society {i}/{n}", end='\r', flush=True)

            society_leader = Student.objects.order_by('?').first()
            society, created = Society.objects.get_or_create(
                name=f'Society{i}',
                leader=society_leader,
            )
            if created:
                society_leader.president_of.add(society)
                society.society_members.add(society_leader)
        print()

    def create_event(self, n):
        """ Create n different events """
        event_list = [] # Create empty list to hold created events

        for i in range(1, n+1):
            print(f"Seeding event {i}/{n}", end='\r')

            society = Society.objects.order_by('?').first()
            event, created = Event.objects.get_or_create(
                title=f'Event{i}',
                description=f'Event{i} organised by {society}',
                date=self.generate_random_date(),
                start_time=self.generate_reasonable_time(),
                duration=self.generate_random_duration(),
                hosted_by=society,
                location='XXX'
            )
            if created:
                event_list.append(event)
        print()
        self.create_event_notifications(event_list)

    def generate_random_duration(self):
        """ Generate and return a random duration from 1-3 hours """
        duration_choices = [timedelta(hours=i) for i in range(1,4)]
        return choice(duration_choices)

    def generate_random_date(self):
        """ Generate and return a random date up to a month in advance """
        random_days = randint(1, 31)
        return date.today() + timedelta(days=random_days)

    def generate_reasonable_time(self):
        """ Generate and return a random time from 9:00am to 8:45pm """
        random_hour = randint(9, 20)
        random_minute = choice([0, 15, 30, 45])
        return time(hour=random_hour,minute=random_minute)

    def create_event_notifications(self, events):
        """ Creates notifications from a list of events """
        for event in events:
            self.create_event_notification(event)

    def create_event_notification(self, event):
        """ Create the notifications for a specific event """
        members = event.hosted_by.society_members

        count = 0
        for member in members.all():
            count += 1
            print(f"Notification {count}/{len(members.all())} for: {event.title}", end='\r')

            Notification.objects.create(
                for_event=event,
                for_student=member
            )
        print()
