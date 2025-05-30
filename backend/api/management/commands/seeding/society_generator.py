from random import choice, sample, random, randint
import os
from io import BytesIO
from PIL import Image
from django.core.files.uploadedfile import SimpleUploadedFile
from django.core.management import color_style
from api.models import User, Society, Student, SocietyRequest, SocietyShowreel
from api.management.commands.seeding.seeding_utility import get_active_students, \
    get_model_entries_as_list


class RandomSocietyDataGenerator():
    """Class encompassing tools to generate society data"""
    def __init__(self, admin_generator, event_generator):
        self.prefix_names = [
            "Architecture",
            "Art",
            "Badminton",
            "Biology",
            "Chemistry",
            "Chess",
            "Computing",
            "Economics",
            "Fashion",
            "Football",
            "Gaming",
            "Knitting",
            "Literature",
            "Mathematics",
            "Music",
            "Philosophy",
            "Physics",
            "Politics",
            "Retro",
            "Rugby",
            "Sailing",
            "Sewing",
            "Swimming",
            "Tabletop",
            "Tennis",
        ]
        self.suffix_names = [
            "Club",
            "Society",
            "Group",
            "Association",
            "Union",
        ]

        self.generated_names = set()

        self.opening_phrases = [
            "A vibrant community dedicated to",
            "An engaging environment focused on",
            "A dynamic group passionate about",
            "A friendly place for",
            "An inclusive community aimed at",
        ]

        self.middle_phrases = [
            "bringing like-minded individuals together.",
            "promoting learning and collaboration.",
            "fostering creativity and innovation.",
            "connecting enthusiasts from all backgrounds.",
            "providing opportunities for skill development.",
        ]

        self.ending_phrases = [
            "Join us for events, discussions, and activities.",
            "Whether you're a beginner or an expert, there's something for everyone.",
            "Be part of our exciting journey and make new friends along the way.",
            "Together, we grow, learn, and make a difference.",
            "Your passion and enthusiasm are always welcome here.",
        ]

        self.final_paragraphs = [
            "Our members are at the heart of everything we do, and we take "
            "pride in building a welcoming and supportive atmosphere. "
            "We encourage creativity, friendship, and lifelong connections."
            " Come along and see what we're all about!",

            "We believe that every individual brings something unique to the "
            "group, and we strive to create an environment where everyone feels"
            " valued and heard. Don't miss out on the chance to be part of a "
            "thriving community that makes a difference!",

            "By joining us, you'll be opening the door to new experiences, "
            "friendships, and learning opportunities. We're always looking for"
            " fresh ideas and passionate members to help us grow. Come be part "
            "of our story!",

            "No matter your background or experience level, you'll find a place with us. "
            "Bring your ideas, your enthusiasm, and your curiosity—we can't wait to meet you!",
        ]

        self.categories = [
            "Academic & Educational",
            "Arts & Culture",
            "Sports & Fitness",
            "Technology & Computing",
            "Gaming & Esports",
            "Social & Community",
            "Creative & Performing Arts",
            "Hobbies & Interests",
            "Political & Activism",
            "Science & Innovation",
            "Environment & Sustainability",
            "Outdoor & Adventure",
            "Faith & Spirituality",
            "Cultural & Diversity",
            "Media & Journalism",
            "Volunteering & Charity",
            "Food & Culinary",
            "Business & Entrepreneurship",
            "Fashion & Design",
            "Mind & Wellbeing",
            "Historical & Heritage",
            "Language & Literature",
            "Philosophy & Debate",
            "STEM & Innovation",
            "Personal Development",
        ]

        self.tags = {
            "community": [],
            "education": [],
            "culture": [],
            "sports": [
                "Football",
                "Rugby",
                "Tennis",
                "Badminton",
                "Swimming",
                "Sailing"
            ],
            "technology": ["Gaming"],
            "gaming": ["Gaming", "Tabletop"],
            "arts": ["Fashion", "Art", "Music", "Literature"],
            "creative": ["Fashion", "Art", "Music", "Literature", "Sewing", "Knitting"],
            "innovation": [],
            "learning": [],
            "discussion": ["Philosophy", "Politics"],
            "networking": [],
            "environment": [],
            "adventure": [],
            "spirituality": [],
            "diversity": [],
            "media": [],
            "volunteering": [],
            "culinary": [],
            "business": ["Economics"],
            "fashion": ["Fashion"],
            "wellbeing": [],
            "history": [],
            "language": [],
            "philosophy": ["Philosophy", "Politics"],
            "stem": [
                "Mathematics",
                "Physics",
                "Chemistry",
                "Biology",
                "Computing"
            ],
            "development": ["Economics"],
            "friendship": [],
            "collaboration": [],
        }

        self.style = color_style()
        self.admin_generator = admin_generator
        self.event_generator = event_generator

    def generate(self) -> dict:
        """Generates artificial data for a society and returns in a dict"""
        return_dict = {}

        return_dict["name"] = self.generate_name()
        return_dict["description"] = self.generate_description()
        return_dict["category"] = choice(self.categories)
        return_dict["tags"] = self.generate_tags(return_dict["name"].split()[0])
        return_dict["social_media_links"] = self.get_society_socials()

        icon_name = f'{return_dict["name"].split()[0].lower()}.jpg'
        return_dict["icon"] = os.path.join('pre-seed-icons', icon_name)

        return return_dict

    def generate_name(self) -> str:
        """Generates a society name"""
        prename = choice(self.prefix_names)
        sufname = choice(self.suffix_names)

        if len(self.generated_names) < len(self.suffix_names) * len(self.prefix_names) - 1:
            while f"{prename} {sufname}" in self.generated_names:
                prename = choice(self.prefix_names)
                sufname = choice(self.suffix_names)

        self.generated_names.add(f"{prename} {sufname}")
        return f"{prename} {sufname}"

    def generate_description(self) -> str:
        """Generates a society description"""
        a = choice(self.opening_phrases)
        b = choice(self.middle_phrases)
        c = choice(self.ending_phrases)
        d = choice(self.final_paragraphs)

        return f"{a} {b}\n{c}\n\n{d}"

    def generate_tags(self, prename) -> list:
        """Generates tags for a society"""
        r_tags = []
        for tag, tag_list in self.tags.items():
            if prename in tag_list:
                r_tags.append(tag)
            if len(r_tags) >= 3:
                break

        if len(r_tags) < 3:
            remaining_tags = list(set(self.tags.keys()) - set(r_tags))
            r_tags.extend(sample(remaining_tags, k=3-len(r_tags)))
        return r_tags

    def create_society(self, n=1, name=None, president_force=None):
        """
        Create n different societies owned by random students
        or creates a society with the name 'name'
        """
        for i in range(1, n+1):
            print(f"Seeding society {i}/{n}", end='\r', flush=True)

            admin = self.get_viable_admin()
            data = self.generate()
            approved = True
            society = None

            president = president_force or self.get_new_society_president()
            if not president:
                return
            if name:
                data["name"] = name
            else:
                approved = self.handle_society_request_approval(
                    president,
                    data,
                )
                if not approved:
                    continue

            if "social_media_links" not in data or not data["social_media_links"]:
                data["social_media_links"] = {
                    "Email": f"{data['name'].lower().replace(' ', '')}@example.com"
                }

            society, created = Society.objects.get_or_create(
                name=data["name"],
                president=president,
                category=data["category"],
                status="Approved",
                description=data["description"],
                tags=data["tags"],
                icon=data["icon"],
                approved_by=admin,
                social_media_links=data["social_media_links"]
            )
            if created:
                self.finalize_society_creation(society)

                num_events = randint(2, 4)
                self.event_generator.create_event(num_events, for_society=society)

        print(self.style.SUCCESS(f"Seeding society {n}/{n}"), flush=True)

    def get_new_society_president(self):
        """Gets a user who can take the role of society president"""
        available_students = get_active_students().order_by("?")
        if not available_students.exists():
            print(self.style.WARNING("No available students."))
            return None

        viable_presidents = (
            available_students
            .filter(president_of=None)
            .filter(is_vice_president=False)
            .filter(is_event_manager=False)
        )
        return viable_presidents.first()

    def get_viable_admin(self):
        """Get an admin for the required approved_by field"""
        admin = User.get_admins().order_by('?').first()
        if not admin:
            print(self.style.WARNING("No admin users found. Creating one."))
            self.admin_generator.create_admin(1)
            admin = User.get_admins().first()
        return admin

    def get_society_socials(self):
        """Assigns socials to a society (placeholder kclsu)"""
        socials_dict = {
            "Facebook": "https://www.facebook.com/kclsupage/",
            "Instagram": "https://www.instagram.com/kclsu/",
            "X": "https://x.com/kclsu",
        }
        return socials_dict

    def finalize_society_creation(self, society):
        """Finishes society creation with proper members and roles"""
        society.president.president_of = society
        society.president.is_president = True

        selected_members, request_members = (
            self.get_selected_and_request_members(society.president)
        )

        society.society_members.add(society.president)
        society.society_members.add(*selected_members)

        for member in request_members:
            SocietyRequest.objects.create(
                intent="JoinSoc",
                from_student=member,
                society=society,
            )

        role_viable_members = list(
            society.society_members
            .filter(is_vice_president=False)
            .filter(is_event_manager=False)
            .filter(is_president=False)
        )
        # Assign roles (ensure at least 2 for vp and event manager)
        if len(role_viable_members) >= 2:
            society.vice_president = role_viable_members[0]
            society.vice_president.is_vice_president = True
            society.vice_president.save()

            society.event_manager = role_viable_members[1]
            society.event_manager.is_event_manager = True
            society.event_manager.save()

        society.society_socials = self.get_society_socials()
        self.seed_society_showreel(society)

        society.save()
        society.president.save()

    def get_selected_and_request_members(self, president):
        """Get two lists of members to be added to the society"""
        all_students = list(
            Student.objects.exclude(
                id=president.id
                ).order_by("?").filter(is_active=True
            )
        )
        members_num = 5
        while members_num < get_active_students().count()-1 and random() <= 0.912:
            members_num += 1
        selected_members = all_students[:members_num-2]
        request_members = all_students[members_num-2:members_num]
        return selected_members, request_members

    def handle_society_request_approval(self, president, data):
        """Creates approved society requests"""
        society_request, created = SocietyRequest.objects.get_or_create(
            name=data["name"],
            from_student=president,
            category=data["category"],
            description=data["description"],
            icon=data["icon"],
            social_media_links=data["social_media_links"],
            intent="CreateSoc",
        )
        if created:
            society_request.approved = True
            society_request.save()
            return True
        return False

    def create_society_requests(self, n):
        """Create n society requests"""
        for i in range(1, n+1):
            print(f"Seeding society request {i}/{n}", end='\r', flush=True)

            data = self.generate()

            president = self.get_new_society_president()
            if not president:
                print(self.style.WARNING("No students eligible to be presidents left."))
                return

            self.create_unapproved_society_request(president, data)

        print(self.style.SUCCESS(f"Seeding society request {n}/{n}"), flush=True)

    def create_unapproved_society_request(self, president, data):
        """Creates approved society requests"""
        approved = choice([False, None])

        society_request, created = SocietyRequest.objects.get_or_create(
            name=data["name"],
            from_student=president,
            category=data["category"],
            description=data["description"],
            icon=data["icon"],
            social_media_links=data["social_media_links"],
            intent="CreateSoc",
        )
        if created:
            society_request.approved = approved
            society_request.save()
            return True
        return False

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

    def create_society_detail_request(self, n):
        """Seeds society detail requests"""
        for i in range(1, n+1):
            society = choice(get_model_entries_as_list(Society))
            data = self.generate()
            detail_request = SocietyRequest(
                society=society,
                from_student=society.president,
                intent="UpdateSoc",
            )
            name_choice = choice((True, False))
            description_choice = choice((True, False))
            category_choice = choice((True, False))
            if name_choice:
                detail_request.name = data["name"]
            if description_choice:
                detail_request.description = data["description"]
            if category_choice:
                detail_request.category = data["category"]
            detail_request.approved = choice((False, None))

            print((f"Seeding society detail request {i}/{n}"), flush=True)
        print(self.style.SUCCESS(f"Seeding society detail request {n}/{n}"), flush=True)
