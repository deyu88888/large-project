from django.test import TestCase
from api.models import Student, SocietyRequest
from api.serializers import RequestSerializer


class ConcreteRequestSerializer(RequestSerializer):
    """Concrete implementation of RequestSerializer for testing abstract model"""
    class Meta(RequestSerializer.Meta):
        model = SocietyRequest
        fields = RequestSerializer.Meta.fields


class RequestSerializerTestCase(TestCase):
    """
    Unit tests for the RequestSerializer class
    """

    def setUp(self):
        self.student = Student.objects.create_user(
            username='test_student',
            first_name='Alice',
            last_name='Johnson',
            email='alice.johnson@example.com',
            major='Computer Science',
            password='password123',
            role='student'
        )
        
        self.student2 = Student.objects.create_user(
            username='test_student2',
            first_name='Bob',
            last_name='Smith',
            email='bob.smith@example.com',
            major='Engineering',
            password='password123',
            role='student'
        )

        self.society_request = SocietyRequest.objects.create(
            from_student=self.student,
            approved=False,
            intent="UpdateSoc"
        )

        self.serializer = None
        self.data = {
            "from_student": self.student.id,
            "approved": True,
            "intent": "UpdateSoc"
        }

    def test_request_serialization(self):
        """Test RequestSerializer serialization"""
        self.serializer = ConcreteRequestSerializer(instance=self.society_request)
        data = self.serializer.data
        self.assertEqual(self.society_request.from_student.id, data["from_student"])
        self.assertEqual(self.society_request.approved, data["approved"])
        self.assertEqual(self.society_request.intent, data["intent"])
        self.assertIn("requested_at", data)
        self.assertEqual(
            self.society_request.from_student.id,
            data["from_student"]
        )

    def test_request_deserialization(self):
        """Test RequestSerializer deserialization"""
        self.serializer = ConcreteRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        request = self.serializer.save()

        self.assertEqual(request.from_student.id, self.data["from_student"])
        self.assertEqual(request.approved, self.data["approved"])
        self.assertEqual(request.intent, self.data["intent"])
        self.assertEqual(
            request.from_student.id,
            self.data["from_student"]
        )

    def test_request_create(self):
        """Test RequestSerializer creation"""
        self.serializer = ConcreteRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        request_data = self.serializer.validated_data

        self.assertEqual(request_data["approved"], self.data["approved"])
        self.assertEqual(request_data["intent"], self.data["intent"])
        self.assertEqual(
            request_data["from_student"].id,
            self.data["from_student"]
        )

    def test_request_update(self):
        """Test RequestSerializer update"""
        self.assertFalse(self.society_request.approved)

        self.serializer = ConcreteRequestSerializer(
            instance=self.society_request,
            data=self.data,
            partial=True,
        )
        self._assert_serializer_is_valid()
        self.serializer.save()

        self.society_request.refresh_from_db()
        self.assertTrue(self.society_request.approved)
        
    def test_create_with_explicit_call(self):
        """Test the create method directly"""
        self.serializer = ConcreteRequestSerializer(data=self.data)
        self._assert_serializer_is_valid()
        request = self.serializer.create(self.serializer.validated_data)
        
        self.assertEqual(request.from_student.id, self.data["from_student"])
        self.assertEqual(request.approved, self.data["approved"])
        self.assertEqual(request.intent, self.data["intent"])
        
    def test_update_with_explicit_call(self):
        """Test the update method directly"""
        original_intent = self.society_request.intent
        update_data = {
            "from_student": self.student2
        }
        
        self.serializer = ConcreteRequestSerializer()
        updated_request = self.serializer.update(self.society_request, update_data)
        
        self.assertEqual(updated_request.from_student.id, self.student2.id)
        self.assertEqual(updated_request.intent, original_intent)  # Unchanged
        
    def test_create_with_all_fields(self):
        """Test creating with all possible fields"""
        complete_data = {
            "from_student": self.student.id,
            "approved": True,
            "intent": "CreateSoc"
        }
        
        self.serializer = ConcreteRequestSerializer(data=complete_data)
        self._assert_serializer_is_valid()
        
        request = self.serializer.save()
        self.assertEqual(request.from_student.id, complete_data["from_student"])
        self.assertEqual(request.approved, complete_data["approved"])
        self.assertEqual(request.intent, complete_data["intent"])
        self.assertIsNotNone(request.requested_at)  # Auto-populated
        
    def test_missing_required_field(self):
        """Test validation error when required field is missing"""
        incomplete_data = {
            "approved": True,
            "intent": "UpdateSoc"
        }
        
        self.serializer = ConcreteRequestSerializer(data=incomplete_data)
        self.assertFalse(self.serializer.is_valid())
        self.assertIn("from_student", self.serializer.errors)
        
    def test_create_with_null_student(self):
        """Test creating with null student (should be valid if the model allows it)"""
        null_student_data = {
            "from_student": None,
            "approved": False,
            "intent": "UpdateSoc"
        }
        
        self.serializer = ConcreteRequestSerializer(data=null_student_data)
        self.assertTrue(self.serializer.is_valid())
        request = self.serializer.save()
        self.assertIsNone(request.from_student)
        
    def test_invalid_intent_choice(self):
        """Test validation error for invalid intent choice"""
        invalid_intent_data = {
            "from_student": self.student.id,
            "approved": True,
            "intent": "InvalidIntent"
        }
        
        self.serializer = ConcreteRequestSerializer(data=invalid_intent_data)
        self.assertFalse(self.serializer.is_valid())
        self.assertIn("intent", self.serializer.errors)
        
    def test_update_multiple_fields(self):
        """Test updating multiple fields at once"""
        update_data = {
            "from_student": self.student2.id,
            "approved": True,
            "intent": "CreateEve"
        }
        
        self.serializer = ConcreteRequestSerializer(
            instance=self.society_request,
            data=update_data
        )
        self._assert_serializer_is_valid()
        updated_request = self.serializer.save()
        
        self.assertEqual(updated_request.from_student.id, self.student2.id)
        self.assertEqual(updated_request.approved, True)
        self.assertEqual(updated_request.intent, "CreateEve")
        
    def test_serializer_with_context(self):
        """Test serializer with context"""
        context = {"test_context": "value"}
        self.serializer = ConcreteRequestSerializer(
            instance=self.society_request,
            context=context
        )
        self.assertEqual(self.serializer.context, context)
        
    def test_serializer_many_param(self):
        """Test serializer with many=True parameter"""
        second_request = SocietyRequest.objects.create(
            from_student=self.student2,
            approved=True,
            intent="JoinSoc"
        )
        
        requests = [self.society_request, second_request]
        self.serializer = ConcreteRequestSerializer(requests, many=True)
        
        data = self.serializer.data
        self.assertEqual(len(data), 2)
        self.assertEqual(data[0]["from_student"], self.student.id)
        self.assertEqual(data[1]["from_student"], self.student2.id)
        self.assertEqual(data[0]["intent"], "UpdateSoc")
        self.assertEqual(data[1]["intent"], "JoinSoc")
        
    def test_empty_data_deserialization(self):
        """Test deserialization with empty data"""
        self.serializer = ConcreteRequestSerializer(data={})
        self.assertFalse(self.serializer.is_valid())
        
    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail(f"Test serializer should be valid. Errors: {self.serializer.errors}")