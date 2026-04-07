from rest_framework import serializers
from .models import MoodEntry, Meetup
from accounts.serializers import UserSerializer


class MoodEntrySerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = MoodEntry
        fields = ['id', 'user', 'date', 'mood', 'emoji', 'note', 'logged_at']
        read_only_fields = ['id', 'user', 'logged_at']


class MoodEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodEntry
        fields = ['date', 'mood', 'emoji', 'note']


class MeetupSerializer(serializers.ModelSerializer):
    created_by = UserSerializer(read_only=True)
    days_until = serializers.SerializerMethodField()

    class Meta:
        model = Meetup
        fields = ['id', 'title', 'date', 'created_by', 'created_at', 'days_until']
        read_only_fields = ['id', 'created_by', 'created_at']

    def get_days_until(self, obj):
        from django.utils import timezone
        delta = obj.date - timezone.now().date()
        return delta.days
