from rest_framework import viewsets

from .filters import ProductFilter
from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    filterset_class = ProductFilter
    ordering_fields = ["name", "brand", "category", "price", "stock", "created_at"]
