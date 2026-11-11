FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ sqlite

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/display/package.json ./apps/display/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY docs/schema.sqlite.sql ./docs/schema.sqlite.sql
COPY tsconfig*.json ./

RUN npm run build --workspace=apps/api
RUN test -f apps/api/dist/apps/api/src/index.js
RUN mkdir -p /data

EXPOSE 8080

ENV DATABASE_PATH=/data/clinic-queue.sqlite

CMD sh -c "sqlite3 /data/clinic-queue.sqlite < docs/schema.sqlite.sql && node apps/api/dist/apps/api/src/index.js"
