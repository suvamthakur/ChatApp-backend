FROM node:20-alpine

WORKDIR /app

RUN addgroup app && adduser -S sysuser -G app

RUN chown -R sysuser:app .

COPY package*.json .

RUN npm install

COPY . .

USER sysuser

EXPOSE 5000

CMD ["npm", "run", "dev"]