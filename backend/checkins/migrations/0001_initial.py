import django.db.models.deletion
import uuid
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='CheckIn',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('latitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('longitude', models.DecimalField(decimal_places=6, max_digits=9)),
                ('place_name', models.CharField(max_length=255)),
                ('place_type', models.CharField(default='place', max_length=100)),
                ('note', models.TextField(blank=True, max_length=200)),
                ('mood_emoji', models.CharField(blank=True, max_length=10)),
                ('photo', models.ImageField(blank=True, null=True, upload_to='checkins/')),
                ('checked_in_at', models.DateTimeField(auto_now_add=True)),
                ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='checkins', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-checked_in_at'],
            },
        ),
    ]
