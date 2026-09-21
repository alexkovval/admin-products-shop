import os

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = (
        "Create (or update the password of) the admin user used to log in. "
        "Credentials come from --username/--password or DEMO_ADMIN_USERNAME/DEMO_ADMIN_PASSWORD."
    )

    def add_arguments(self, parser):
        parser.add_argument("--username", default=os.environ.get("DEMO_ADMIN_USERNAME", "admin"))
        parser.add_argument("--password", default=os.environ.get("DEMO_ADMIN_PASSWORD"))

    def handle(self, *args, **options):
        password = options["password"]
        if not password:
            if not settings.DEBUG:
                raise CommandError("Set DEMO_ADMIN_PASSWORD (or pass --password) when DEBUG is off.")
            password = "admin12345"  # local development convenience only

        User = get_user_model()
        user, created = User.objects.get_or_create(
            username=options["username"], defaults={"is_staff": True, "is_superuser": True}
        )
        user.set_password(password)
        user.save()
        verb = "Created" if created else "Updated password for"
        self.stdout.write(self.style.SUCCESS(f"{verb} user '{user.username}'."))
