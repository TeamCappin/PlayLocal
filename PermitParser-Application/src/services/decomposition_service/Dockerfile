# Use the official Python 3.11 slim image
FROM python:3.11-slim

# Set the working directory in the container
WORKDIR /app

# Copy the requirements file for this specific service
COPY src/services/decomposition_service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the shared models directory
COPY src/models /app/src/models

# Copy the application code for this specific service BEFORE creating __init__.py files
COPY src/services/decomposition_service /app/src/services/decomposition_service


# Create __init__.py files to make directories proper Python packages
RUN touch /app/src/__init__.py && \
    touch /app/src/models/__init__.py && \
    touch /app/src/services/__init__.py && \
    touch /app/src/services/decomposition_service/__init__.py

# Set the PYTHONPATH to include the root so shared models can be found
ENV PYTHONPATH=/app

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application, specifying the correct module path
CMD ["uvicorn", "src.services.decomposition_service.main:app", "--host", "0.0.0.0", "--port", "8080"]