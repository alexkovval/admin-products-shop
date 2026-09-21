from decimal import Decimal
import random

from django.core.management.base import BaseCommand

from products.models import Product

C = Product.Category

# (name, brand, category, price, Pexels photo id). Photos are free to use
# (https://www.pexels.com/license/) and picked to match the product type.
PRODUCTS = [
    ("Hydra Boost Gel Cream", "Neutrogena", C.SKINCARE, "48.00", 13794471),
    ("Vitamin C Serum 15%", "The Ordinary", C.SKINCARE, "22.50", 8490086),
    ("Niacinamide 10% + Zinc", "The Ordinary", C.SKINCARE, "12.90", 3762882),
    ("Gentle Foaming Cleanser", "CeraVe", C.SKINCARE, "16.00", 3762465),
    ("Moisturizing Cream", "CeraVe", C.SKINCARE, "19.00", 13946075),
    ("Retinol Night Serum", "La Roche-Posay", C.SKINCARE, "54.00", 8140898),
    ("Anthelios SPF 50 Fluid", "La Roche-Posay", C.SKINCARE, "29.00", 20896018),
    ("Soft Matte Lip Cream", "Nyx", C.MAKEUP, "9.50", 2586073),
    ("Better Than Sex Mascara", "Too Faced", C.MAKEUP, "27.00", 6713327),
    ("Pro Filt'r Foundation", "Fenty Beauty", C.MAKEUP, "40.00", 10107538),
    ("Gloss Bomb Lip Luminizer", "Fenty Beauty", C.MAKEUP, "21.00", 3373740),
    ("Soft Pinch Liquid Blush", "Rare Beauty", C.MAKEUP, "23.00", 2533266),
    ("Brow Wiz Pencil", "Anastasia Beverly Hills", C.MAKEUP, "24.00", 5240248),
    ("Setting Powder Translucent", "Laura Mercier", C.MAKEUP, "43.00", 2417855),
    ("Black Opium Eau de Parfum", "YSL", C.FRAGRANCE, "115.00", 2814832),
    ("Good Girl Eau de Parfum", "Carolina Herrera", C.FRAGRANCE, "105.00", 10415082),
    ("Daisy Eau de Toilette", "Marc Jacobs", C.FRAGRANCE, "88.00", 3785784),
    ("Olaplex No.3 Hair Perfector", "Olaplex", C.HAIR, "30.00", 17576517),
    ("Repair Shampoo", "Kerastase", C.HAIR, "34.00", 13573918),
    ("Argan Oil Hair Treatment", "Moroccanoil", C.HAIR, "46.00", 10186829),
    ("Dry Shampoo Original", "Batiste", C.HAIR, "8.50", 17747936),
    ("Shea Butter Body Cream", "L'Occitane", C.BODY, "32.00", 7795646),
    ("Body Lotion Sensitive", "Aveeno", C.BODY, "14.00", 8217467),
    ("Coffee Body Scrub", "Frank Body", C.BODY, "18.00", 6621308),
    ("Rose Hand Cream", "Sol de Janeiro", C.BODY, "26.00", 35173986),
]

PEXELS_PREFIX = "https://images.pexels.com/"


def pexels_url(photo_id):
    return (
        f"{PEXELS_PREFIX}photos/{photo_id}/pexels-photo-{photo_id}.jpeg"
        "?auto=compress&cs=tinysrgb&w=600&h=600&fit=crop"
    )


class Command(BaseCommand):
    help = "Seed the database with beauty products (idempotent by brand + name)."

    def handle(self, *args, **options):
        created = 0
        for name, brand, category, price, photo_id in PRODUCTS:
            image_url = pexels_url(photo_id)
            product, was_created = Product.objects.get_or_create(
                name=name,
                brand=brand,
                defaults={
                    "category": category,
                    "price": Decimal(price),
                    "stock": random.choice([20, 30, 45, 60, 80]),
                    "description": f"{brand} {name}.",
                    "image_url": image_url,
                },
            )
            # Refresh the photo unless someone set a custom (non-Pexels) URL by hand.
            replaceable = not product.image_url or product.image_url.startswith(PEXELS_PREFIX)
            if not was_created and replaceable and product.image_url != image_url:
                product.image_url = image_url
                product.save(update_fields=["image_url", "updated_at"])
            created += was_created
        self.stdout.write(self.style.SUCCESS(f"Created {created} products."))
