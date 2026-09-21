from django.core.validators import MinValueValidator
from django.db import models

from customers.models import Customer
from products.models import Product


class Order(models.Model):
    class Status(models.TextChoices):
        NEW = "new", "New"
        PAID = "paid", "Paid"
        SHIPPED = "shipped", "Shipped"
        DONE = "done", "Done"
        CANCELLED = "cancelled", "Cancelled"

    # Allowed status changes; cancelling is possible until the order is shipped.
    TRANSITIONS = {
        Status.NEW: {Status.PAID, Status.CANCELLED},
        Status.PAID: {Status.SHIPPED, Status.CANCELLED},
        Status.SHIPPED: {Status.DONE},
        Status.DONE: set(),
        Status.CANCELLED: set(),
    }

    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.NEW)
    total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at", "-id"]

    def __str__(self):
        return f"Order #{self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="order_items")
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    # Copied from Product.price at order time so later price changes don't rewrite history.
    unit_price = models.DecimalField(max_digits=8, decimal_places=2)

    @property
    def line_total(self):
        return self.unit_price * self.quantity
