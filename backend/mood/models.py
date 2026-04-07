import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


class MoodEntry(models.Model):
    MOOD_CHOICES = [(1, 'Very Bad'), (2, 'Bad'), (3, 'Okay'), (4, 'Good'), (5, 'Great')]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='moods')
    date = models.DateField(default=timezone.now)
    mood = models.IntegerField(choices=MOOD_CHOICES)
    emoji = models.CharField(max_length=10)
    note = models.TextField(max_length=200, blank=True)
    logged_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['user', 'date']
        ordering = ['-date']

    def __str__(self):
        return f"{self.user.display_name} mood {self.mood} on {self.date}"


class Meetup(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    date = models.DateField()
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='meetups')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date']

    def __str__(self):
        return f"{self.title} on {self.date}"
