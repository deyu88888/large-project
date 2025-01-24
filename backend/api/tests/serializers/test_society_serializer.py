# pylint: disable=no-member
from django.test import TestCase
from api.models import Society, Student
from api.serializers import SocietySerializer

class SocietySerializerTestCase(TestCase):
    """ Unit tests for the Society serializer """

    def setUp(self):
        self.student1 = Student(
            username='QWERTY',
            first_name='QWE',
            last_name='RTY',
            email='qwerty@gmail.com',
            role='student',
            major='CompSci',
        )
        self.student1.save()

        self.student2 = Student(
            username='Ja-Smith',
            first_name='Jane',
            last_name='Smith',
            email='jasmith@gmail.com',
            role='student',
            major='Mathematics',
        )
        self.student2.save()

        self.society = Society(
            name='Tech',
            leader=self.student1,
            approved_by=self.advisor,
            roles={'Treasurer' : self.student2.id}
        )
        self.society.save()
        self.society.society_members.add(self.student2)

        self.serializer = None
        self.data = {
            'name' : 'Music',
            'leader' : self.student1.id,
            'society_members' : [self.student2.id],
            'roles' : []
        }

    def test_society_serialization(self):
        """ Test to ensure the serializer is correctly serializing """

        self.serializer = SocietySerializer(instance=self.society)
        data = self.serializer.data

        self.assertEqual(data['name'], self.society.name)
        self.assertEqual(data['leader'], self.society.leader.id)
        self.assertEqual(data['approved_by'], self.society.approved_by.id)
        self.assertEqual(
            data['society_members'], 
            [self.society.society_members.first().id]
        )
        self.assertEqual(data['roles'], self.society.roles)

    def test_society_deserialization(self):
        """ Test to ensure deserialization functions correctly """

        self.serializer = SocietySerializer(data=self.data)
        self._assert_serializer_is_valid()

        society = self.serializer.save()

        self.assertEqual(society.name, self.data['name'])
        self.assertEqual(society.leader.id, self.data['leader'])
        self.assertEqual(
            list(society.society_members.values_list('id', flat=True)),
            self.data['society_members']
        )
        self.assertEqual(society.approved_by.id, self.data['approved_by'])
        self.assertEqual(society.roles, self.data['roles'])

    def test_society_create(self):
        """ Test society creation function correctly """

        self.serializer = SocietySerializer(data=self.data)
        self._assert_serializer_is_valid()

        society = self.serializer.save()

        self.assertEqual(society.name, self.data['name'])
        self.assertEqual(society.leader.id, self.data['leader'])
        self.assertEqual(
            list(society.society_members.values_list('id', flat=True)),
            self.data['society_members']
        )
        self.assertEqual(society.approved_by.id, self.data['approved_by'])
        self.assertEqual(society.roles, self.data['roles'])

    def test_society_update(self):
        """ Test society update functions correctly """

        self.serializer = SocietySerializer(
            instance=self.society, 
            data=self.data,
            partial=True
        )
        self._assert_serializer_is_valid()

        self.serializer.save()

        self.assertEqual(self.society.name, self.data['name'])
        self.assertEqual(self.society.leader.id, self.data['leader'])
        self.assertEqual(
            list(self.society.society_members.values_list('id', flat=True)),
            self.data['society_members']
        )
        self.assertEqual(self.society.approved_by.id, self.data['approved_by'])
        self.assertEqual(self.society.roles, self.data['roles'])

    def _assert_serializer_is_valid(self):
        if not self.serializer.is_valid():
            self.fail("Test serializer should be valid")

    def _assert_serializer_is_invalid(self):
        if self.serializer.is_valid():
            self.fail("Test serializer should be invalid")
