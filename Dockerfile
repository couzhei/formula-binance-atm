# Use the official Python image from the Docker Hub
FROM python:3.10

# Set the working directory in the container
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

# Install any needed packages specified in requirements.txt
RUN pip install --no-cache-dir -r requirements.dev.txt

# If using additional development dependencies, use requirements.dev.txt
# RUN pip install --no-cache-dir -r requirements.dev.txt

# Expose the port that your application will run on
EXPOSE 8000

# Define environment variable
ENV PYTHONUNBUFFERED=1

# Run the application
CMD ["python", "main.py"]# ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

