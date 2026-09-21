import os
import random

from django.core.management import call_command
from django.core.management.base import BaseCommand

from customers.models import Customer
from orders.models import Order
from products.models import Product


class Command(BaseCommand):
    help = (
        "Fill an empty database with demo customers, products and orders. Does nothing if data exists, "
        "unless --reset (or DEMO_RESET=true) is given, which wipes them first."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Delete all customers, products and orders first, then seed again (login users are kept).",
        )

    def handle(self, *args, **options):
        reset = options["reset"] or os.environ.get("DEMO_RESET", "").lower() == "true"

        if not reset and (Product.objects.exists() or Customer.objects.exists()):
            self.stdout.write("Database already has data, skipping demo seed.")
            return

        if reset:
            # Orders first: customers and products are PROTECTed while orders reference them.
            Order.objects.all().delete()
            Product.objects.all().delete()
            Customer.objects.all().delete()
            self.stdout.write("Wiped existing customers, products and orders.")

        call_command("seed_products")
        call_command("seed_customers", count=20)
        call_command("seed_orders", count=30)
        self.make_some_products_scarce()

    def make_some_products_scarce(self):
        """Leave a few products low or sold out so the dashboard's stock panel has something to show."""
        products = list(Product.objects.all())
        for product in random.sample(products, k=min(4, len(products))):
            product.stock = random.randint(1, 4)
            product.save(update_fields=["stock", "updated_at"])
        sold_out = random.choice(products)
        sold_out.stock = 0
        sold_out.save(update_fields=["stock", "updated_at"])
