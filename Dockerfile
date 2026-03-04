FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/database

EXPOSE 3000

CMD sh -c "npx prisma migrate deploy && npm run db:seed && npm run dev"
