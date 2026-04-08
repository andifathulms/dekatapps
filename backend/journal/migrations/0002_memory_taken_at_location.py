from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('journal', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='memory',
            name='taken_at',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='memory',
            name='location',
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
