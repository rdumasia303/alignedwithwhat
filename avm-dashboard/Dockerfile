FROM node:18-alpine

WORKDIR /app

# Set API URL for Docker networking
ENV VITE_API_URL=http://api:8000

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Expose port
EXPOSE 5173

# Start dev server on port 5173
CMD ["npm", "run", "dev", "--", "--port", "5173", "--host", "0.0.0.0"]
