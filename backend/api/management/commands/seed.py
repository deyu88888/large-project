from random import choice, random
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from api.management.commands.seeding.generators import (
    RandomEventDataGenerator,
    RandomSocietyDataGenerator,
    RandomStudentDataGenerator,
    AdminGenerator,
)
from api.management.commands.seeding.seeding_utility import (
    get_active_students,
    get_model_entries_as_list,
    get_comment_data,
    like_dislike_comments,
    assign_comment_parent,
)
from api.models import (
    User,
    Student,
    Society,
    Award,
    AwardStudent,
    SocietyNews,
    NewsComment,
    NewsPublicationRequest,
)


class Command(BaseCommand):
    """Seeds the database with super admins, admins, students, societies, and events"""
    help = "Seed the database with super admins, normal admins, students, societies, and events"

    def __init__(self):
        self.event_generator = RandomEventDataGenerator()
        self.student_generator = RandomStudentDataGenerator()
        self.admin_generator = AdminGenerator()
        self.society_generator = RandomSocietyDataGenerator(
            self.admin_generator,
            self.event_generator,
        )
        super().__init__()

    def handle(self, *args, **kwargs):
        """Handles database seeding"""
        # Create/Get Admin using create_admin, to avoid code duplication
        quantity = kwargs.get("quantity", [5, 150, 40, 50, 5, 200, 10, 15])
        self.admin_generator.create_admin(quantity[0])
        self.admin_generator.create_super_admins()

        self.student_generator.create_student(quantity[1])

        self.create_default_students()
        
        # Delete any duplicate Robotics Club societies before proceeding
        robotics_clubs = Society.objects.filter(name="Robotics Club").order_by('id')
        if robotics_clubs.count() > 1:
            # Keep the first one, delete the rest
            for club in robotics_clubs[1:]:
                print(f"Deleting duplicate Robotics Club with ID {club.id}")
                club.delete()
        
        # Modify the society generator's generated_names set to include "Robotics Club"
        # This prevents it from generating another society with that name
        self.society_generator.generated_names.add("Robotics Club")
        
        # Create additional societies
        self.society_generator.create_society(quantity[2])
        self.society_generator.create_society_requests(quantity[2])
        
        self.event_generator.create_event(quantity[3], past=False)
        self.event_generator.create_event(quantity[4], past=True)
        self.event_generator.create_event_requests(quantity[3], past=False)
        self.event_generator.create_event_requests(quantity[4], past=True)

        # Use filter().first() instead of get() to prevent the MultipleObjectsReturned error
        robotics_soc = Society.objects.filter(name="Robotics Club").first()
        self.create_unassigned_student(robotics_soc)

        self.pre_define_awards()
        self.randomly_assign_awards(quantity[5])

        self.admin_generator.create_admin_reports(quantity[6])
        self.create_society_news(quantity[7])
        self.create_news_publication_requests(quantity[7])  


    def get_or_create_user(self, model, username, email, first_name, last_name, defaults):
        """Create a user object"""
        user, created = model.objects.get_or_create(
            email=email,
            defaults={
                "username": username,
                "first_name": first_name,
                "last_name": last_name,
                **defaults,
            },
        )
        return user, created

    def create_default_students(self):
        """Seeds all the default example students"""
        president, _ = self.get_or_create_user(
            Student,
            username="president_user",
            email="president@kcl.ac.uk",
            first_name="John",
            last_name="Doe",
            defaults={
                "password": make_password("presidentpassword"),
                "major": "Mechanical Engineering",
                "is_president": True
            },
        )

        vice_president, _ = self.get_or_create_user(
             Student,
             username="vice_president_user",
             email="vicepresident@kcl.ac.uk",
             first_name="Vice",
             last_name="President",
             defaults={
                 "password": make_password("vicepresidentpassword"),
                 "major": "Electrical Engineering"
             },
         )
        event_manager, _ = self.get_or_create_user(
            Student,
            username="event_manager_user",
            email="eventmanager@kcl.ac.uk",
            first_name="Event",
            last_name="Manager",
            defaults={
                "password": make_password("eventmanagerpassword"),
                "major": "Digital Arts"
            },
        )

        self.create_robotics_society(
            president=president,
            vice_president=vice_president,
            event_manager=event_manager,
        )

    def create_robotics_society(self, president, vice_president, event_manager):
        """Seeds the example society, Robotics Society"""
        if president.is_event_manager or president.is_vice_president:
            president.is_event_manager = False
            president.is_vice_president = False
            president.save()

            president.is_president = True
            president.save()

        # Check if society already exists before creating
        society = Society.objects.filter(name="Robotics Club").first()
        if not society:
            # Add "Robotics Club" to the generated_names set to prevent duplicates
            self.society_generator.generated_names.add("Robotics Club")
            
            self.society_generator.create_society(
                name="Robotics Club",
                president_force=president
            )
            society = Society.objects.filter(name="Robotics Club").first()
        else:
            # If society exists, ensure the president is properly set
            society.president = president
            president.president_of = society
            president.is_president = True
            president.save()
            society.save()
        
        president.president_of = society
        self.society_generator.seed_society_showreel(society, n=10)
        self.event_generator.create_event(1, for_society=society)

        society.vice_president = vice_president
        society.event_manager = event_manager
        society.icon = "pre-seed-icons/robotics.jpg"
        society.society_members.add(president, vice_president, event_manager)

        vice_president.is_vice_president = True
        event_manager.is_event_manager = True

        president.save()
        vice_president.save()
        event_manager.save()
        society.save()

    def create_unassigned_student(self, society):
        """Create student_user who is unassigned as a role"""
        student, _ = self.get_or_create_user(
            Student,
            username="student_user",
            email="student@kcl.ac.uk",
            first_name="John",
            last_name="Smith",
            defaults={
                "password": make_password("studentpassword"),
                "major": "Computer Science",
            },
        )
        student.save()
        society.society_members.add(student)

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
        students = list(get_active_students())
        awards = get_model_entries_as_list(Award)
        for i in range(1, n+1):
            print(f"Seeding awards {i}/{n}", end='\r')
            random_student = choice(students)
            random_award = choice(awards)
            self.enforce_award_validity(random_award, random_student)
        print(self.style.SUCCESS(f"Seeding awards {n}/{n}"))

    def create_society_news(self, n: int):
        """Create news randomly for societies"""
        societies = get_model_entries_as_list(Society)
        for i in range(1,n+1):
            society = choice(societies)
            members = list(society.society_members.all())
            soc_news = SocietyNews.objects.create(
                society=society,
                title=f"Big news {i}",
                content=f"News related to {society}",
                author=choice(members),
                tags=society.tags,
                status=choice(SocietyNews.STATUS_CHOICES)[1],
            )
            self.create_news_comments(soc_news)
            print(self.style.SUCCESS(f"News Created: {soc_news}"))

    def create_news_comments(self, news: SocietyNews, parent: NewsComment=None):
        """Seeds comments on news"""
        content = get_comment_data(parent)
        society_members = list(news.society.society_members.all())

        comment = NewsComment.objects.create(
            news_post=news,
            user=choice(society_members),
            content=content,
        )
        like_dislike_comments(comment, society_members)
        assign_comment_parent(comment, parent)

        if random() < 0.60:
            self.create_news_comments(news, choice((comment, parent)))

    def create_news_publication_requests(self, n: int):
        """Seeds news publication requests"""
        news_posts = list(SocietyNews.objects.filter(status="Draft"))
        students = list(Student.objects.filter(is_president=True))
        admins = list(User.objects.filter(is_staff=True))

        statuses = [
            "Pending", "Approved", "Rejected", "Cancelled", 
            "Superseded_Approved", "Superseded_Rejected"
        ]

        for i in range(n):
            if not news_posts or not students:
                break

            news_post = choice(news_posts)
            requested_by = choice(students)
            status = choice(statuses)

            pub_request = NewsPublicationRequest.objects.create(
                news_post=news_post,
                requested_by=requested_by,
                status="Pending",
            )

            if status != "Pending":
                pub_request.status = status
                pub_request.reviewed_by = choice(admins)
                if status in ["Rejected", "Superseded_Rejected"]:
                    pub_request.admin_notes = f"Auto-rejected: Reason XYZ"
                pub_request.save()