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
        question = DailyQuestion.get_or_create_today()
        text = request.data.get('text', '').strip()
        if not text:
            return Response({'error': 'Answer text is required.'}, status=400)
        answer, created = Answer.objects.update_or_create(
            question=question,
            user=request.user,
            defaults={'text': text}
        )
        serializer = DailyQuestionSerializer(question, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class QuestionHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        questions = DailyQuestion.objects.prefetch_related('answers__user').all()[:30]
        serializer = DailyQuestionSerializer(questions, many=True, context={'request': request})
        return Response(serializer.data)
