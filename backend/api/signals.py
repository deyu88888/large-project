from datetime import datetime, timedelta
from django.db.models.signals import m2m_changed, post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from channels.exceptions import ChannelFull
from .models import AwardStudent, Student, Society, Notification, EventRequest, SocietyRequest, Event, User

@receiver(post_save, sender=Student)
def update_is_president_on_save(sender, instance, created, **kwargs):
    # Determine the correct value for is_president based on president_of
    new_value = instance.president_of is not None
    # If the value has changed, update it without causing recursion
    if instance.is_president != new_value:
        Student.objects.filter(pk=instance.pk).update(is_president=new_value)
        
        broadcast_dashboard_update()

@receiver(pre_save, sender=Society)
def update_vice_president_status(sender, instance, **kwargs):
    """Update is_vice_president flag when vice_president changes"""
    if instance.pk:  # Only for existing societies
        try:
            # Try to get the previous vice president
            old_instance = Society.objects.get(pk=instance.pk)
            old_vice_president = old_instance.vice_president

            # If the vice president has changed
            if old_vice_president != instance.vice_president:
                # Reset old vice president's flag if exists
                if old_vice_president:
                    old_vice_president.is_vice_president = False
                    old_vice_president.save()

                # Set new vice president's flag if exists
                if instance.vice_president:
                    instance.vice_president.is_vice_president = True
                    instance.vice_president.save()
        except Society.DoesNotExist:
            pass  # This is a new society

@receiver(post_save, sender=Society)
def update_new_vice_president_status(sender, instance, created, **kwargs):
    """Update is_vice_president flag for new societies"""
    if created and instance.vice_president:
        instance.vice_president.is_vice_president = True
        instance.vice_president.save()
        
@receiver(pre_save, sender=Society)
def update_event_manager_status(sender, instance, **kwargs):
    """Update student's is_event_manager status when event_manager field changes"""
    # Only run if we have an existing instance to compare against
    if instance.pk:
        try:
            # Get the society instance before changes
            before_changes = Society.objects.get(pk=instance.pk)
            before_event_manager = before_changes.event_manager
            
            # If event manager has changed
            if instance.event_manager != before_event_manager:
                # If new event manager exists, set flag to True
                if instance.event_manager:
                    instance.event_manager.is_event_manager = True
                    instance.event_manager.save()
                
                # If previous event manager exists, set their flag to False
                if before_event_manager:
                    before_event_manager.is_event_manager = False
                    before_event_manager.save()
        except Society.DoesNotExist:
            pass  # This is a new society being created

def broadcast_dashboard_update():
    """
    Fetch updated dashboard statistics and send them to the WebSocket group.
    """
    from .models import Society, Event, Student

    try:
        # Calculate the statistics
        stats = {
            "totalSocieties": Society.objects.count(),
            "totalEvents": Event.objects.count(),
            "pendingApprovals": Society.objects.filter(status="Pending").count(),
            "activeMembers": Student.objects.count(),
        }

        # Send the data through WebSocket
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "dashboard",  # Group name
            {
                "type": "dashboard.update",  # Event type
                "data": stats,               # Data payload
            }
        )
    except ChannelFull:
        pass

@receiver(post_save, sender=EventRequest)
def notify_on_event_requested(sender, instance, created, **kwargs):
    """
    Notify admin on receival of a request for an event.
    """
    try:
        if not created or instance.intent != "CreateEve":
            return
        all_admins = User.get_admins()
        for admin in all_admins:
            Notification.objects.create(
                header="Event requested",
                body=f"The society, '{instance.hosted_by}' has requested for "
                f"the scheduling of an event, '{instance.event.title}' on {instance.event.date}",
                for_user=admin,
            )
    except Exception as e:
        pass

@receiver(post_save, sender=EventRequest)
def notify_on_event_status_update(sender, instance, created, **kwargs):
    """
    Notify president on event status change.
    """
    try:
        if created or instance.intent != "CreateEve":
            return

        event_title = instance.event.title if instance.event else "the event"

        if instance.approved:
            Notification.objects.create(
                header="Event Approved",
                for_user=instance.hosted_by.president,
                body=f"Your request to create the event '{event_title}' has been approved!",
                is_important=True,
            )
        elif instance.approved is False:
            Notification.objects.create(
                header="Event Denied",
                for_user=instance.hosted_by.president,
                body=f"Your request to create the event '{event_title}' "
                     "was rejected. Please contact the admin for details.",
                is_important=True,
            )
    except Exception as e:
        pass

@receiver(post_save, sender=SocietyRequest)
def notify_on_society_requested(sender, instance, created, **kwargs):
    """
    Notify admin on receival of a request for a society.
    """
    try:
        if not created:
            return
        all_admins = User.get_admins()
        for admin in all_admins:
            Notification.objects.create(
                header="Society requested",
                body=f"{str(instance.from_student)} has requested to create a"
                f" new society, '{instance.name}'",
                for_user=admin,
            )
    except Exception as e:
        pass

@receiver(post_save, sender=SocietyRequest)
def notify_on_society_creation_update(sender, instance, created, **kwargs):
    """
    Notify president on society status change.
    """
    try:
        if created or instance.intent != "CreateSoc":
            return
        if instance.approved:
            Notification.objects.create(
                header="Society Approved",
                for_user=instance.president,
                body=f"Your request to create the society '{instance.name}' has been approved!",
                is_important=True,
            )
        elif not instance.approved:
            Notification.objects.create(
                header="Society Denied",
                for_user=instance.president,
                body=f"Your request to create the society '{instance.name}'"
                " was rejected. Please contact the admin for details.",
                is_important=True,
            )
    except Exception as e:
        pass

    broadcast_dashboard_update()

@receiver(post_save, sender=SocietyRequest)
def notify_on_society_join_request(sender, instance, created, **kwargs):
    """
    Notify president on society join request.
    """
    try:
        if instance.intent != "JoinSoc":
            return
        if created:
            Notification.objects.create(
                header="Student requests to join",
                for_user=instance.society.president,
                body=f"The student, '{instance.from_student.full_name}'"
                " wishes to join your society",
            )
        elif instance.approved:
            Notification.objects.create(
                header="Join Approved",
                for_user=instance.president,
                body=f"Your request to join the society "
                f"'{instance.society.name}' has been approved!",
            )
        elif not instance.approved:
            Notification.objects.create(
                header="Join Rejected",
                for_user=instance.president,
                body=f"Your request to join the society "
                f"'{instance.society.name}' has been rejected.",
            )
    except Exception as e:
        pass

@receiver(post_save, sender=Event)
def notify_society_members_of_event(sender, instance, created, **kwargs):
    """
    Notify members that an event has been organised for their society.
    """
    try:
        if not created:
            return
        all_members = instance.hosted_by.society_members.all()
        for member in all_members:
            Notification.objects.create(
                header="Event scheduled",
                body=f"{instance.hosted_by.name} are hosting the event,"
                f" '{instance.title}'!",
                for_user=member,
            )
    except Exception as e:
        pass

@receiver(m2m_changed, sender=Event.current_attendees.through)
def notify_society_members_of_event_time(sender, instance, action, pk_set, **kwargs):
    """
    Notify members that an event will begin in a day.
    """
    try:
        if action == "post_add":
            send_time = datetime.combine(instance.date, instance.start_time)
            send_time = timezone.make_aware(send_time) - timedelta(days=1)

            for student_id in pk_set:
                student = Student.objects.get(id=student_id)
                Notification.objects.create(
                    header="Event soon!",
                    body=f"The event by {instance.hosted_by.name} is being"
                    f" hosted tomorrow @{str(instance.start_time)}!",
                    for_user=student,
                    send_time=send_time,
                )
    except Exception as e:
        pass

@receiver(post_save, sender=AwardStudent)
def notify_student_award(sender, instance, created, **kwargs):
    if created:
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "award_notifications",
            {
                "type": "send_award_notification",
                "message": {
                    "student": str(instance.student),
                    "award": str(instance.award),
                    "awarded_at": instance.awarded_at.isoformat(),
                },
            },
        )
