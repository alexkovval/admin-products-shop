from django.core.management import call_command
from django.core.management.base import BaseCommand

from customers.models import Customer
from products.models import Product


class Command(BaseCommand):
    help = "Fill an empty database with demo customers, products and orders. Does nothing if data exists."

    def handle(self, *args, **options):
        if Product.objects.exists() or Customer.objects.exists():
            self.stdout.write("Database already has data, skipping demo seed.")
            return
        call_command("seed_products")
        call_command("seed_customers", count=20)
        call_command("seed_orders", count=30)
