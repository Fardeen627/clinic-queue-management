FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN npm ci

COPY apps/api apps/api
COPY packages/shared packages/shared
COPY docs/schema.sqlite.sql docs/schema.sqlite.sql

RUN npm run build --workspace apps/api

RUN mkdir -p /data

ENV PORT=8080
ENV DATABASE_PATH=/data/clinic-queue.sqlite
ENV SCHEMA_PATH=/app/docs/schema.sqlite.sql
ENV AUTO_SEED=true
ENV SEED_CLINIC_ID=00000000-0000-4000-8000-000000000001
ENV SEED_ROOM_1_ID=00000000-0000-4000-8000-000000000101
ENV SEED_ROOM_2_ID=00000000-0000-4000-8000-000000000102
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "apps/api/dist/index.js"]
