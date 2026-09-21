from rest_framework.routers import DefaultRouter

from django.urls import path

from .stats import LowStockView, RevenueByDayView, SummaryView, TopProductsView
from .views import OrderViewSet

router = DefaultRouter()
router.register("orders", OrderViewSet)
urlpatterns = [
    path("stats/summary/", SummaryView.as_view()),
    path("stats/revenue-by-day/", RevenueByDayView.as_view()),
    path("stats/top-products/", TopProductsView.as_view()),
    path("stats/low-stock/", LowStockView.as_view()),
] + router.urls
