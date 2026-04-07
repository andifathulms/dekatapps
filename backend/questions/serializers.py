from rest_framework import serializers
from .models import DailyQuestion, Answer
from accounts.serializers import UserSerializer


class AnswerSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)

    class Meta:
        model = Answer
        fields = ['id', 'user', 'text', 'submitted_at']


class DailyQuestionSerializer(serializers.ModelSerializer):
    my_answer = serializers.SerializerMethodField()
    partner_answer = serializers.SerializerMethodField()
    both_answered = serializers.SerializerMethodField()

    class Meta:
        model = DailyQuestion
        fields = ['id', 'date', 'text', 'my_answer', 'partner_answer', 'both_answered']

    def get_my_answer(self, obj):
        user = self.context['request'].user
        try:
            return AnswerSerializer(obj.answers.get(user=user)).data
        except Answer.DoesNotExist:
            return None

    def get_partner_answer(self, obj):
        from django.contrib.auth import get_user_model
        User = get_user_model()
        user = self.context['request'].user
        partner = User.objects.exclude(id=user.id).first()
        if not partner:
            return None
        # Only reveal partner's answer if current user has answered
        my_answer = obj.answers.filter(user=user).first()
        if not my_answer:
            return None
        try:
            return AnswerSerializer(obj.answers.get(user=partner)).data
        except Answer.DoesNotExist:
            return None

    def get_both_answered(self, obj):
        return obj.answers.count() >= 2
