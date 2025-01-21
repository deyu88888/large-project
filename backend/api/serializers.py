from api.models import User, Student, Advisor, Admin, Society, Event, Notification
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
    major = serializers.CharField(required=True)
    department = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    class Meta(UserSerializer.Meta):
        model = Student
        fields = UserSerializer.Meta.fields + ['major', 'societies', 'president_of', 'is_president', 'department']

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
        """
        Override create to handle Advisor-specific fields.
        """
        societies = validated_data.pop('societies', [])
        major = validated_data.pop('major')
        department = validated_data.pop('department', None)
        password = validated_data.pop('password')
        student = Student.objects.create(**validated_data)
        student.set_password(password)
        student.major = major

        if department:
            student.department = department
            
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

class SocietySerializer(serializers.ModelSerializer):
    """ Serializer for objects of the Society model """

    class Meta:
        """ SocietySerializer meta data """

        model = Society
        fields = ['id', 'name', 'society_members', 'roles', 'leader', 'approved_by']

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



class LeaveSocietySerializer(serializers.Serializer):
    society_id = serializers.IntegerField()

    def validate_society_id(self, value):
        request_user = self.context['request'].user
        if not hasattr(request_user, 'student'):
            raise serializers.ValidationError("Only students can leave societies.")
        
        try:
            society = Society.objects.get(id=value)
        except Society.DoesNotExist:
            raise serializers.ValidationError("Society does not exist.")
        
        if not society.society_members.filter(id=request_user.id).exists():
            raise serializers.ValidationError("You are not a member of this society.")

        return value

    def save(self):
        society_id = self.validated_data['society_id']
        request_user = self.context['request'].user
        society = Society.objects.get(id=society_id)
        request_user.student.societies.remove(society)
        return society


class JoinSocietySerializer(serializers.Serializer):
    society_id = serializers.IntegerField()

    def validate_society_id(self, value):
        request_user = self.context['request'].user
        if not hasattr(request_user, 'student'):
            raise serializers.ValidationError("Only students can join societies.")
        
        try:
            society = Society.objects.get(id=value)
        except Society.DoesNotExist:
            raise serializers.ValidationError("Society does not exist.")
        
        if society.society_members.filter(id=request_user.id).exists():
            raise serializers.ValidationError("You are already a member of this society.")

        return value

    def save(self):
        society_id = self.validated_data['society_id']
        request_user = self.context['request'].user
        society = Society.objects.get(id=society_id)
        request_user.student.societies.add(society)
        return society


class RSVPEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = Event
        fields = ['id', 'title', 'date', 'start_time', 'duration', 'location']

    def validate(self, attrs):
        """
        Validate RSVP eligibility for an event.
        """
        request = self.context.get('request')
        event = self.instance
        student = request.user.student

        if self.context.get('action') == 'RSVP':
            # Rule 1: Ensure the student is a member of the hosting society
            if event.hosted_by not in student.societies.all():
                raise serializers.ValidationError("You must be a member of the hosting society to RSVP for this event.")

            # Rule 2: Ensure the student has not already RSVP’d
            if student in event.current_attendees.all():
                raise serializers.ValidationError("You have already RSVP'd for this event.")

            # Rule 3: Ensure the event is not in the past or has started
            if event.has_started():
                raise serializers.ValidationError("You cannot RSVP for an event that has already started.")

            # Rule 4: Ensure the event is not full
            if event.is_full():
                raise serializers.ValidationError("This event is full and cannot accept more RSVPs.")

        elif self.context.get('action') == 'CANCEL':
            # Rule 1: Ensure the student is currently RSVP’d for the event
            if student not in event.current_attendees.all():
                raise serializers.ValidationError("You have not RSVP'd for this event.")

        return attrs

    def save(self, **kwargs):
        """
        Save the RSVP or cancel RSVP action.
        """
        request = self.context.get('request')
        student = request.user.student
        event = self.instance

        if self.context.get('action') == 'RSVP':
            event.current_attendees.add(student)  # Add student to attendees
        elif self.context.get('action') == 'CANCEL':
            event.current_attendees.remove(student)  # Remove student from attendees

        return event

