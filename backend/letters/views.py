from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import LoveLetter
from .serializers import LoveLetterSerializer, LoveLetterCreateSerializer


class LoveLetterListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return LoveLetter.objects.select_related('sender').all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return LoveLetterCreateSerializer
        return LoveLetterSerializer

    def perform_create(self, serializer):
        serializer.save(sender=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full = LoveLetterSerializer(serializer.instance, context={'request': request})
        return Response(full.data, status=status.HTTP_201_CREATED)


class MarkLetterReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            letter = LoveLetter.objects.get(pk=pk)
        except LoveLetter.DoesNotExist:
            return Response(status=404)
        # Only the recipient (not sender) marks it read
        if letter.sender != request.user and not letter.read_at:
            letter.read_at = timezone.now()
            letter.save()
        return Response(LoveLetterSerializer(letter, context={'request': request}).data)
