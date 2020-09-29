FROM node:12

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

RUN chmod +x /usr/src/app/server/server.js

EXPOSE 3000

CMD npm run server