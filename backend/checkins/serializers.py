from rest_framework import serializers
from .models import CheckIn
from accounts.serializers import UserSerializer


class CheckInSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = CheckIn
        fields = [
            'id', 'user', 'latitude', 'longitude',
            'place_name', 'place_type', 'note', 'mood_emoji',
            'photo', 'checked_in_at'
        ]
        read_only_fields = ['id', 'user', 'checked_in_at']


class CheckInCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckIn
        fields = ['latitude', 'longitude', 'place_name', 'place_type', 'note', 'mood_emoji', 'photo']
