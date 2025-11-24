from django.db import models
import uuid
from django.utils import timezone
# If not using Postgres, use models.JSONField (Django 3.1+)

class Session(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    company = models.CharField(max_length=200, blank=True, null=True)
    last_topic = models.CharField(max_length=100, blank=True, null=True)
    history = models.JSONField(default=list)   # list of {question,topic,company,answer_json,raw,ts}
    created_at = models.DateTimeField(default=timezone.now)

    def append_history(self, entry):
        self.history.append(entry)
        self.save(update_fields=["history"])
