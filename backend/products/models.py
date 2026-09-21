from django.core.validators import MinValueValidator
from django.db import models


class Product(models.Model):
    class Category(models.TextChoices):
        SKINCARE = "skincare", "Skincare"
        MAKEUP = "makeup", "Makeup"
        FRAGRANCE = "fragrance", "Fragrance"
        HAIR = "hair", "Hair"
        BODY = "body", "Body"

    name = models.CharField(max_length=150)
    brand = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.TextField(blank=True)
    price = models.DecimalField(max_digits=8, decimal_places=2, validators=[MinValueValidator(0.01)])
    stock = models.PositiveIntegerField(default=0)
    image_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["brand", "name"]

    def __str__(self):
        return f"{self.brand} {self.name}"
