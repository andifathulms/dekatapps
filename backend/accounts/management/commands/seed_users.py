from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Seed initial two users for the couple'

    def handle(self, *args, **kwargs):
        if User.objects.count() >= 2:
            self.stdout.write('Users already seeded.')
            return

        User.objects.create_superuser(
            username='fathul',
            display_name='Fathul',
            timezone='Asia/Makassar',
            city='Nusantara',
            password='fathul123',
            email='fathul@dekat.app'
        )
        User.objects.create_user(
            username='hania',
            display_name='Hania',
            timezone='Asia/Jakarta',
            city='Solo',
            password='hania123',
            email='hania@dekat.app'
        )
        self.stdout.write(self.style.SUCCESS('Users created: fathul / hania'))
