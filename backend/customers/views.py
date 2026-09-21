from rest_framework import viewsets

from .filters import CustomerFilter
from .models import Customer
from .serializers import CustomerSerializer


class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    filterset_class = CustomerFilter
    ordering_fields = ["first_name", "last_name", "phone_number", "email", "created_at"]
    search_fields = ["first_name", "last_name", "phone_number", "email"]
