"""Concurrency tests for order creation.

These need real parallel database connections, so they use TransactionTestCase
(a plain TestCase wraps everything in one transaction, which hides races).
"""
import threading
import time
from decimal import Decimal
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.db import connections
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from customers.models import Customer
from products.models import Product

from .models import Order


class OrderConcurrencyTests(TransactionTestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user("tester", password="pw")
        self.customer = Customer.objects.create(
            first_name="Anna", last_name="Petrova", phone_number="+7 999 123-45-67", email="a@example.com"
        )

    def make_product(self, name, stock):
        return Product.objects.create(
            name=name, brand="Brand", category="skincare", price=Decimal("10.00"), stock=stock
        )

    def place_order(self, *lines):
        """POST an order as a fresh client; returns the HTTP status code. `lines` = (product, quantity)."""
        client = APIClient()
        client.force_authenticate(self.user)
        response = client.post(
            "/api/orders/",
            {
                "customer": self.customer.pk,
                "items": [{"product": p.pk, "quantity": q} for p, q in lines],
            },
            format="json",
        )
        return response.status_code

    def run_in_parallel(self, *jobs):
        """Run jobs on separate threads (each with its own DB connection), released at the same moment."""
        barrier = threading.Barrier(len(jobs))
        results = [None] * len(jobs)

        def worker(index, job):
            try:
                barrier.wait(timeout=10)
                results[index] = job()
            except Exception as exc:  # surface it in the assertion below instead of a silent thread death
                results[index] = exc
            finally:
                connections.close_all()

        threads = [threading.Thread(target=worker, args=(i, job)) for i, job in enumerate(jobs)]
        for thread in threads:
            thread.start()
        for thread in threads:
            thread.join(timeout=30)
        self.assertFalse(any(t.is_alive() for t in threads), "a thread hung: probable deadlock")
        return results

    @staticmethod
    def widen_race_window():
        """Pause right after the stock check, so an unlocked implementation would reliably oversell.

        With row locking the second request is stuck waiting for the first to commit, so the pause
        is harmless; without it both requests would pass the check before either deducts stock.
        """
        original = Order.objects.create

        def slow_create(*args, **kwargs):
            time.sleep(0.3)
            return original(*args, **kwargs)

        return patch.object(Order.objects, "create", slow_create)

    @staticmethod
    def widen_lock_window():
        """Pause before every locking query, so locks taken one after another would interleave.

        The order-creation code takes all its locks in a single query sorted by primary key, so
        the pause is harmless. An implementation that locked products one by one in request
        order would let request A hold product 1 while B holds product 2, and deadlock.
        """
        original = Product.objects.select_for_update

        def slow_select_for_update(*args, **kwargs):
            time.sleep(0.2)
            return original(*args, **kwargs)

        return patch.object(Product.objects, "select_for_update", slow_select_for_update)

    def test_two_orders_for_the_last_item_only_one_succeeds(self):
        last = self.make_product("Last one", stock=1)

        with self.widen_race_window():
            results = self.run_in_parallel(
                lambda: self.place_order((last, 1)),
                lambda: self.place_order((last, 1)),
            )

        self.assertEqual(sorted(results), [201, 400], results)
        self.assertEqual(Order.objects.count(), 1)
        last.refresh_from_db()
        self.assertEqual(last.stock, 0)  # never negative, never oversold

    def test_many_buyers_never_take_more_than_the_stock(self):
        scarce = self.make_product("Scarce", stock=3)

        with self.widen_race_window():
            results = self.run_in_parallel(*[lambda: self.place_order((scarce, 1)) for _ in range(8)])

        self.assertEqual(results.count(201), 3, results)
        self.assertEqual(results.count(400), 5, results)
        scarce.refresh_from_db()
        self.assertEqual(scarce.stock, 0)
        self.assertEqual(Order.objects.count(), 3)

    def test_locking_does_not_block_orders_that_fit_in_stock(self):
        enough = self.make_product("Plenty", stock=2)

        results = self.run_in_parallel(
            lambda: self.place_order((enough, 1)),
            lambda: self.place_order((enough, 1)),
        )

        self.assertEqual(results, [201, 201])
        enough.refresh_from_db()
        self.assertEqual(enough.stock, 0)

    def test_orders_with_products_in_opposite_order_do_not_deadlock(self):
        a = self.make_product("A", stock=5)
        b = self.make_product("B", stock=5)

        with self.widen_lock_window():
            results = self.run_in_parallel(
                lambda: self.place_order((a, 1), (b, 1)),
                lambda: self.place_order((b, 1), (a, 1)),
            )

        self.assertEqual(results, [201, 201])
        a.refresh_from_db()
        b.refresh_from_db()
        self.assertEqual((a.stock, b.stock), (3, 3))
