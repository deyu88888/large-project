from django.core.management.base import BaseCommand
from api.models import User, Student, Admin, Society, Event, Notification

class Command(BaseCommand):
    """ Build automation command to unseed the database """

    help = 'Removes all entries from the database'

    def handle(self, *args, **kwargs):
        """ Unseed the database """

        log = ''
        if args or kwargs:
            log += 'Unused args passed\n'

        models = [Notification, Event, Society, User, Student, Admin]

        for model in models: # Iterate through and clear all models
            model.objects.all().delete()

        print('Database successfully unseeded')
