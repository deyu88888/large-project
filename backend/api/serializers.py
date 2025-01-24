from .models import User, Student, Admin, Society, Event, Notification
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
    societies = serializers.PrimaryKeyRelatedField(many=True, queryset=Society.objects.all())
    president_of = serializers.PrimaryKeyRelatedField(many=True, queryset=Society.objects.all())
    major = serializers.CharField(required=True)

    class Meta(UserSerializer.Meta):
        model = Student
        fields = UserSerializer.Meta.fields + ['major', 'societies', 'president_of', 'is_president']

    def validate_email(self, value):
        """
        Check if the email is unique.
        """
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_username(self, value):
        """
        Check if the username is unique.
        """
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def create(self, validated_data):
        societies = validated_data.pop('societies', [])
        president_of = validated_data.pop('president_of', [])
        major = validated_data.pop('major')
        password = validated_data.pop('password')

        student = Student.objects.create(**validated_data)
        student.set_password(password)
        student.major = major
        student.save()
            
        if societies:
            student.societies.set(societies)
        if president_of:
            student.president_of.set(president_of)

        return student

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

    def validate_email(self, value):
        if Admin.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value

    def validate_username(self, value):
        if Admin.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value

class SocietySerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Society model """

    class Meta:
        """ SocietySerializer meta data """

        model = Society
        fields = ['id', 'name', 'society_members', 'roles', 'leader']

    def create(self, validated_data):
        """ Use passing in json dict data to create a new Society """
        members_data = validated_data.pop('society_members', [])
        society = Society.objects.create(**validated_data)

        if members_data:
            society.society_members.set(members_data)

        society.save()
        return society

    def update(self, instance, validated_data):
        """ Use passing in a Society and json dict data to update a Society """
        members_data = validated_data.pop('society_members', [])

        for key, value in validated_data.items():
            setattr(instance, key, value)

        if members_data:
            instance.society_members.set(members_data)

        instance.save()
        return instance

class EventSerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Event model """

    class Meta:
        """ EventSerializer meta data """

        model = Event
        fields = [
            'id', 'title', 'description', 'date',
            'start_time', 'duration', 'hosted_by', 'location'
        ]
        extra_kwargs = { 'hosted_by' : { 'required' : True } }

    def create(self, validated_data):
        """ Creates a new entry in the Event table according to json data """

        return Event.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """ Update 'instance' object according to provided json data """

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.save()
        return instance

class NotificationSerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Notification model """

    class Meta:
        """ NotificationSerializer meta data """
        model = Notification
        fields = ['id', 'for_event', 'for_student']
        extra_kwargs = {
            'for_event' : { 'required' : True },
            'for_student' : { 'required' : True }
        }

    def create(self, validated_data):
        """ Create a notification entry according to json data """

        return Notification.objects.create(**validated_data)

    def update(self, instance, validated_data):
        """ Update 'instance' object according to provided json data """

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.save()
        return instance
