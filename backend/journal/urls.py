from django.urls import path
from .views import (
    JournalListCreateView, JournalDetailView,
    MemoryListCreateView, MemoryDetailView,
)

urlpatterns = [
    path('', JournalListCreateView.as_view(), name='journal-list-create'),
    path('<uuid:pk>/', JournalDetailView.as_view(), name='journal-detail'),
    path('memories/', MemoryListCreateView.as_view(), name='memory-list-create'),
    path('memories/<uuid:pk>/', MemoryDetailView.as_view(), name='memory-detail'),
]
