FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Hosting platforms (Render) start the image with this command and provide $PORT.
# docker-compose.yml overrides it with its own command for local development.
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py create_demo_admin && python manage.py seed_demo && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000}"]
