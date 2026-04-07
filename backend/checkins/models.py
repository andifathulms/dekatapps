import uuid
from django.db import models
from django.conf import settings


class CheckIn(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='checkins'
    )
    latitude = models.DecimalField(max_digits=9, decimal_places=6)
    longitude = models.DecimalField(max_digits=9, decimal_places=6)
    place_name = models.CharField(max_length=255)
    place_type = models.CharField(max_length=100, default='place')
    note = models.TextField(max_length=200, blank=True)
    mood_emoji = models.CharField(max_length=10, blank=True)
    photo = models.ImageField(upload_to='checkins/', null=True, blank=True)
    checked_in_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-checked_in_at']

    def __str__(self):
        return f"{self.user.display_name} @ {self.place_name}"
