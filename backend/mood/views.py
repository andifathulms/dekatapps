from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import MoodEntry, Meetup
from .serializers import MoodEntrySerializer, MoodEntryCreateSerializer, MeetupSerializer

User = get_user_model()


class MoodListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        entries = MoodEntry.objects.select_related('user').all()[:60]
        return Response(MoodEntrySerializer(entries, many=True).data)

    def post(self, request):
        serializer = MoodEntryCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        date = serializer.validated_data.get('date', timezone.now().date())
        entry, _ = MoodEntry.objects.update_or_create(
            user=request.user,
            date=date,
            defaults={
                'mood': serializer.validated_data['mood'],
                'emoji': serializer.validated_data['emoji'],
                'note': serializer.validated_data.get('note', ''),
            }
        )
        return Response(MoodEntrySerializer(entry).data, status=status.HTTP_200_OK)


class TodayMoodView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        me = request.user
        partner = User.objects.exclude(id=me.id).first()
        my_mood = MoodEntry.objects.filter(user=me, date=today).first()
        partner_mood = MoodEntry.objects.filter(user=partner, date=today).first() if partner else None
        return Response({
            'me': MoodEntrySerializer(my_mood).data if my_mood else None,
            'partner': MoodEntrySerializer(partner_mood).data if partner_mood else None,
        })


class MeetupView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today = timezone.now().date()
        meetup = Meetup.objects.filter(date__gte=today).first()
        if not meetup:
            return Response(None)
        return Response(MeetupSerializer(meetup).data)

    def post(self, request):
        # Replace any existing upcoming meetup
        today = timezone.now().date()
        Meetup.objects.filter(date__gte=today).delete()
        serializer = MeetupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        meetup = serializer.save(created_by=request.user)
        return Response(MeetupSerializer(meetup).data, status=status.HTTP_201_CREATED)

    def delete(self, request):
        today = timezone.now().date()
        Meetup.objects.filter(date__gte=today).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
