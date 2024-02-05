# Use Ubuntu 22.04 as base image
FROM ubuntu:22.04

# Set noninteractive installation to avoid getting stuck during build
ARG DEBIAN_FRONTEND=noninteractive

# Install Nginx
RUN apt-get update && \
    apt-get install -y nginx && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* && \
    echo "\ndaemon off;" >> /etc/nginx/nginx.conf

# Replace the default Nginx landing page
RUN echo 'Hello from Dockerized Nginx on Ubuntu 22.04!' > /var/www/html/index.html

# Install curl
RUN apt-get update && apt-get install -y unzip && apt-get clean
RUN apt-get update && apt-get install -y curl && apt-get clean

# Set environment variables using ENV
ENV BUN_INSTALL "$HOME/.bun"
ENV PATH "$BUN_INSTALL/bin:$PATH"

# Activate the environment variables
RUN echo 'source $HOME/.bun/bun.env' >> $HOME/.bashrc
RUN curl -fsSL https://bun.sh/install | bash

# Install Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Copy current work directory into the image
COPY . /usr/src/app

# Set working directory
WORKDIR /usr/src/app

# Install project dependencies
RUN bun install

# Expose port 80
EXPOSE 80

# Start Nginx when the container has provisioned.
CMD ["nginx"]