# Use an official Python runtime as a parent image
FROM python:3.9-slim

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install system dependencies
RUN apt-get update && \
  apt-get install -y \
  curl

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Expose port 80 for Flask (if you plan to use it)
EXPOSE 80

# Run the application
CMD ["gunicorn", "-w 4", "-b 0.0.0.0:80", "--timeout", "300", "flask_processor:app"]