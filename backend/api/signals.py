from django.db.models.signals import m2m_changed
from django.dispatch import receiver
from .models import Student, Society, Notification
from django.db.models.signals import post_save

@receiver(m2m_changed, sender=Student.president_of.through)
def update_is_president_on_m2m_change(sender, instance, action, reverse, pk_set, **kwargs):
    """
    When a Student is added/removed from 'president_of' (meaning they become 
    or stop being President of a society), update that Student's 'is_president' field.
    """
    if action in ["post_add", "post_remove", "post_clear"]:

        if not reverse:

            instance.is_president = instance.president_of.exists()
            instance.save(update_fields=['is_president'])
        else:

            for student_pk in pk_set:
                try:
                    student = Student.objects.get(pk=student_pk)
                    student.is_president = student.president_of.exists()
                    student.save(update_fields=['is_president'])
                except Student.DoesNotExist:
                    pass
  
  
@receiver(post_save, sender=Society)
def notify_on_status_change(sender, instance, **kwargs):
    if instance.status == "Approved":
        Notification.objects.create(
            for_event=None,  # No event tied to this notification
            for_student=instance.leader,
            message=f"Your request to create the society '{instance.name}' has been approved!"
        )
    elif instance.status == "Rejected":
        Notification.objects.create(
            for_event=None,
            for_student=instance.leader,
            message=f"Your request to create the society '{instance.name}' was rejected. Please contact the admin for details.",
        )


@receiver(m2m_changed, sender=Student.president_of.through)
def update_is_president(sender, instance, action, **kwargs):
    if action in ["post_add", "post_remove", "post_clear"]:
        instance.is_president = instance.president_of.exists()
        instance.save()