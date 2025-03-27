from apscheduler.schedulers.background import BackgroundScheduler
import datetime
from django.utils import timezone
from api.models import Event

def auto_reject_events():
    now = timezone.now()
    pending_events = Event.objects.filter(status="Pending")
    count = 0
    for event in pending_events:
        event_start = datetime.datetime.combine(event.date, event.start_time, tzinfo=datetime.timezone.utc)
        if now >= event_start:
            event.status = "Rejected"
            event.save()
            count += 1

def start_scheduler():
    scheduler = BackgroundScheduler()
    scheduler.add_job(auto_reject_events, 'interval', minutes=30, next_run_time=timezone.now())
    scheduler.start()
