FROM node:22
WORKDIR /opt/app

# Copy package files first for better layer caching
COPY package*.json ./
RUN npm install

COPY . .

# Explicitly copy the utils directory
COPY utils ./utils

ENTRYPOINT ["node", "app.js"]