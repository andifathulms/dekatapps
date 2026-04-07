from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('accounts.urls')),
    path('api/checkins/', include('checkins.urls')),
    path('api/questions/', include('questions.urls')),
    path('api/letters/', include('letters.urls')),
    path('api/mood/', include('mood.urls')),
    path('api/journal/', include('journal.urls')),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
