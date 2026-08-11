# Proposed Folder Structure

```text
clinic-queue/
  README.md
  docs/
    PRD.md
    wireframes.md
    openapi.yaml
    schema.sqlite.sql
    runbook-onprem.md
  apps/
    api/                      # Node (Express/Nest) + WebSocket
      src/
        modules/
          rooms/
          tickets/
          settings/
          media/
        ws/
        db/
      Dockerfile
    web/                      # Next.js (reception / doctor / admin)
      src/
        pages/
          desk/
          doctor/
          admin/
        components/
        lib/
      Dockerfile
    display/                  # Next.js (DID only, fullscreen / low-spec)
      src/
        pages/
          index.tsx
        components/
        lib/
      Dockerfile
  packages/
    shared/                   # Types/schemas (Zod), common utilities (masking/time)
  infra/
    docker-compose.yml        # on-prem: api + web + display + db
    nginx/
      nginx.conf              # /api proxy + cache + gzip
  scripts/
    seed.ts                   # Sample doctor-room/settings seed
    migrate.ts
```
