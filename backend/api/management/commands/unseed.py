from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
import api.models as m

class Command(BaseCommand):
    """ Build automation command to unseed the database """

    help = 'Removes all entries from the database'

    def handle(self, *args, **kwargs):
        """ Unseed the database """

        log = ''
        if args or kwargs:
            log += 'Unused args passed\n'

        models = [
            m.Notification,
            m.EventRequest,
            m.Event,
            m.SocietyShowreelRequest,
            m.SocietyRequest,
            m.SocietyShowreel,
            m.Society,
            m.UserRequest,
            m.AwardStudent,
            m.Award,
            m.User,
            m.Student,
            m.Admin,
            m.SocietyShowreel,
            m.SocietyShowreelRequest,
        ]

        images = list(m.SocietyShowreel.objects.values_list('photo', flat=True))
        images.extend(list(m.Student.objects.values_list('icon', flat=True)))
        images.extend(list(m.Society.objects.values_list('icon', flat=True)))

        for image in images:
            if image and default_storage.exists(image):
                default_storage.delete(image)

        for model in models: # Iterate through and clear all models
            model.objects.all().delete()

        print('Database successfully unseeded')
