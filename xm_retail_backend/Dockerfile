# Use Node.js 22 with Alpine
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first (if available)
COPY package.json package-lock.json ./  

# Install dependencies
RUN npm install  

# Copy all remaining files
COPY . .  

# Expose port (for documentation purposes)
EXPOSE 4000

# Start the application
CMD ["npm", "run", "start"]
