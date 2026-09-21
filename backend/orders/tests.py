from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from customers.models import Customer
from products.models import Product

from .models import Order


class OrderApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(get_user_model().objects.create_user("tester", password="pw"))
        self.customer = Customer.objects.create(
            first_name="Anna", last_name="Petrova", phone_number="+7 999 123-45-67", email="a@example.com"
        )
        self.serum = Product.objects.create(
            name="Serum", brand="Brand", category="skincare", price=Decimal("20.00"), stock=5
        )
        self.lipstick = Product.objects.create(
            name="Lipstick", brand="Brand", category="makeup", price=Decimal("10.50"), stock=1
        )

    def post_order(self, items, customer=None):
        return self.client.post(
            "/api/orders/",
            {"customer": (customer or self.customer).pk, "items": items},
            format="json",
        )

    def test_create_order_computes_total_and_reduces_stock(self):
        response = self.post_order(
            [{"product": self.serum.pk, "quantity": 2}, {"product": self.lipstick.pk, "quantity": 1}]
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Decimal(response.data["total"]), Decimal("50.50"))
        self.assertEqual(response.data["status"], "new")
        self.assertEqual(len(response.data["items"]), 2)
        self.serum.refresh_from_db()
        self.lipstick.refresh_from_db()
        self.assertEqual(self.serum.stock, 3)
        self.assertEqual(self.lipstick.stock, 0)

    def test_not_enough_stock_is_rejected_and_nothing_changes(self):
        response = self.post_order(
            [{"product": self.serum.pk, "quantity": 2}, {"product": self.lipstick.pk, "quantity": 2}]
        )
        self.assertEqual(response.status_code, 400)
        self.assertIn("Lipstick", response.data["items"][0])
        self.assertEqual(Order.objects.count(), 0)
        self.serum.refresh_from_db()
        self.assertEqual(self.serum.stock, 5)  # rolled back, not half-applied

    def test_duplicate_lines_are_merged_before_stock_check(self):
        response = self.post_order(
            [{"product": self.lipstick.pk, "quantity": 1}, {"product": self.lipstick.pk, "quantity": 1}]
        )
        self.assertEqual(response.status_code, 400)

    def test_inactive_product_cannot_be_ordered(self):
        self.serum.is_active = False
        self.serum.save()
        self.assertEqual(self.post_order([{"product": self.serum.pk, "quantity": 1}]).status_code, 400)

    def test_empty_order_is_rejected(self):
        self.assertEqual(self.post_order([]).status_code, 400)

    def test_price_change_does_not_affect_existing_order(self):
        order_id = self.post_order([{"product": self.serum.pk, "quantity": 1}]).data["id"]
        self.serum.price = Decimal("99.00")
        self.serum.save()
        data = self.client.get(f"/api/orders/{order_id}/").data
        self.assertEqual(Decimal(data["total"]), Decimal("20.00"))
        self.assertEqual(Decimal(data["items"][0]["unit_price"]), Decimal("20.00"))

    def test_cancel_returns_items_to_stock(self):
        order_id = self.post_order([{"product": self.serum.pk, "quantity": 3}]).data["id"]
        response = self.client.patch(f"/api/orders/{order_id}/", {"status": "cancelled"}, format="json")
        self.assertEqual(response.status_code, 200)
        self.serum.refresh_from_db()
        self.assertEqual(self.serum.stock, 5)

    def test_invalid_status_transition_is_rejected(self):
        order_id = self.post_order([{"product": self.serum.pk, "quantity": 1}]).data["id"]
        response = self.client.patch(f"/api/orders/{order_id}/", {"status": "done"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_cancelled_order_cannot_be_revived(self):
        order_id = self.post_order([{"product": self.serum.pk, "quantity": 1}]).data["id"]
        self.client.patch(f"/api/orders/{order_id}/", {"status": "cancelled"}, format="json")
        response = self.client.patch(f"/api/orders/{order_id}/", {"status": "paid"}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_filter_by_status_and_search(self):
        self.post_order([{"product": self.serum.pk, "quantity": 1}])
        paid_id = self.post_order([{"product": self.serum.pk, "quantity": 1}]).data["id"]
        self.client.patch(f"/api/orders/{paid_id}/", {"status": "paid"}, format="json")
        self.assertEqual(self.client.get("/api/orders/?status=paid").data["count"], 1)
        self.assertEqual(self.client.get("/api/orders/?search=petrova").data["count"], 2)
        self.assertEqual(self.client.get("/api/orders/?search=nobody").data["count"], 0)

    def test_orders_cannot_be_deleted(self):
        order_id = self.post_order([{"product": self.serum.pk, "quantity": 1}]).data["id"]
        self.assertEqual(self.client.delete(f"/api/orders/{order_id}/").status_code, 405)

    def test_customer_and_product_with_orders_cannot_be_deleted(self):
        self.post_order([{"product": self.serum.pk, "quantity": 1}])
        self.assertEqual(self.client.delete(f"/api/products/{self.serum.pk}/").status_code, 409)
        self.assertEqual(self.client.delete(f"/api/customers/{self.customer.pk}/").status_code, 409)

    def test_list_does_not_run_query_per_order(self):
        for _ in range(3):
            self.post_order([{"product": self.serum.pk, "quantity": 1}])
        with self.assertNumQueries(4):  # count, orders, customers (join), items+products
            self.client.get("/api/orders/")


class StatsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.force_authenticate(get_user_model().objects.create_user("tester", password="pw"))
        self.customer = Customer.objects.create(
            first_name="Anna", last_name="Petrova", phone_number="+7 999 123-45-67", email="a@example.com"
        )
        self.serum = Product.objects.create(
            name="Serum", brand="Brand", category="skincare", price=Decimal("20.00"), stock=50
        )
        self.scarce = Product.objects.create(
            name="Scarce", brand="Brand", category="makeup", price=Decimal("10.00"), stock=3
        )
        Product.objects.create(
            name="Hidden", brand="Brand", category="makeup", price=Decimal("10.00"), stock=1, is_active=False
        )

    def order(self, product, quantity):
        return self.client.post(
            "/api/orders/",
            {"customer": self.customer.pk, "items": [{"product": product.pk, "quantity": quantity}]},
            format="json",
        ).data["id"]

    def test_summary_ignores_cancelled_orders(self):
        self.order(self.serum, 2)  # 40.00
        cancelled = self.order(self.serum, 5)
        self.client.patch(f"/api/orders/{cancelled}/", {"status": "cancelled"}, format="json")
        data = self.client.get("/api/stats/summary/").data
        self.assertEqual(Decimal(data["revenue"]), Decimal("40.00"))
        self.assertEqual(data["orders"], 1)
        self.assertEqual(Decimal(data["average_order"]), Decimal("40.00"))
        self.assertEqual(data["new_customers"], 1)

    def test_summary_with_no_orders(self):
        data = self.client.get("/api/stats/summary/").data
        self.assertEqual((Decimal(data["revenue"]), data["orders"], Decimal(data["average_order"])), (0, 0, 0))

    def test_revenue_by_day_is_zero_filled_for_the_whole_period(self):
        self.order(self.serum, 1)
        for days in (7, 30, 90):
            self.assertEqual(len(self.client.get(f"/api/stats/revenue-by-day/?days={days}").data), days)
        today = self.client.get("/api/stats/revenue-by-day/?days=7").data[-1]
        self.assertEqual((Decimal(today["revenue"]), today["orders"]), (Decimal("20.00"), 1))

    def test_unknown_period_falls_back_to_30_days(self):
        self.assertEqual(len(self.client.get("/api/stats/revenue-by-day/?days=5").data), 30)
        self.assertEqual(len(self.client.get("/api/stats/revenue-by-day/?days=abc").data), 30)

    def test_top_products_sorted_by_units(self):
        self.order(self.serum, 1)
        self.order(self.scarce, 3)
        top = self.client.get("/api/stats/top-products/").data
        self.assertEqual([p["name"] for p in top], ["Scarce", "Serum"])
        self.assertEqual(top[0]["units"], 3)

    def test_low_stock_lists_only_active_scarce_products(self):
        names = [p["name"] for p in self.client.get("/api/stats/low-stock/").data]
        self.assertEqual(names, ["Scarce"])


class AuthApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        get_user_model().objects.create_user("admin", password="s3cret-pass")

    def login(self, password="s3cret-pass"):
        return self.client.post("/api/auth/login/", {"username": "admin", "password": password}, format="json")

    def test_api_requires_authentication(self):
        for url in ("/api/customers/", "/api/products/", "/api/orders/", "/api/stats/summary/", "/api/auth/me/"):
            self.assertEqual(self.client.get(url).status_code, 401, url)

    def test_login_returns_tokens_that_open_the_api(self):
        response = self.login()
        self.assertEqual(response.status_code, 200)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get("/api/customers/").status_code, 200)
        self.assertEqual(self.client.get("/api/auth/me/").data["username"], "admin")

    def test_wrong_password_is_rejected(self):
        self.assertEqual(self.login("nope").status_code, 401)

    def test_refresh_token_gives_new_access_token(self):
        refresh = self.login().data["refresh"]
        response = self.client.post("/api/auth/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)

    def test_access_token_is_not_accepted_as_refresh_token(self):
        access = self.login().data["access"]
        self.assertEqual(self.client.post("/api/auth/refresh/", {"refresh": access}, format="json").status_code, 401)

    def test_health_check_is_public(self):
        response = self.client.get("/api/health/")
        self.assertEqual((response.status_code, response.data), (200, {"status": "ok"}))

    def test_garbage_token_is_rejected(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer not-a-token")
        self.assertEqual(self.client.get("/api/customers/").status_code, 401)


class SeedDemoTests(TestCase):
    def test_seeds_empty_database_once(self):
        from django.core.management import call_command

        call_command("seed_demo", verbosity=0)
        products, customers, orders = Product.objects.count(), Customer.objects.count(), Order.objects.count()
        self.assertGreater(products, 0)
        self.assertEqual(customers, 20)
        self.assertGreater(orders, 0)

        call_command("seed_demo", verbosity=0)  # second run must not duplicate anything
        self.assertEqual(
            (Product.objects.count(), Customer.objects.count(), Order.objects.count()),
            (products, customers, orders),
        )

    def test_reset_wipes_and_reseeds_but_keeps_users(self):
        from django.core.management import call_command

        get_user_model().objects.create_user("keepme", password="pw")
        call_command("seed_demo", verbosity=0)
        first_ids = set(Product.objects.values_list("id", flat=True))

        call_command("seed_demo", "--reset", verbosity=0)

        self.assertEqual(Customer.objects.count(), 20)
        self.assertTrue(get_user_model().objects.filter(username="keepme").exists())
        self.assertFalse(first_ids & set(Product.objects.values_list("id", flat=True)))  # fresh rows
        self.assertGreater(Product.objects.filter(stock__gt=10).count(), 15)  # mostly well stocked
        self.assertTrue(Product.objects.filter(stock__lte=5).exists())  # but some are running low

    def test_demo_admin_requires_password_when_debug_is_off(self):
        from django.core.management import call_command
        from django.core.management.base import CommandError
        from django.test import override_settings

        with override_settings(DEBUG=False), self.assertRaises(CommandError):
            call_command("create_demo_admin", verbosity=0)
        with override_settings(DEBUG=False):
            call_command("create_demo_admin", password="a-long-random-one", verbosity=0)
        self.assertTrue(get_user_model().objects.filter(username="admin").exists())
