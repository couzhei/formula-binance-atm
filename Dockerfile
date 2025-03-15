## Install uv
FROM python:3.13-slim-bookworm AS build
COPY --from=ghcr.io/astral-sh/uv:0.6.6@sha256:155de41fe986842f4e792877d4ad8016a6def259cc53312c2b29b9be044c668a /uv /uvx /bin/

# Install necessary build dependencies
RUN apt-get update && \
    apt-get install --no-install-suggests --no-install-recommends --yes \
    build-essential wget && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install TA-Lib from source
RUN wget https://github.com/ta-lib/ta-lib/releases/download/v0.6.3/ta-lib-0.6.3-src.tar.gz && \
    tar -xzf ta-lib-0.6.3-src.tar.gz && \
    cd ta-lib-0.6.3 && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    rm -rf ta-lib ta-lib-0.6.3-src.tar.gz

# Remove build dependencies
RUN apt-get remove --purge --yes wget && \
    apt-get autoremove --yes && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*



# Copy the necessary files for dependency installation
# Defining executable path
COPY pyproject.toml uv.lock ./
ENV PATH=/root/.local/bin:$PATH

# Create virtual environment and install dependencies
RUN uv sync --no-dev --frozen --no-python-downloads
# --frozen --no-install-project 

# Copy the application code after dependencies are installed
COPY . /app/

# Clean up unnecessary files
RUN rm /app/pyproject.toml /app/uv.lock /app/Dockerfile /app/.dockerignore 

# Set the working directory
WORKDIR /app


# Command to run the application
CMD ["uv", "run",  "-m", "uvicorn", "api.main:app", "--port", "8888", "--host" ,"0.0.0.0"]
#CMD ["/bin/bash which python"]