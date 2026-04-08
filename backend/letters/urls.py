from django.urls import path
from .views import LoveLetterListCreateView, MarkLetterReadView, UnreadCountView

urlpatterns = [
    path('', LoveLetterListCreateView.as_view(), name='letter-list-create'),
    path('unread/', UnreadCountView.as_view(), name='letter-unread-count'),
    path('<uuid:pk>/read/', MarkLetterReadView.as_view(), name='letter-read'),
]
