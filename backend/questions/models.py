import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone


QUESTION_BANK = [
    "What's something small that made you smile today?",
    "If we could teleport anywhere right now, where would you want to go?",
    "What's a memory of us that you keep coming back to?",
    "What's the first thing you want to do when we're finally together?",
    "What song reminds you of me and why?",
    "Describe your perfect lazy day with me.",
    "What's something you've been wanting to tell me but haven't yet?",
    "What do you miss most about being near me?",
    "What's a dream or goal you've been thinking about lately?",
    "If you could relive one moment of us together, which would it be?",
    "What's one thing you appreciate about me that you don't say enough?",
    "What does home feel like to you?",
    "What's something new you learned or discovered this week?",
    "If we had one full day together tomorrow, what would you plan?",
    "What's a fear you've been working through lately?",
    "What's something you've been looking forward to this week?",
    "What made today feel meaningful (or not)?",
    "What's the kindest thing anyone has done for you recently?",
    "If you could ask me one question and I had to answer honestly, what would it be?",
    "What's something you want us to try or experience together someday?",
    "How are you really doing right now — beyond the usual answer?",
    "What's a simple pleasure you enjoyed today?",
    "What's something you're proud of yourself for lately?",
    "If distance weren't a factor, what would our life look like?",
    "What's your love language and do you feel loved in it lately?",
    "What's a book, show, or song you want us to experience together?",
    "What's something you're grateful for today that you almost overlooked?",
    "What does a perfect morning look like for you?",
    "If you wrote me a letter right now, what would the first sentence be?",
    "What's one thing you'd want me to know about how you're feeling this week?",
]


class DailyQuestion(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    date = models.DateField(unique=True)
    text = models.TextField()

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.date}: {self.text[:50]}"

    @classmethod
    def get_or_create_today(cls):
        today = timezone.now().date()
        obj, created = cls.objects.get_or_create(
            date=today,
            defaults={'text': QUESTION_BANK[today.toordinal() % len(QUESTION_BANK)]}
        )
        return obj


class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(DailyQuestion, on_delete=models.CASCADE, related_name='answers')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='question_answers')
    text = models.TextField()
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['question', 'user']

    def __str__(self):
        return f"{self.user} answered on {self.question.date}"
