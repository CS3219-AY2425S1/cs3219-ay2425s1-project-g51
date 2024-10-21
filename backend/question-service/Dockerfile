ARG NODE_VERSION=18.20.4

################################################################################
# Use node image for base image for all stages.
FROM node:${NODE_VERSION}-alpine as base

# Set working directory for all build stages.
WORKDIR /usr/src/app

# Copy package.json so that package manager commands can be used.
COPY package*.json .

# install all dependencies 
RUN npm install

# Copy the rest of the source files into the image.
COPY . .

# Expose the port that the application listens on.
EXPOSE 8000

# Run the application.
CMD npm run start:dev
