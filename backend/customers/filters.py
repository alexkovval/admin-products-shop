import django_filters

from .models import Customer


class CustomerFilter(django_filters.FilterSet):
    search = django_filters.CharFilter(method="filter_search")

    class Meta:
        model = Customer
        fields = ["search"]

    def filter_search(self, queryset, name, value):
        from django.db.models import Q
        return queryset.filter(
            Q(first_name__icontains=value)
            | Q(last_name__icontains=value)
            | Q(phone_number__icontains=value)
            | Q(email__icontains=value)
        )
