import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from customers.models import Customer
from orders.models import Order
from orders.services import change_status, create_order
from products.models import Product


class Command(BaseCommand):
    help = "Create fake orders spread over the last 30 days (needs customers and products)."

    def add_arguments(self, parser):
        parser.add_argument("--count", type=int, default=30)

    def handle(self, *args, **options):
        customers = list(Customer.objects.all())
        products = list(Product.objects.filter(is_active=True))
        if not customers or not products:
            self.stderr.write("Seed customers and products first.")
            return

        created = 0
        for _ in range(options["count"]):
            in_stock = [p for p in products if Product.objects.get(pk=p.pk).stock > 0]
            if not in_stock:
                break
            picked = random.sample(in_stock, k=min(len(in_stock), random.randint(1, 4)))
            items = [(p.pk, random.randint(1, 2)) for p in picked]
            try:
                order = create_order(random.choice(customers), items)
            except Exception:
                continue
            for status in random.choice(
                [[], ["paid"], ["paid", "shipped"], ["paid", "shipped", "done"], ["cancelled"]]
            ):
                change_status(order, status)
            # Spread orders over the last month so the dashboard has something to plot.
            Order.objects.filter(pk=order.pk).update(
                created_at=timezone.now() - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23))
            )
            created += 1
        self.stdout.write(self.style.SUCCESS(f"Created {created} orders."))
