FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++

COPY package.json package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --workspace=apps/api --workspace=packages/shared --include-workspace-root

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
COPY docs/schema.sqlite.sql ./docs/schema.sqlite.sql
COPY tsconfig*.json ./

RUN npm run build --workspace=apps/api
RUN test -f apps/api/dist/apps/api/src/index.js

EXPOSE 8080

CMD ["node", "apps/api/dist/apps/api/src/index.js"]
