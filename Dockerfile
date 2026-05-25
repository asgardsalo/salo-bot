FROM mcr.microsoft.com/playwright:v1.42.0-jammy

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Default command (puedes cambiarlo por un server HTTP si lo deseas)
CMD ["node", "dist/index.js"]
