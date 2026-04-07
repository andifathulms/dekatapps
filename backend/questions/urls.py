from django.urls import path
from .views import TodayQuestionView, QuestionHistoryView

urlpatterns = [
    path('today/', TodayQuestionView.as_view(), name='today-question'),
    path('history/', QuestionHistoryView.as_view(), name='question-history'),
]
