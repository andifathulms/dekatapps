from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .models import DailyQuestion, Answer
from .serializers import DailyQuestionSerializer, AnswerSerializer


class TodayQuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        question = DailyQuestion.get_or_create_today()
        serializer = DailyQuestionSerializer(question, context={'request': request})
        return Response(serializer.data)

    def post(self, request):
        """Submit an answer to today's question."""
        question = DailyQuestion.get_or_create_today()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Answer text is required.'}, status=400)
        Answer.objects.update_or_create(
            question=question,
            user=request.user,
            defaults={'text': text}
        )
        serializer = DailyQuestionSerializer(question, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

    def patch(self, request):
        """Override today's question text (only if nobody has answered yet)."""
        question = DailyQuestion.get_or_create_today()
        if question.answers.exists():
            return Response({'error': 'Cannot change question after answers have been submitted.'}, status=400)
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Question text is required.'}, status=400)
        question.text = text
        question.is_custom = True
        question.save()
        serializer = DailyQuestionSerializer(question, context={'request': request})
        return Response(serializer.data)


class QuestionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        questions = DailyQuestion.objects.prefetch_related('answers__user').all()[:30]
        serializer = DailyQuestionSerializer(questions, many=True, context={'request': request})
        return Response(serializer.data)
