FROM node:20-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create data directories
RUN mkdir -p src/data/chats

# Expose port
EXPOSE 5000

# Start server
CMD ["node", "server.js"]