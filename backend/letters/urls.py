from django.urls import path
from .views import LoveLetterListCreateView, MarkLetterReadView

urlpatterns = [
    path('', LoveLetterListCreateView.as_view(), name='letter-list-create'),
    path('<uuid:pk>/read/', MarkLetterReadView.as_view(), name='letter-read'),
]
