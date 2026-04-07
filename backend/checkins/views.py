from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .models import CheckIn
from .serializers import CheckInSerializer, CheckInCreateSerializer
from .geocoding import reverse_geocode

User = get_user_model()


class ReverseGeocodeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        lat = request.data.get('latitude')
        lon = request.data.get('longitude')
        if not lat or not lon:
            return Response({'error': 'latitude and longitude required'}, status=400)
        place_name, place_type, display_address = reverse_geocode(lat, lon)
        return Response({
            'place_name': place_name,
            'place_type': place_type,
            'display_address': display_address
        })


class CheckInListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = CheckIn.objects.select_related('user').all()
        user_filter = self.request.query_params.get('user')
        date_filter = self.request.query_params.get('date')
        if user_filter == 'me':
            qs = qs.filter(user=self.request.user)
        elif user_filter == 'partner':
            partner = User.objects.exclude(id=self.request.user.id).first()
            if partner:
                qs = qs.filter(user=partner)
        if date_filter:
            qs = qs.filter(checked_in_at__date=date_filter)
        return qs

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return CheckInCreateSerializer
        return CheckInSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full = CheckInSerializer(serializer.instance)
        return Response(full.data, status=status.HTTP_201_CREATED)


class LatestCheckInsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        me = request.user
        partner = User.objects.exclude(id=me.id).first()

        my_last = CheckIn.objects.filter(user=me).first()
        partner_last = CheckIn.objects.filter(user=partner).first() if partner else None

        return Response({
            'me': CheckInSerializer(my_last).data if my_last else None,
            'partner': CheckInSerializer(partner_last).data if partner_last else None,
        })


class CheckInMapView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        checkins = CheckIn.objects.select_related('user').all()
        data = [
            {
                'id': str(c.id),
                'latitude': float(c.latitude),
                'longitude': float(c.longitude),
                'place_name': c.place_name,
                'place_type': c.place_type,
                'note': c.note,
                'mood_emoji': c.mood_emoji,
                'checked_in_at': c.checked_in_at.isoformat(),
                'user_display_name': c.user.display_name,
                'user_id': str(c.user.id),
            }
            for c in checkins
        ]
        return Response(data)
