from django.core.exceptions import ObjectDoesNotExist
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
            m.NewsComment,
            m.Comment,
            m.AdminReportRequest,
            m.ReportReply,
            m.SocietyNews,
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

        images = self.get_all_images()

        try:
            for image in images:
                default_storage.delete(image)
            for model in models: # Iterate through and clear all models
                model.objects.all().delete()
        except (ObjectDoesNotExist) as e:
            print(f"An 'ObjectDoesNotExist' error occurred while unseeding: {e}")
        except Exception as e:
            print(f"An unexpected error occurred while unseeding: {e}")

        print('Database successfully unseeded')

    def get_all_images(self):
        """Helper function to delete all images"""
        images = list(m.SocietyShowreel.objects.values_list('photo', flat=True))
        images.extend(list(m.SocietyShowreelRequest.objects.values_list('photo', flat=True)))
        images.extend(list(m.Student.objects.values_list('icon', flat=True)))
        images.extend(list(m.UserRequest.objects.values_list('icon', flat=True)))
        images.extend(list(m.Society.objects.values_list('icon', flat=True)))
        images.extend(list(m.SocietyRequest.objects.values_list('icon', flat=True)))
        images = [image for image in images if image and default_storage.exists(image)]
        images = [image for image in images if not image.startswith("pre-seed-icons")]
        images = [image for image in images if not image.startswith("news_icons")]
        images = [image for image in images if not image.startswith("default_event")]
        return images
