from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('questions', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='dailyquestion',
            name='is_custom',
            field=models.BooleanField(default=False),
        ),
    ]
