from api.models import User, Student, Advisor, Admin
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the base User model.
    """
    class Meta:
        model = User
        fields =['id', 'username', 'password', 'first_name', 'last_name', 'email', 'is_active', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8},
        }

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if password:
            instance.set_password(password)

        instance.save()
        return instance

class StudentSerializer(UserSerializer):
    """
    Serializer for the Student model.
    """
    societies = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta(UserSerializer.Meta):
        model = Student
        fields = UserSerializer.Meta.fields + ['major', 'societies']

    def create(self, validated_data):
        """
        Override create to handle Advisor-specific fields.
        """
        societies = validated_data.pop('societies', [])
        major = validated_data.pop('major')
        password = validated_data.pop('password')
        student = Student.objects.create(**validated_data)
        student.set_password(password)
        student.major = major
        student.save()

        if societies:
            student.societies.set(societies)

        return student

class AdvisorSerializer(UserSerializer):
    """
    Serializer for the Advisor model.
    """
    societies = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta(UserSerializer.Meta):
        model = Advisor
        fields = UserSerializer.Meta.fields + ['department', 'societies']

    def create(self, validated_data):
        """
        Override create to handle Advisor-specific fields.
        """
        societies = validated_data.pop('societies', [])
        department = validated_data.pop('department')
        password = validated_data.pop('password')
        advisor = Advisor.objects.create(**validated_data)
        advisor.set_password(password)
        advisor.department = department
        advisor.save()

        if societies:
            advisor.societies.set(societies)

        return advisor


class AdminSerializer(UserSerializer):
    """
    Serializer for the Admin model.
    """

    class Meta(UserSerializer.Meta):
        model = Admin
        fields = UserSerializer.Meta.fields

    def create(self, validated_data):
        password = validated_data.pop("password")
        validated_data['role'] = 'admin'
        admin = Admin.objects.create(**validated_data)
        admin.set_password(password)
        admin.is_superuser = True
        admin.is_staff = True
        admin.save()
        return admin

