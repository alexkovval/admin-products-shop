from rest_framework import serializers

from customers.models import Customer
from products.models import Product

from .models import Order, OrderItem
from .services import change_status, create_order


class OrderItemProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "brand", "category", "image_url"]


class OrderItemSerializer(serializers.ModelSerializer):
    product = OrderItemProductSerializer(read_only=True)
    line_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = ["id", "product", "quantity", "unit_price", "line_total"]


class OrderSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    items = OrderItemSerializer(many=True, read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id", "customer", "customer_name", "status", "total", "comment",
            "items", "items_count", "created_at", "updated_at",
        ]
        read_only_fields = fields

    def get_customer_name(self, obj):
        return f"{obj.customer.first_name} {obj.customer.last_name}"

    def get_items_count(self, obj):
        return sum(item.quantity for item in obj.items.all())


class OrderItemInputSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.all())
    quantity = serializers.IntegerField(min_value=1, max_value=999)


class OrderCreateSerializer(serializers.Serializer):
    customer = serializers.PrimaryKeyRelatedField(queryset=Customer.objects.all())
    comment = serializers.CharField(allow_blank=True, required=False, default="")
    items = OrderItemInputSerializer(many=True, allow_empty=False)

    def create(self, validated_data):
        items = [(i["product"].pk, i["quantity"]) for i in validated_data["items"]]
        return create_order(validated_data["customer"], items, validated_data["comment"])


class OrderUpdateSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Order.Status.choices, required=False)
    comment = serializers.CharField(allow_blank=True, required=False)

    def update(self, instance, validated_data):
        if "comment" in validated_data:
            instance.comment = validated_data["comment"]
            instance.save(update_fields=["comment", "updated_at"])
        if "status" in validated_data:
            instance = change_status(instance, validated_data["status"])
        return instance
