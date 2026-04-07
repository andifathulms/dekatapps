from django.urls import path
from .views import MoodListCreateView, TodayMoodView, MeetupView

urlpatterns = [
    path('', MoodListCreateView.as_view(), name='mood-list-create'),
    path('today/', TodayMoodView.as_view(), name='mood-today'),
    path('meetup/', MeetupView.as_view(), name='meetup'),
]
