FROM python:3.10-slim

# Install system dependencies for postgres and building packages
RUN apt-get update && apt-get install -y gcc libpq-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# The CMD is handled by fly.toml processes
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
