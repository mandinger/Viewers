FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Copy application files
COPY dist/ ./

# Expose port
EXPOSE 3001

# Start the application
CMD ["node", "index.js"]
