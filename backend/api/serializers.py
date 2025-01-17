from api.models import User, Society, Event, Notification
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}}

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data)
        return user

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
