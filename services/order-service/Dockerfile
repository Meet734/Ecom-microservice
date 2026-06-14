FROM node:20-alpine
WORKDIR /usr/src/app

# Install dependencies first (cached layer)
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

EXPOSE 3004

CMD ["npm", "start"]
