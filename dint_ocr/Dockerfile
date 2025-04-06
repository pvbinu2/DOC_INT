# Base image
FROM node:20-slim

# Install native packages: poppler for pdf-poppler, and tesseract for OCR
RUN apt-get update && \
    apt-get install -y poppler-utils tesseract-ocr && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set app directory
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose the port your app runs on
EXPOSE 3000

# Start the app
CMD ["node", "src/index.js"]
