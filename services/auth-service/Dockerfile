FROM node:20-alpine
WORKDIR /usr/src/app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3001

# Use npm start for stability. 
# If you change code, run: docker-compose restart auth-service
CMD ["npm", "start"]