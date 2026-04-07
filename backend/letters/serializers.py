from rest_framework import serializers
from .models import LoveLetter
from accounts.serializers import UserSerializer


class LoveLetterSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = LoveLetter
        fields = ['id', 'sender', 'body', 'photo', 'sent_at', 'read_at', 'is_mine']
        read_only_fields = ['id', 'sender', 'sent_at', 'read_at']

    def get_is_mine(self, obj):
        return obj.sender == self.context['request'].user


class LoveLetterCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoveLetter
        fields = ['body', 'photo']
