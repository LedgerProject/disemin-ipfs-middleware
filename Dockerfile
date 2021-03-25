FROM node:14-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy both package.json AND package-lock.json, where available
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source code
COPY . .

# Run app
CMD ["npm", "start"]
