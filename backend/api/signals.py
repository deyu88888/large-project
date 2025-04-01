from datetime import datetime, timedelta
from django.db.models.signals import m2m_changed, post_save, pre_save
from django.dispatch import receiver
from django.utils import timezone
from .models import AwardStudent, Student, Society, Notification, EventRequest, SocietyRequest, Event, User

@receiver(post_save, sender=Student)
def update_is_president_on_save(sender, instance, created, **kwargs):
    new_value = instance.president_of is not None
    if instance.is_president != new_value:
        Student.objects.filter(pk=instance.pk).update(is_president=new_value)

@receiver(pre_save, sender=Society)
def update_vice_president_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            old_instance = Society.objects.get(pk=instance.pk)
            old_vice_president = old_instance.vice_president

            if old_vice_president != instance.vice_president:
                if old_vice_president:
                    old_vice_president.is_vice_president = False
                    old_vice_president.save()

                if instance.vice_president:
                    instance.vice_president.is_vice_president = True
                    instance.vice_president.save()
        except Society.DoesNotExist:
            pass

@receiver(post_save, sender=Society)
def update_new_vice_president_status(sender, instance, created, **kwargs):
    if created and instance.vice_president:
        instance.vice_president.is_vice_president = True
        instance.vice_president.save()
        
@receiver(pre_save, sender=Society)
def update_event_manager_status(sender, instance, **kwargs):
    if instance.pk:
        try:
            before_changes = Society.objects.get(pk=instance.pk)
            before_event_manager = before_changes.event_manager
            
            if instance.event_manager != before_event_manager:
                if instance.event_manager:
                    instance.event_manager.is_event_manager = True
                    instance.event_manager.save()
                
                if before_event_manager:
                    before_event_manager.is_event_manager = False
                    before_event_manager.save()
        except Society.DoesNotExist:
            pass

@receiver(post_save, sender=EventRequest)
def notify_on_event_requested(sender, instance, created, **kwargs):
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
    except Exception:
        pass

@receiver(post_save, sender=EventRequest)
def notify_on_event_status_update(sender, instance, created, **kwargs):
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
    except Exception:
        pass

@receiver(post_save, sender=SocietyRequest)
def notify_on_society_requested(sender, instance, created, **kwargs):
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
    except Exception:
        pass

@receiver(post_save, sender=SocietyRequest)
def notify_on_society_creation_update(sender, instance, created, **kwargs):
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
    except Exception:
        pass

@receiver(post_save, sender=SocietyRequest)
def notify_on_society_join_request(sender, instance, created, **kwargs):
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
    except Exception:
        pass

@receiver(post_save, sender=Event)
def notify_society_members_of_event(sender, instance, created, **kwargs):
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
    except Exception:
        pass

@receiver(m2m_changed, sender=Event.current_attendees.through)
def notify_society_members_of_event_time(sender, instance, action, pk_set, **kwargs):
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
    except Exception:
        pass

@receiver(post_save, sender=AwardStudent)
def notify_student_award_db(sender, instance, created, **kwargs):
    if created:
        try:
            Notification.objects.create(
                header="Award Received!",
                body=f"Congratulations! You have been awarded: {instance.award}",
                for_user=instance.student.user,
                is_important=True,
            )
        except Exception:
            pass