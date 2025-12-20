FROM python:3.11-slim

WORKDIR /app

# Copy backend's own requirements.txt
COPY backend/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend
COPY backend /app

ENV PYTHONPATH="/app"
EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
