from collections import defaultdict
from decimal import Decimal

from django.db import transaction
from rest_framework.exceptions import ValidationError

from products.models import Product

from .models import Order, OrderItem


def create_order(customer, items, comment=""):
    """Create an order and take its items off the shelf, all or nothing.

    `items` is a list of (product_id, quantity). Products are locked with
    select_for_update() so two concurrent orders can't both take the last unit.
    """
    quantities = defaultdict(int)
    for product_id, quantity in items:
        quantities[product_id] += quantity

    with transaction.atomic():
        # Lock in a fixed order (by pk) so concurrent orders can't deadlock each other.
        products = {
            p.pk: p
            for p in Product.objects.select_for_update().filter(pk__in=quantities).order_by("pk")
        }

        problems = []
        for product_id, quantity in quantities.items():
            product = products.get(product_id)
            if product is None or not product.is_active:
                name = product.name if product else f"#{product_id}"
                problems.append(f"{name} is not available.")
            elif product.stock < quantity:
                problems.append(
                    f"Not enough stock for {product.name}: requested {quantity}, available {product.stock}."
                )
        if problems:
            raise ValidationError({"items": problems})

        order = Order.objects.create(customer=customer, comment=comment)
        order_items = []
        total = Decimal("0")
        for product_id, quantity in quantities.items():
            product = products[product_id]
            order_items.append(
                OrderItem(order=order, product=product, quantity=quantity, unit_price=product.price)
            )
            total += product.price * quantity
            product.stock -= quantity
            product.save(update_fields=["stock", "updated_at"])
        OrderItem.objects.bulk_create(order_items)
        order.total = total
        order.save(update_fields=["total"])
    return order


def change_status(order, new_status):
    """Move an order to `new_status` if allowed. Cancelling returns items to stock."""
    with transaction.atomic():
        order = Order.objects.select_for_update().get(pk=order.pk)
        if new_status == order.status:
            return order
        if new_status not in Order.TRANSITIONS[order.status]:
            raise ValidationError(
                {"status": [f"Can't change status from {order.status} to {new_status}."]}
            )
        if new_status == Order.Status.CANCELLED:
            items = list(order.items.select_related("product").order_by("product_id"))
            locked = {
                p.pk: p
                for p in Product.objects.select_for_update()
                .filter(pk__in=[i.product_id for i in items])
                .order_by("pk")
            }
            for item in items:
                product = locked[item.product_id]
                product.stock += item.quantity
                product.save(update_fields=["stock", "updated_at"])
        order.status = new_status
        order.save(update_fields=["status", "updated_at"])
    return order
