from datetime import date, datetime, time, timedelta
from random import choice, randint, random
from api.models import Event, EventRequest, Comment, Society
from api.management.commands.seeding.seeding_utility import assign_comment_parent, \
    get_comment_data, like_dislike_comments, get_model_entries_as_list, get_active_students
from django.core.management import color_style


class RandomEventDataGenerator():
    """Class encompassing tools to generate event data"""
    def __init__(self):
        self.society_type = {
            "COMPETETIVE": [ # Tournament
                "football",
                "gaming",
                "rugby",
                "tennis",
                "badminton",
                "swimming",
                "sailing",
                "tabletop",
                "chess",
            ],
            "CASUAL": [ # Gathering
                "literature",
                "gaming",
                "sewing",
                "knitting",
                "retro",
                "art",
                "fashion",
                "music",
                "philosophy",
            ],
            "ACADEMIC": [ # Seminar
                "mathematics",
                "literature",
                "physics",
                "chemistry",
                "biology",
                "computing",
                "economics",
                "politics",
                "architecture",
                "robotics"
            ],
            "CREATIVE": [ # Showcase
                "sewing",
                "knitting",
                "architecture",
                "literature",
                "fashion",
                "robotics",
                "music",
                "retro",
            ],
            "TECHNICAL": [ # Workshop
                "computing",
                "physics",
                "mathematics",
                "architecture",
                "robotics",
                "economics",
            ],
            "DISCUSSION": [ # Debate
                "politics",
                "economics",
                "philosophy",
            ]
        }

        self.type_map = {
            "COMPETETIVE": "Tournament",
            "CASUAL": "Gathering",
            "ACADEMIC": "Seminar",
            "CREATIVE": "Showcase",
            "TECHNICAL": "Workshop",
            "DISCUSSION": "Debate",
        }

        self.opening_phrases = [
            "An exciting opportunity to experience",
            "A unique event centered around",
            "A vibrant gathering designed to celebrate",
            "A welcoming space for exploring",
            "An unforgettable event focused on",
        ]

        self.middle_phrases = [
            "connecting people with shared interests.",
            "celebrating creativity and collaboration.",
            "exploring new ideas and skills.",
            "bringing the community together for memorable experiences.",
            "fostering a sense of belonging and enthusiasm.",
        ]

        self.ending_phrases = [
            "Come join us for a day filled with excitement and inspiration.",
            "No matter your experience level, everyone is welcome to participate.",
            "Be part of something special and make lasting memories.",
            "Together, we'll create an event to remember.",
            "Don't miss out on this fantastic opportunity to get involved!",
        ]

        self.final_paragraphs = [
            "Our event brings together passionate individuals who share a love"
            " for new experiences and building connections. Whether you're a "
            "seasoned expert or just curious to learn more, there's something "
            "for everyone. Join us and be part of something special!",

            "We're committed to creating an event that leaves a lasting impression"
            "—one that inspires, connects, and empowers everyone involved. From"
            " thought-provoking discussions to hands-on activities, this is a "
            "chance to be part of a vibrant community!",

            "Don't just attend—be part of the story! Your participation makes all"
            " the difference, and we can't wait to see what ideas and enthusiasm "
            "you bring. Come along and make your mark on this exciting event!",

            "Everyone has something unique to contribute, and this event is "
            "designed to bring out the best in each of us. Whether you're here "
            "to learn, network, or simply have a good time, you're in the right place!",
        ]

        self.style = color_style()

    def generate(self, society_name, past=False) -> dict:
        """Generates artificial data for a event and returns in a dict"""
        return_dict = {}

        society_prename = society_name.split()[0]
        return_dict["name"] = self.generate_name(society_prename)
        return_dict["description"] = self.generate_description()
        return_dict["location"] = self.get_random_location()
        return_dict["event_date"] = self.generate_random_date(past)
        return_dict["event_time"] = self.generate_reasonable_time(
            return_dict["event_date"]
        )
        return_dict["duration"] = self.generate_random_duration()

        return return_dict

    def generate_name(self, society_prename) -> str:
        """Generates an event name"""
        returnval = None
        options = list(self.society_type.keys())
        for _ in range (len(options)-1): # Purposeful to create variety
            # Designed to randomly accessing categories
            option = choice(options)
            options.remove(option)
            if society_prename.lower() in self.society_type[option]:
                returnval = f"{society_prename} {self.type_map[option]}"
                break

        if not returnval:
            returnval = f"{society_prename} {choice(['Event', 'Meet'])}"

        return returnval

    def generate_description(self):
        """Generates an event description"""
        a = choice(self.opening_phrases)
        b = choice(self.middle_phrases)
        c = choice(self.ending_phrases)
        d = choice(self.final_paragraphs)

        return f"{a} {b}\n{c}\n\n{d}"

    def generate_random_duration(self):
        """Generate and return a random duration from 1-3 hours."""
        duration_choices = [timedelta(hours=i) for i in range(1, 4)]
        return choice(duration_choices)

    def generate_random_date(self, past):
        """Generate a future event date within the next 30 days."""
        today = date.today()
        now_time = datetime.now().time()
        latest_allowed_time = time(20, 45)  # 8:45 PM

        # If it's already too late today, start from tomorrow
        # random_days = randint(int(now_time > latest_allowed_time) , 30)
        if now_time > latest_allowed_time:
            random_days = randint(1, 30)
        else:
            random_days = randint(0, 30)
        mult = 1 - 2 * int(past) # Ensures date lies in the past if past is true
        return today + timedelta(days=random_days) * mult

    def generate_reasonable_time(self, event_date):
        """
        Generate a future time (9:00 AM to 8:45 PM),
        ensuring it's after the current time if the event is on the same day.
        """
        now = datetime.now()

        valid_hours = list(range(9, 21))  # 9 AM to 8:45 PM
        valid_minutes = [0, 15, 30, 45]

        if event_date != now.date():
            return time(hour=choice(valid_hours), minute=choice(valid_minutes))
        else:
            possible_times = [
                time(hour=h, minute=m)
                for h in valid_hours
                for m in valid_minutes
                if datetime.combine(event_date, time(hour=h, minute=m)) > now
            ]
            if possible_times:
                return choice(possible_times)

            # If no valid times remain, schedule the event for tomorrow at 9:00 AM
            return time(hour=9, minute=0)

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

    def create_event(self, n, past=False, for_society=None):
        """Create n different events"""
        societies = get_model_entries_as_list(Society)
        if not societies:
            print(self.style.WARNING("No societies found. Skipping event creation."))
            return

        for i in range(1, n + 1):
            print(f"Seeding {'past ' if past else ''}event "
            f"{f'for {for_society} ' if for_society else ''}{i}/{n}", end='\r')
            society = choice(societies) if not for_society else for_society

            event, _ = self.generate_random_event(society, status="Pending", past=past)

            approved = self.handle_event_request_approval(event)
            if approved:
                self.create_event_comments(event, past)
                all_students = list(society.society_members.order_by("?"))
                num_attendees = min(randint(5, 20), len(all_students))
                selected_attendees = all_students[:num_attendees]

                event.current_attendees.add(*selected_attendees)
                event.save()
            if approved and past:
                self.handle_attendance(event)

        print(self.style.SUCCESS(
            f"Seeding {'past ' if past else ''}event "
            f"{f'for {for_society} ' if for_society else ''}{n}/{n}"
        ), flush=True)

    def handle_attendance(self, event):
        """Records seeded attendance for event attendees"""
        attendees = event.current_attendees.all()
        for attendee in attendees:
            attended = choice((True, False))
            if attended:
                attendee.attended_events.add(event)

    def generate_random_event(self, society, status="Approved", past=False):
        """Generate a random event and ensure attendees are added."""
        data = self.generate(society.name, past)
        event, created = Event.objects.get_or_create(
            title=data["name"],
            main_description=data["description"],
            date=data["event_date"],
            start_time=data["event_time"],
            duration=data["duration"],
            hosted_by=society,
            location=data["location"],
            status=status,
        )

        return event, created

    def handle_event_request_approval(self, event : Event):
        """Creates requests for event approval"""
        default_student = self.select_from_student(event.hosted_by)
        if not default_student:
            return False

        er = self.get_default_event_request(event, default_student)
        er.approved = True
        event.status = "Approved"
        er.save()
        event.save()

        return True

    def create_event_requests(self, n, past=False):
        """Creates unapproved event requests"""
        societies = get_model_entries_as_list(Society)
        if not societies:
            print(self.style.WARNING("No societies found. Skipping event request creation."))
            return

        for i in range(1, n + 1):
            print(f"Seeding {'past ' if past else ''}event request {i}/{n}", end='\r')
            society = choice(societies)

            event, _ = self.generate_random_event(society, status="Pending", past=past)

            self.handle_event_request_not_approval(event)

        print(self.style.SUCCESS(
            f"Seeding {'past ' if past else ''}event request {n}/{n}"
        ), flush=True)

    def handle_event_request_not_approval(self, event : Event):
        """Creates requests for event approval"""
        random_status = choice(["Pending", "Rejected"])
        default_student = self.select_from_student(event.hosted_by)
        if not default_student:
            return False

        er = self.get_default_event_request(event, default_student)
        if random_status == "Rejected":
            er.approved = False
        event.status = random_status
        er.save()
        event.save()

        return True

    def select_from_student(self, society: Society):
        """Returns a valid student for sending an eventrequest"""
        from_options = [society.president]
        if society.vice_president:
            from_options.append(society.vice_president)
        if society.event_manager:
            from_options.append(society.vice_president)

        default_student = choice(from_options) or get_active_students().first()
        if not default_student:
            print("No student available to assign from_student.")
            return None
        return default_student

    def get_default_event_request(self, event, student):
        """Returns a basic event_request object"""
        return EventRequest.objects.create(
            event=event,
            hosted_by=event.hosted_by,
            from_student=student,
            intent="CreateEve",
        )

    def create_event_comments(self, event: Event, past: bool=False, parent: Comment=None):
        """Seeds comments on events"""
        content = get_comment_data(parent, past)
        society_members = list(event.hosted_by.society_members.all())

        comment = Comment.objects.create(
            event=event,
            user=choice(society_members),
            content=content,
        )
        like_dislike_comments(comment, society_members)
        assign_comment_parent(comment, parent)

        if random() < 0.60:
            self.create_event_comments(event, past, choice((comment, parent)))
