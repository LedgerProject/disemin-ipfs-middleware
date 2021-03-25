FROM node:14-alpine

# Create app directory
WORKDIR /agroxm-ipfs-middleware

# Copy both package.json AND package-lock.json, where available
COPY ["package.json", "package-lock.json*", "./"]

# Install app dependencies
RUN npm install --quiet

# Bundle app source code
COPY . .

# Run app
CMD ["npm", "start"]
