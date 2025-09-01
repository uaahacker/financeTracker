import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'financetracker.settings')

app = Celery('financetracker')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')


# Configure periodic tasks
app.conf.beat_schedule = {
    'process-scheduled-payments': {
        'task': 'scheduling.tasks.process_scheduled_payments',
        'schedule': 60.0,  # Run every minute for testing, should be daily in production
    },
    'generate-emi-payments': {
        'task': 'loans.tasks.generate_emi_payments',
        'schedule': 86400.0,  # Run daily
    },
    'send-payment-reminders': {
        'task': 'notifications.tasks.send_payment_reminders',
        'schedule': 3600.0,  # Run hourly
    },
    'cleanup-expired-notifications': {
        'task': 'notifications.tasks.cleanup_expired_notifications',
        'schedule': 86400.0,  # Run daily
    },
}
app.conf.timezone = 'UTC'
