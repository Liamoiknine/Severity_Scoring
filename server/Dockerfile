# Use an official Python runtime as a base image
FROM python:3.10-slim

# Set working directory inside container
WORKDIR /app

# Copy only requirements first (for better caching)
COPY requirements.txt .

# Install Python dependencies from PyPI
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of your application code
COPY . .

# Expose port 8000 (Gunicorn’s default)
EXPOSE 8000

# Run your app with Gunicorn, binding to 0.0.0.0:8000
CMD ["gunicorn", "wsgi:app", "--bind", "0.0.0.0:8000"]
