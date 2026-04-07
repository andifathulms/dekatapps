from rest_framework import serializers
from .models import JournalEntry, Memory
from accounts.serializers import UserSerializer


class JournalEntrySerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = JournalEntry
        fields = ['id', 'author', 'title', 'body', 'photo', 'created_at', 'updated_at', 'is_mine']
        read_only_fields = ['id', 'author', 'created_at', 'updated_at']

    def get_is_mine(self, obj):
        return obj.author == self.context['request'].user


class JournalEntryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = JournalEntry
        fields = ['title', 'body', 'photo']


class MemorySerializer(serializers.ModelSerializer):
    uploaded_by = UserSerializer(read_only=True)
    is_mine = serializers.SerializerMethodField()

    class Meta:
        model = Memory
        fields = ['id', 'uploaded_by', 'photo', 'caption', 'created_at', 'is_mine']
        read_only_fields = ['id', 'uploaded_by', 'created_at']

    def get_is_mine(self, obj):
        return obj.uploaded_by == self.context['request'].user


class MemoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Memory
        fields = ['photo', 'caption']
