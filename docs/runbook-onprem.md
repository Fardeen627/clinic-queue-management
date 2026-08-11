# On-Prem Runbook (Docker)

## Prerequisites
- Docker Desktop or Docker Engine
- Node 18+ if running locally without Docker

## Quick Start (Docker Compose)
```bash
cd infra
docker compose up --build
```

## URLs
- Web : http://localhost:3000
- Display (DID): http://localhost:3001
- API: http://localhost:8080

## SQLite Data
- Stored at `infra/data/clinic-queue.sqlite`

## Login (default)
- Staff password: `staff1234`
- Admin password: `admin1234`

## Notes
- Enable WebSocket on the same API host.
- Demo clinic ID: `00000000-0000-4000-8000-000000000001`
- Demo room IDs: `00000000-0000-4000-8000-000000000101`, `00000000-0000-4000-8000-000000000102`
- Set `NEXT_PUBLIC_CLINIC_ID` and `NEXT_PUBLIC_ROOM_ID` env vars for overrides.
