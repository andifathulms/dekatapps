from django.urls import path
from .views import (
    ReverseGeocodeView,
    CheckInListCreateView,
    LatestCheckInsView,
    CheckInMapView,
)

urlpatterns = [
    path('', CheckInListCreateView.as_view(), name='checkin-list-create'),
    path('reverse-geocode/', ReverseGeocodeView.as_view(), name='reverse-geocode'),
    path('latest/', LatestCheckInsView.as_view(), name='latest-checkins'),
    path('map/', CheckInMapView.as_view(), name='checkin-map'),
]
