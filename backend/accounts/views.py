from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth import get_user_model
from .serializers import UserSerializer

User = get_user_model()


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class PartnerView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        partner = User.objects.exclude(id=request.user.id).first()
        if not partner:
            return Response(None)
        return Response(UserSerializer(partner).data)
