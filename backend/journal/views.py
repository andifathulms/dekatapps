from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import JournalEntry, Memory
from .serializers import (
    JournalEntrySerializer, JournalEntryCreateSerializer,
    MemorySerializer, MemoryCreateSerializer
)


class JournalListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return JournalEntry.objects.select_related('author').all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return JournalEntryCreateSerializer
        return JournalEntrySerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full = JournalEntrySerializer(serializer.instance, context={'request': request})
        return Response(full.data, status=status.HTTP_201_CREATED)


class JournalDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = JournalEntry.objects.all()
    serializer_class = JournalEntrySerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def destroy(self, request, *args, **kwargs):
        entry = self.get_object()
        if entry.author != request.user:
            return Response({'error': 'You can only delete your own entries.'}, status=403)
        entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class MemoryListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        return Memory.objects.select_related('uploaded_by').all()

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MemoryCreateSerializer
        return MemorySerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        full = MemorySerializer(serializer.instance, context={'request': request})
        return Response(full.data, status=status.HTTP_201_CREATED)


class MemoryDetailView(generics.RetrieveDestroyAPIView):
    permission_classes = [IsAuthenticated]
    queryset = Memory.objects.all()
    serializer_class = MemorySerializer

    def get_serializer_context(self):
        return {'request': self.request}

    def destroy(self, request, *args, **kwargs):
        memory = self.get_object()
        if memory.uploaded_by != request.user:
            return Response({'error': 'You can only delete your own memories.'}, status=403)
        memory.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
