from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()


class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(UserSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
        if 'display_name' in request.data:
            user.display_name = request.data['display_name']
        if 'timezone' in request.data:
            user.timezone = request.data['timezone']
        if 'city' in request.data:
            user.city = request.data['city']
        if 'latitude' in request.data:
            user.latitude = request.data['latitude'] or None
        if 'longitude' in request.data:
            user.longitude = request.data['longitude'] or None
        user.save()
        return Response(UserSerializer(user).data)


class PartnerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        partner = User.objects.exclude(id=request.user.id).first()
        if not partner:
            return Response(None)
        return Response(UserSerializer(partner).data)
