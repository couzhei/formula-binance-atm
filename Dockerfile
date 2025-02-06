## Install uv
FROM python:3.12-slim-bookworm AS build
COPY --from=ghcr.io/astral-sh/uv:0.5.13@sha256:ea61e006cfec0e8d81fae901ad703e09d2c6cf1aa58abcb6507d124b50286f9f /uv /uvx /bin/

# Install necessary build dependencies
RUN apt-get update && \
    apt-get install --no-install-suggests --no-install-recommends --yes \
    build-essential && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy the necessary files for dependency installation
# Defining executable path
COPY pyproject.toml uv.lock ./
ENV PATH=/root/.local/bin:$PATH

# Create virtual environment and install dependencies
RUN uv sync --no-dev 
# --frozen --no-install-project --no-python-downloads

# Copy the application code after dependencies are installed
COPY . /app/

# Clean up unnecessary files
RUN rm /app/pyproject.toml /app/uv.lock

# Set the working directory
WORKDIR /app


# Command to run the application
CMD ["uv", "run",  "-m", "uvicorn", "main:app", "--port", "8888", "--host" ,"0.0.0.0"]
#CMD ["/bin/bash which python"]