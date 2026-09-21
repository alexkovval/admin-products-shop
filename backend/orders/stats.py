from datetime import timedelta
from decimal import Decimal

from django.db.models import Count, DecimalField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from customers.models import Customer
from products.models import Product

from .models import Order, OrderItem

LOW_STOCK_THRESHOLD = 5
ALLOWED_DAYS = {7, 30, 90}


def _period(request):
    """Return (days, start) for the ?days= query param (7, 30 or 90; default 30)."""
    try:
        days = int(request.query_params.get("days", 30))
    except ValueError:
        days = 30
    if days not in ALLOWED_DAYS:
        days = 30
    today = timezone.localdate()
    return days, today - timedelta(days=days - 1)


def _counted_orders(start):
    """Orders in the period that count towards revenue (cancelled ones don't)."""
    return Order.objects.filter(created_at__date__gte=start).exclude(status=Order.Status.CANCELLED)


class SummaryView(APIView):
    def get(self, request):
        days, start = _period(request)
        orders = _counted_orders(start)
        totals = orders.aggregate(revenue=Sum("total"), count=Count("id"))
        revenue = totals["revenue"] or Decimal("0")
        count = totals["count"]
        return Response(
            {
                "days": days,
                "revenue": revenue,
                "orders": count,
                "average_order": (revenue / count).quantize(Decimal("0.01")) if count else Decimal("0"),
                "new_customers": Customer.objects.filter(created_at__date__gte=start).count(),
            }
        )


class RevenueByDayView(APIView):
    def get(self, request):
        days, start = _period(request)
        rows = (
            _counted_orders(start)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(revenue=Sum("total"), orders=Count("id"))
        )
        by_day = {row["day"]: row for row in rows}
        result = []
        for offset in range(days):
            day = start + timedelta(days=offset)
            row = by_day.get(day)
            result.append(
                {
                    "date": day.isoformat(),
                    "revenue": row["revenue"] if row else Decimal("0"),
                    "orders": row["orders"] if row else 0,
                }
            )
        return Response(result)


class TopProductsView(APIView):
    def get(self, request):
        _, start = _period(request)
        line_total = ExpressionWrapper(
            F("quantity") * F("unit_price"), output_field=DecimalField(max_digits=12, decimal_places=2)
        )
        rows = (
            OrderItem.objects.filter(order__created_at__date__gte=start)
            .exclude(order__status=Order.Status.CANCELLED)
            .values("product_id", "product__name", "product__brand", "product__category", "product__image_url")
            .annotate(units=Sum("quantity"), revenue=Sum(line_total))
            .order_by("-units", "-revenue")[:5]
        )
        return Response(
            [
                {
                    "id": r["product_id"],
                    "name": r["product__name"],
                    "brand": r["product__brand"],
                    "category": r["product__category"],
                    "image_url": r["product__image_url"],
                    "units": r["units"],
                    "revenue": r["revenue"],
                }
                for r in rows
            ]
        )


class LowStockView(APIView):
    def get(self, request):
        products = Product.objects.filter(is_active=True, stock__lte=LOW_STOCK_THRESHOLD).order_by("stock", "name")
        return Response(
            [
                {
                    "id": p.id,
                    "name": p.name,
                    "brand": p.brand,
                    "category": p.category,
                    "image_url": p.image_url,
                    "stock": p.stock,
                }
                for p in products[:20]
            ]
        )
