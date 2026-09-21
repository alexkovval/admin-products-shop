import django_filters
from django.db.models import Q

from .models import Order


class OrderFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")
    date_from = django_filters.DateFilter(field_name="created_at", lookup_expr="date__gte")
    date_to = django_filters.DateFilter(field_name="created_at", lookup_expr="date__lte")

    class Meta:
        model = Order
        fields = ["search", "status", "customer", "date_from", "date_to"]

    def filter_search(self, queryset, name, value):
        query = (
            Q(customer__first_name__icontains=value)
            | Q(customer__last_name__icontains=value)
            | Q(customer__email__icontains=value)
        )
        if value.lstrip("#").isdigit():
            query |= Q(pk=int(value.lstrip("#")))
        return queryset.filter(query)
