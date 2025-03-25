from api.models import User, Student, Society
from rest_framework.validators import UniqueValidator
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for the base User model.
    """
    is_following = serializers.SerializerMethodField()
    following_count = serializers.SerializerMethodField()
    followers_count = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = [
            'id', 'username', 'password', 'first_name',
            'last_name', 'email', 'is_active', 'role', 'following',
            'is_following', 'following_count', 'followers_count',
            'is_super_admin', 'is_staff', 'is_superuser'
        ]
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8},
            'username': {'validators': [UniqueValidator(queryset=User.objects.all())]},
            'email': {'validators': [UniqueValidator(queryset=User.objects.all())]},
        }

    def get_is_following(self, obj):
        """Check if the user is following."""
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return request.user.following.filter(id=obj.id).exists()
        return False

    def get_followers_count(self, obj):
        """Get the number of a users followers"""
        return obj.followers.count()

    def get_following_count(self, obj):
        """Get the number of users followed"""
        return obj.following.count()

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
    president_of = serializers.PrimaryKeyRelatedField(
        queryset=Society.objects.all(),
        allow_null=True, required=False
    )
    vice_president_of_society = serializers.SerializerMethodField()
    event_manager_of_society = serializers.SerializerMethodField()
    major = serializers.CharField(required=True)
    is_president = serializers.BooleanField(read_only=True)
    is_vice_president = serializers.BooleanField(read_only=True)
    is_event_manager = serializers.BooleanField(read_only=True)
    icon = serializers.SerializerMethodField()


    class Meta(UserSerializer.Meta):
        model = Student
        fields = UserSerializer.Meta.fields + ['major', 'societies', 'president_of', 'is_president',
                                               'vice_president_of_society', 'is_vice_president',
                                               'event_manager_of_society', 'is_event_manager', 'icon']
        read_only_fields = ["is_president", "is_vice_president", "is_event_manager"]


    def get_event_manager_of_society(self, obj):
        """Get the ID of the society where the student is event manager"""
        try:
            # Check if it's a RelatedManager
            if hasattr(obj.event_manager_of_society, 'all'):
                society = obj.event_manager_of_society.first()
                if society:
                    return society.id

            # If it's not a RelatedManager but a direct reference
            elif hasattr(obj, 'event_manager_of_society') and obj.event_manager_of_society:
                if hasattr(obj.event_manager_of_society, 'pk'):
                    return obj.event_manager_of_society.pk
        except Exception as e:
            print(f"DEBUG - Error in get_event_manager_of_society: {str(e)}")

        return None

    def get_vice_president_of_society(self, obj):
        """Get the ID of the society where the student is vice president"""
        try:
            # Check if it's a RelatedManager
            if hasattr(obj.vice_president_of_society, 'all'):
                society = obj.vice_president_of_society.first()
                if society:
                    return society.id

            # If it's not a RelatedManager but a direct reference
            elif hasattr(obj, 'vice_president_of_society') and obj.vice_president_of_society:
                if hasattr(obj.vice_president_of_society, 'pk'):
                    return obj.vice_president_of_society.pk
        except Exception as e:
            print(f"DEBUG - Error in get_vice_president_of_society: {str(e)}")

        return None

    def get_icon(self, obj):
        """Return full URL for the icon image"""
        if obj.icon:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.icon.url) if request else obj.icon.url
        return None


    def validate_email(self, value):
        """
        Check if the email is unique and provide a custom error message.
        """
        instance = getattr(self, 'instance', None)
        if User.objects.filter(email=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("user with this email already exists.")
        return value

    def validate_username(self, value):
        """
        Check if the username is unique and provide a custom error message.
        """
        instance = getattr(self, 'instance', None)
        if User.objects.filter(username=value).exclude(id=instance.id if instance else None).exists():
            raise serializers.ValidationError("user with this username already exists.")
        return value

    def create(self, validated_data):
        """
        Override create to handle Student-specific fields.
        """
        societies = validated_data.pop('societies', [])
        president_of = validated_data.pop('president_of', None)
        major = validated_data.pop('major')
        password = validated_data.pop('password')

        student = Student.objects.create(**validated_data)
        student.set_password(password)
        student.major = major
        student.save()

        if societies:
            student.societies.set(societies)

        if president_of:
            student.president_of_id = president_of.id
            student.save()

        return student

class AdminSerializer(serializers.ModelSerializer):
    """
    Serializer for Admin users.
    """
    full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 
            'first_name', 
            'last_name', 
            'username', 
            'email', 
            'is_active', 
            'role', 
            'is_super_admin',
            'full_name',
            'following',
            'followers'
        ]
        read_only_fields = ['id']
    
    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()
