from rest_framework import mixins, status, viewsets
from rest_framework.response import Response

from .filters import OrderFilter
from .models import Order
from .serializers import OrderCreateSerializer, OrderSerializer, OrderUpdateSerializer


class OrderViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Orders can be created and moved between statuses, but not deleted."""

    queryset = Order.objects.select_related("customer").prefetch_related("items__product")
    filterset_class = OrderFilter
    ordering_fields = ["created_at", "total", "status", "id"]

    def get_serializer_class(self):
        if self.action == "create":
            return OrderCreateSerializer
        if self.action in ("update", "partial_update"):
            return OrderUpdateSerializer
        return OrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(self._detail(order), status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        serializer = self.get_serializer(self.get_object(), data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        return Response(self._detail(order))

    def _detail(self, order):
        order = self.get_queryset().get(pk=order.pk)
        return OrderSerializer(order, context=self.get_serializer_context()).data
