import re

from rest_framework import serializers

from .models import Customer

PHONE_ALLOWED_CHARS_RE = re.compile(r"^[0-9+\-().\s]+$")
NAME_RE = re.compile(r"^[^\d\W]+([\s'-][^\d\W]+)*$", re.UNICODE)


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = [
            "id", "first_name", "last_name", "phone_number", "email",
            "created_at", "updated_at",
        ]
        read_only_fields = ["id", "created_at", "updated_at"]

    def validate_first_name(self, value):
        return self._validate_name(value, "First name")

    def validate_last_name(self, value):
        return self._validate_name(value, "Last name")

    @staticmethod
    def _validate_name(value, field_label):
        if not NAME_RE.match(value):
            raise serializers.ValidationError(
                f"{field_label} may only contain letters, spaces, hyphens, and apostrophes."
            )
        return value

    def validate_phone_number(self, value):
        if not PHONE_ALLOWED_CHARS_RE.match(value):
            raise serializers.ValidationError(
                "Phone number may only contain digits, spaces, and + - ( ) ."
            )
        digits = "".join(c for c in value if c.isdigit())
        if len(digits) < 7:
            raise serializers.ValidationError("Phone number looks too short.")
        return value
