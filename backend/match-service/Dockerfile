ARG NODE_VERSION=18.20.4

FROM node:${NODE_VERSION}-alpine AS base

WORKDIR /usr/src/app

ENV HOST=0.0.0.0

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 8080

CMD ["npm", "start"]