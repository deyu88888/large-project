from api.models import Student, Society, SocietyRequest, SocietyShowreel, UserRequest
from api.serializers import StudentSerializer
from api.serializers_files.serializers_utility import get_society_if_exists, is_user_student
from rest_framework import serializers
from django.utils.translation import gettext_lazy as _


class SocietyShowreelSerializer(serializers.ModelSerializer):
    """
    Serializer for the SocietyShowreel model
    """
    class Meta:
        """SocietyShowreelSerializer meta data"""
        model = SocietyShowreel
        fields= ('photo', 'caption')

class SocietySerializer(serializers.ModelSerializer):
    """ 
    Serializer for objects of the Society model 
    """
    showreel_images = SocietyShowreelSerializer(many=True, required=False)
    president = StudentSerializer(read_only=True)
    president_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, source='president'
    )
    vice_president = StudentSerializer(read_only=True)
    vice_president_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, source='vice_president', required=False
    )
    event_manager = StudentSerializer(read_only=True)
    event_manager_id = serializers.PrimaryKeyRelatedField(
        queryset=Student.objects.all(), write_only=True, source='event_manager', required=False
    )
    tags = serializers.ListField(child=serializers.CharField(), required=False)
    icon = serializers.SerializerMethodField()

    class Meta:
        """SocietySerializer meta data"""
        model = Society
        fields = [
            'id', 'name', 'description', 'society_members', 'approved_by',
            'status', 'category', 'social_media_links', 'showreel_images',
            'membership_requirements', 'upcoming_projects_or_plans', 'icon','tags','president_id',
            'vice_president', 'event_manager','event_manager_id', 'vice_president_id',
            'president',
        ]
        extra_kwargs = {
            'society_members': {'required': False},
            'social_media_links': {'required': False},
            'membership_requirements': {'required': False},
            'upcoming_projects_or_plans': {'required': False},
        }

    def get_icon(self, obj):
        """Return full URL for the icon image"""
        if obj.icon:
            request = self.context.get("request")
            return request.build_absolute_uri(obj.icon.url) if request else obj.icon.url
        return None

    def validate_social_media_links(self, value):
        """ Ensure social media links include valid URLs """
        if value:
            for key, link in value.items():
                if not link.startswith("http"):
                    raise serializers.ValidationError(f"{key} link must be a valid URL.")
        return value

    def create(self, validated_data):
        """ Use passing in JSON dict data to create a new Society """
        photos_data = validated_data.pop('showreel_images', [])
        members_data = validated_data.pop('society_members', [])
        tags_data = validated_data.pop('tags', [])


        society = Society.objects.create(**validated_data)

        if members_data:
            society.society_members.set(members_data)
        for photo_data in photos_data:
            SocietyShowreel.objects.create(society=society, **photo_data)

        society.tags = tags_data
        society.save()
        return society

    def update(self, instance, validated_data):
        """ Use passing in a Society and JSON dict data to update a Society """
        photos_data = validated_data.pop('showreel_images', [])
        members_data = validated_data.pop('society_members', [])
        tags_data = validated_data.pop('tags', [])

        for key, value in validated_data.items():
            setattr(instance, key, value)

        instance.showreel_images.all().delete()
        if members_data:
            instance.society_members.set(members_data)
        for photo_data in photos_data:
            SocietyShowreel.objects.create(society=instance, **photo_data)

        instance.tags = tags_data
        instance.save()
        return instance
    
        
class LeaveSocietySerializer(serializers.Serializer):
    """
    Serializer for leaving a society.
    """

    def __init__(self, *args, **kwargs):
        self.society_id = kwargs.pop('society_id', None)
        super().__init__(*args, **kwargs)

    def validate(self, data):
        """
        Validate if the user can leave the given society.
        """
        request_user = is_user_student(self.context, "Only students can leave societies.")

        society_id = self.society_id
        if society_id is None:
            raise serializers.ValidationError({"error": "society_id is required."})

        society = get_society_if_exists(society_id)

        # Check if the user is actually a member of the society
        if not society.society_members.filter(id=request_user.id).exists():
            raise serializers.ValidationError({"error": "You are not a member of this society."})

        return {"society": society}

    def save(self):
        """
        Remove the student from the society.
        """
        request_user = self.context['request'].user
        society = self.validated_data["society"]

        request_user.student.societies.remove(society)

        return society


class JoinSocietySerializer(serializers.Serializer):
    """
    Serializer for joining a society.
    """
    society_id = serializers.IntegerField()

    def validate_society_id(self, value):
        """Validates the passed society id corresponds to a real society"""
        request_user = is_user_student(self.context, "Only students can join societies.")

        society = get_society_if_exists(value)

        if society.society_members.filter(id=request_user.id).exists():
            raise serializers.ValidationError("You are already a member of this society.")

        pending_request = SocietyRequest.objects.filter(
            from_student=request_user.student,
            society=society,
            intent="JoinSoc",
            approved=False
        ).exists()

        if pending_request:
            raise serializers.ValidationError("You already have a pending request to join this society.")

        return value

    def save(self):
        society_id = self.validated_data['society_id']
        society = Society.objects.get(id=society_id)
        return society
    

class StartSocietyRequestSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new society request.
    """
    description = serializers.CharField(max_length=500)
    category = serializers.CharField(max_length=50)
    requested_by = serializers.PrimaryKeyRelatedField(queryset=Student.objects.all(), required=True)

    class Meta:
        model = Society
        fields = ["id", "name", "description", "category", "requested_by", "status"]
        read_only_fields = ["status"]

    def validate(self, data):
        if Society.objects.filter(name=data["name"]).exists():
            raise serializers.ValidationError("A society with this name already exists.")
        return data

    def create(self, validated_data):
        """Handle creating a society request (save as a draft society)."""
        return Society.objects.create(
            name=validated_data["name"],
            roles={"description": validated_data["description"], "category": validated_data["category"]},
            president=validated_data["requested_by"],
            status="Pending"
        )

class PendingMemberSerializer(serializers.ModelSerializer):
    """
    Serializer for pending membership requests.
    """
    student_id = serializers.IntegerField(source="from_student.id")
    first_name = serializers.CharField(source="from_student.first_name")
    last_name = serializers.CharField(source="from_student.last_name")
    username = serializers.CharField(source="from_student.username")

    class Meta:
        """UserRequest meta data"""
        model = UserRequest
        fields = ["id", "student_id", "first_name", "last_name", "username", "approved"]
