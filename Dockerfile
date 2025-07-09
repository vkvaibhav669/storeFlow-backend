# Use official Node.js LTS image
FROM node:20

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Expose the port your app runs on
EXPOSE 8000

# Set environment variables (override in docker-compose or at runtime)
ENV PORT=8000

# Start the server
CMD ["node", "server.js"]