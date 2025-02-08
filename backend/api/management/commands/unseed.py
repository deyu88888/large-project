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
            m.SocietyRequest,
            m.Society,
            m.UserRequest,
            m.AwardStudent,
            m.Award,
            m.User,
            m.Student,
            m.Admin,
        ]

        for model in models: # Iterate through and clear all models
            model.objects.all().delete()

        print('Database successfully unseeded')
