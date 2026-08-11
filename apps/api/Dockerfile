FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY ../../packages/shared/package.json ../../packages/shared/

RUN npm install

COPY . ./
COPY ../../packages/shared ../../packages/shared

RUN npm run build

RUN mkdir -p /app/data

ENV PORT=8080
ENV DATABASE_PATH=/data/clinic-queue.sqlite
ENV SCHEMA_PATH=/app/docs/schema.sqlite.sql
ENV AUTO_SEED=true
ENV SEED_CLINIC_ID=00000000-0000-4000-8000-000000000001
ENV SEED_ROOM_1_ID=00000000-0000-4000-8000-000000000101
ENV SEED_ROOM_2_ID=00000000-0000-4000-8000-000000000102
ENV ADMIN_PASSWORD=admin1234
ENV STAFF_PASSWORD=staff1234
ENV NODE_ENV=production

EXPOSE 8080

CMD ["npm", "start"]
