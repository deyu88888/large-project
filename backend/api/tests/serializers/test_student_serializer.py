from django.test import TestCase
from django.contrib.auth import get_user_model
from api.models import Student, Society, Admin
from api.serializers import StudentSerializer
from api.tests.file_deletion import delete_file

User = get_user_model()

class StudentSerializerTestCase(TestCase):
    
    def setUp(self):
        # Create an admin user for society approval
        self.admin = Admin.objects.create_user(
            username="admin_user",
            password="adminpassword",
            email="admin@example.com",
            first_name="Admin",
            last_name="User",
        )
        
        self.student_data = {
            "username": "unique_student",
            "password": "Password123",
            "first_name": "Jane",
            "last_name": "Doe",
            "email": "unique_email@example.com",
            "major": "Computer Science",
            "societies": [],
            "president_of": None,  # For a OneToOneField, use None (or a single value) instead of a list.
        }
        # Create an existing student using create_user.
        self.student = Student.objects.create_user(
            username="existing_student",
            password="Password123",
            first_name="Jane",
            last_name="Doe",
            email="existing_email@example.com",
            major="Computer Science",
        )
        
        # Create another student to be the president of society2
        self.student2 = Student.objects.create_user(
            username="second_student",
            password="Password123",
            first_name="John",
            last_name="Smith",
            email="second_student@example.com",
            major="Physics",
        )
        
        # Create two societies with required fields
        self.society1 = Society.objects.create(
            name='Science Club',
            president=self.student,
            approved_by=self.admin,
            status='Approved',
            social_media_links={"Email": "science@example.com"}
        )
        
        self.society2 = Society.objects.create(
            name='Math Club',
            president=self.student2,  # Add a president for society2
            approved_by=self.admin,
            status='Approved',
            social_media_links={"Email": "math@example.com"}
        )
        
        # Set the many-to-many relationship.
        # The reverse relation is defined as "societies_belongs_to" on Student.
        self.student.societies.set([self.society1])
        # For president_of (OneToOneField), assign a single society (not a list).
        self.student.president_of = self.society1
        # Mark the student as a president.
        self.student.is_president = True
        self.student.save()

    def test_student_serialization(self):
        """Test that the student is serialized correctly."""
        serializer = StudentSerializer(instance=self.student)
        data = serializer.data
        self.assertEqual(data["username"], self.student.username)
        self.assertEqual(data["major"], self.student.major)
        # Check many-to-many using the reverse manager.
        self.assertEqual(
            data["societies"],
            list(self.student.societies.values_list("id", flat=True))
        )
        # president_of should be serialized as a single value (the society's ID).
        self.assertEqual(data["president_of"], self.society1.id)
        self.assertEqual(data["is_president"], True)
        # Ensure password is not in the serialized output.
        self.assertNotIn("password", data)

    def test_student_deserialization(self):
        """Test that valid data can be deserialized and create a new student."""
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        student = serializer.save()
        self.assertEqual(student.major, self.student_data["major"])
        # For societies (ManyToMany), an empty list is expected.
        self.assertEqual(list(student.societies.all()), [])
        # For president_of, since the input was None, it should remain None.
        self.assertIsNone(student.president_of)
        self.assertTrue(student.check_password(self.student_data["password"]))

    def test_duplicate_email_validation(self):
        """Test that duplicate email validation works."""
        self.student_data["email"] = self.student.email  # Duplicate email
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)
        self.assertEqual(serializer.errors["email"][0], "user with this email already exists.")

    def test_duplicate_username_validation(self):
        """Test that duplicate username validation works."""
        self.student_data["username"] = self.student.username  # Duplicate username
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("username", serializer.errors)
        self.assertEqual(serializer.errors["username"][0], "user with this username already exists.")

    def test_missing_required_fields(self):
        """Test that missing required fields cause validation errors."""
        invalid_data = self.student_data.copy()
        del invalid_data["email"]  # Remove email
        serializer = StudentSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_optional_fields(self):
        """Test that optional fields are handled correctly."""
        self.student_data["societies"] = []
        self.student_data["president_of"] = None
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        student = serializer.save()
        self.assertEqual(list(student.societies.all()), [])
        self.assertIsNone(student.president_of)
        # If not set, is_president should be False by default.
        self.assertFalse(student.is_president)

    def test_password_minimum_length(self):
        """Test that a password that's too short fails validation."""
        self.student_data["password"] = "short"
        serializer = StudentSerializer(data=self.student_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("password", serializer.errors)

    def test_societies_and_president_of_relationship(self):
        """
        Test that the many-to-many and one-to-one relationships are set correctly.
        Because president_of is a OneToOneField and already assigned to an existing student,
        we need to create a new society for a new student to avoid UNIQUE constraint errors.
        """
        # Create a new student to be the president of the new society
        temp_president = Student.objects.create_user(
            username="temp_president",
            password="Password123",
            first_name="Temp",
            last_name="president",
            email="temp_president@example.com",
            major="Art",
        )
        
        # Create a new society that isn't already assigned, with a temporary president
        new_society = Society.objects.create(
            name="New Society", 
            status="Approved",
            president=temp_president,  # Add a temporary president for the new society
            approved_by=self.admin,
            social_media_links={"Email": "new@example.com"}
        )
        
        # Set up payload so that the new student will have both societies.
        self.student_data["president_of"] = new_society.id  # Use new_society for this new student.
        self.student_data["societies"] = [self.society1.id, self.society2.id, new_society.id]
        
        serializer = StudentSerializer(data=self.student_data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        student = serializer.save()
        
        # After saving, update the society's president to be the newly created student
        new_society.president = student
        new_society.save()
        
        self.assertEqual(
            list(student.societies.values_list("id", flat=True)),
            self.student_data["societies"]
        )
        # president_of should equal new_society
        self.assertEqual(student.president_of.id, new_society.id)
        self.assertTrue(student.is_president)

    def test_student_update(self):
        """Test that updating a student works correctly."""
        update_data = {"first_name": "Updated"}
        serializer = StudentSerializer(instance=self.student, data=update_data, partial=True)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        updated_student = serializer.save()
        self.assertEqual(updated_student.first_name, "Updated")

    def test_invalid_email_format(self):
        """Test that an invalid email format causes a validation error."""
        invalid_data = self.student_data.copy()
        invalid_data["email"] = "invalid-email"
        serializer = StudentSerializer(data=invalid_data)
        self.assertFalse(serializer.is_valid())
        self.assertIn("email", serializer.errors)

    def test_password_not_in_output(self):
        """Ensure that the serialized output does not include the password."""
        serializer = StudentSerializer(instance=self.student)
        data = serializer.data
        self.assertNotIn("password", data)

    def test_student_not_president(self):
        """Test that a student without a president_of society is not a president."""
        student = Student.objects.create_user(
            username="non_president",
            password="Password123",
            first_name="Test",
            last_name="User",
            email="non_president@example.com",
            major="Physics",
        )
        serializer = StudentSerializer(instance=student)
        self.assertFalse(serializer.data["is_president"])

    def tearDown(self):
        for society in Society.objects.all():
            if society.icon:
                delete_file(society.icon.path)
        for student in Student.objects.all():
            if student.icon:
                delete_file(student.icon.path)