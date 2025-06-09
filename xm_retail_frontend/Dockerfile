# 1️⃣ Build Stage (React App)
FROM node:22-alpine AS build

# Declare build-time environment variables
ARG VITE_APP_SERVER_BASE_URL
ENV VITE_APP_SERVER_BASE_URL=$VITE_APP_SERVER_BASE_URL

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy the entire project
COPY . .

# Build the React app using Vite
RUN npm run build

# Debug: List the contents of /app to verify the build output
RUN ls -la /app

# 2️⃣ Production Stage (Nginx)
FROM nginx:1.23-alpine

# Set working directory
WORKDIR /usr/share/nginx/html

# Remove default Nginx static files
RUN rm -rf ./*

# Copy built React files from the build container
COPY --from=build /app/dist ./

# Copy the custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start Nginx
ENTRYPOINT ["nginx", "-g", "daemon off;"]
