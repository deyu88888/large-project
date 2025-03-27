from random import choice
from faker import Faker
from django.contrib.auth.hashers import make_password
from django.core.management import color_style
from api.models import Student, UserRequest


class RandomStudentDataGenerator():
    """Class encompassing tools to generate student data"""
    def __init__(self):
        self.majors = [
            "Computer Science", "Software Engineering",
            "Mechanical Engineering", "Electrical Engineering",
            "Aerospace Engineering", "Biomedical Engineering",
            "Business Administration", "Finance", "Accounting", "Economics",
            "International Business", "Human Resource Management",
            "Psychology", "Sociology", "Anthropology", "Political Science",
            "Philosophy", "Linguistics", "Literature", "English",
            "Education", "Early Childhood Education", "Special Education",
            "Mathematics", "Statistics", "Physics", "Chemistry", "Biology",
            "Environmental Science", "Geology", "Geography", "Marine Biology",
            "Nursing", "Public Health", "Pharmacy", "Dentistry", "Medicine",
            "Law", "Criminal Justice", "Forensic Science", "Social Work",
            "Art", "Graphic Design", "Music", "Theater", "Dance",
            "Architecture", "Urban Planning", "Interior Design",
            "Culinary Arts", "Hospitality Management", "Tourism Management",
            "Agriculture", "Horticulture", "Forestry", "Animal Science",
            "Religious Studies", "Theology", "Ethnic Studies",
            "Physics Education", "Chemistry Education", "Biology Education",
        ]
        self.generated_usernames = set()

        self.fake = Faker()
        self.style = color_style()


    def generate(self) -> dict:
        """Generates artificial data for a student and returns in a dict"""
        return_dict = {}

        return_dict["major"] = choice(self.majors)
        return_dict["first_name"], return_dict["last_name"] = self.generate_name()
        return_dict["username"] = self.gen_unique_username(
            return_dict["first_name"].lower(),
            return_dict["last_name"].lower(),
        )

        return return_dict

    def generate_name(self) -> tuple:
        """Generates a student first and last name"""
        fn = self.fake.first_name()
        ln = self.fake.last_name()
        return (fn, ln)

    def gen_unique_username(self, fn, ln):
        "Ensures the generated username hasn't been generated befores"
        if f"{fn}-{ln}" not in self.generated_usernames:
            self.generated_usernames.add(f"{fn}-{ln}")
            return f"{fn}-{ln}"
        for i in range(1, 101):
            if f"{fn}-{ln}{i}" not in self.generated_usernames:
                self.generated_usernames.add(f"{fn}-{ln}{i}")
                return f"{fn}-{ln}{i}"

    def create_student(self, n):
        """Create n different students"""
        created_count = 0

        while created_count < n:
            created_count += 1
            print(f"Seeding student {created_count}/{n}", end='\r', flush=True)

            data = self.generate()

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
