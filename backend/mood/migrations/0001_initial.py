import uuid
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='MoodEntry',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('date', models.DateField(default=django.utils.timezone.now)),
                ('mood', models.IntegerField(choices=[(1, 'Very Bad'), (2, 'Bad'), (3, 'Okay'), (4, 'Good'), (5, 'Great')])),
                ('emoji', models.CharField(max_length=10)),
                ('note', models.TextField(blank=True, max_length=200)),
                ('logged_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='moods', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['-date'], 'unique_together': {('user', 'date')}},
        ),
        migrations.CreateModel(
            name='Meetup',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=200)),
                ('date', models.DateField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('created_by', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='meetups', to=settings.AUTH_USER_MODEL)),
            ],
            options={'ordering': ['date']},
        ),
    ]
