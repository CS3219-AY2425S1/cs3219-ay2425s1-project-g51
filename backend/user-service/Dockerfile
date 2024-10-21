ARG NODE_VERSION=18.20.4

FROM node:${NODE_VERSION}-alpine as base

WORKDIR /usr/src/app

COPY package*.json .

RUN npm install

COPY . .

EXPOSE 3001

CMD npm start