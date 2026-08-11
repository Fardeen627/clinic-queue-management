FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY ../../packages/shared/package.json ../../packages/shared/

RUN npm install

COPY . ./
COPY ../../packages/shared ../../packages/shared

RUN npm run build

ENV PORT=3001
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_PUBLIC_WS_URL=ws://localhost:8080/ws

EXPOSE 3001

CMD ["npm", "start"]
