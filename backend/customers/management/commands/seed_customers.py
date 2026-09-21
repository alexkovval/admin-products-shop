import re

from django.core.management.base import BaseCommand
from faker import Faker

from customers.models import Customer

EXTENSION_RE = re.compile(r"\s*x\d+$", re.IGNORECASE)


class Command(BaseCommand):
    help = "Seed the database with fake customers for testing."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=20,
            help="Number of fake customers to create (default: 20).",
        )

    def handle(self, *args, **options):
        count = options["count"]
        fake = Faker()

        created = 0
        attempts = 0
        while created < count and attempts < count * 3:
            attempts += 1
            email = fake.unique.email()
            phone_number = EXTENSION_RE.sub("", fake.phone_number())
            customer, was_created = Customer.objects.get_or_create(
                email=email,
                defaults={
                    "first_name": fake.first_name(),
                    "last_name": fake.last_name(),
                    "phone_number": phone_number,
                },
            )
            if was_created:
                created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} customers."))
