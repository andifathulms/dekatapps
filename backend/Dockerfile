FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p media staticfiles

CMD ["sh", "-c", "python manage.py migrate && python manage.py seed_users && python manage.py setup_minio && python manage.py collectstatic --noinput && gunicorn dekat.wsgi:application --bind 0.0.0.0:8000"]
