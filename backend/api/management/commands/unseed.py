from django.core.files.storage import default_storage
from django.core.management.base import BaseCommand
from django.conf import settings
import api.models as m

class Command(BaseCommand):
    """ Build automation command to unseed the database """

    help = 'Removes all entries from the database'

    def handle(self, *args, **kwargs):
        """ Unseed the database """
        try:
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
                m.SocietyShowreel,
                m.SocietyShowreelRequest,
            ]

            images = list(m.SocietyShowreel.objects.values_list('photo', flat=True))
            images.extend(list(m.SocietyShowreelRequest.objects.values_list('photo', flat=True)))
            images.extend(list(m.Student.objects.values_list('icon', flat=True)))
            images.extend(list(m.UserRequest.objects.values_list('icon', flat=True)))
            images.extend(list(m.Society.objects.values_list('icon', flat=True)))
            images.extend(list(m.SocietyRequest.objects.values_list('icon', flat=True)))

            for image in images:
                if image and default_storage.exists(image) and not image.startswith("pre-seed-icons"):
                    default_storage.delete(image)

            for model in models: # Iterate through and clear all models
                model.objects.all().delete()

            print('Database successfully unseeded')
        except (m.SocietyShowreel.DoesNotExist, m.SocietyShowreelRequest.DoesNotExist, m.Student.DoesNotExist, m.UserRequest.DoesNotExist, m.Society.DoesNotExist, m.SocietyRequest.DoesNotExist) as e:
            print(f"A specific error occurred while unseeding: {e}")

        except Exception as e:
            print(f"An unexpected error occurred while unseeding: {e}")