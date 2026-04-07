import uuid
from django.db import models
from django.conf import settings


class LoveLetter(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='sent_letters'
    )
    body = models.TextField()
    photo = models.ImageField(upload_to='letters/', null=True, blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    read_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-sent_at']

    def __str__(self):
        return f"Letter from {self.sender.display_name} at {self.sent_at}"
