# Clinic Queue System

An on-premise clinic queue management system that integrates reception, doctor rooms, and the waiting-room display into a single solution.

## Features

* **Reception**: Add/remove patients, hold/resume patients, manage queue order, and add internal notes
* **Doctor's Room**: Call the next patient, recall patients, mark patients as in service or completed, and toggle room availability
* **Waiting Room Display (DID)**: Display queue numbers, masked patient names, waiting times, call notifications, voice announcements, and video content
* **Real-time Synchronization**: All screens are updated instantly using WebSocket

## Installation

### On-Premise (Docker Compose)

1. **Install Docker**: Install [Docker Desktop](https://www.docker.com/products/docker-desktop/)

2. **Clone or download the project**

3. **Run the startup script**:

```bash
cd clinic-queue
chmod +x scripts/start.sh
./scripts/start.sh
```

4. **Access the applications**:

   * Reception / Doctor / Admin: http://localhost:3000
   * Waiting Room Display: http://localhost:3001 (fullscreen recommended)
   * API: http://localhost:8080

5. **Default login credentials**:

   * Staff: `staff1234`
   * Administrator: `admin1234`

### Local Development

1. **Install dependencies**:

```bash
cd clinic-queue
cd packages/shared && npm install && npm run build && cd ../..
cd apps/api && npm install && cd ../..
cd apps/web && npm install && cd ../..
cd apps/display && npm install && cd ../..
```

2. **Start the API server**:

```bash
cd apps/api
npm run dev
```

3. **Start the Web application**:

```bash
cd apps/web
npm run dev
```

4. **Start the Display application**:

```bash
cd apps/display
npm run dev
```

## Usage

### Initial Setup

1. **Admin Page** (`http://localhost:3000/admin`):

   * Configure voice announcement messages
   * Review clinic information

### Daily Operations

1. **Reception PC** (`http://localhost:3000/desk`):

   * Add patients to the waiting queue
   * Enter masked patient names
   * Manage patients on hold
   * Resume patients
   * Remove patients from the queue

2. **Doctor's Room PC** (`http://localhost:3000/doctor`):

   * Click the **Call Next** button
   * Change patient status to **In Service**
   * Mark the patient as **Completed**

3. **Waiting Room TV / Monitor** (`http://localhost:3001`):

   * Specify the doctor's room using the URL parameter: `?room=ROOM_ID`
   * Use fullscreen mode (`F11`) for the best viewing experience

## Technology Stack

* **Backend**: Node.js + Express + WebSocket + SQLite (`better-sqlite3`)
* **Frontend**: Next.js + TypeScript + Tailwind CSS
* **Database**: SQLite (file-based, no separate database server required)
* **Containers**: Docker + Docker Compose

## Project Structure

```text
clinic-queue/
├── apps/
│   ├── api/          # Node.js + WebSocket server
│   ├── web/          # Next.js (reception / doctor / admin)
│   └── display/      # Next.js (waiting-room DID)
├── packages/
│   └── shared/       # Shared types and utilities
├── infra/
│   ├── docker-compose.yml
│   └── nginx/
├── scripts/
│   ├── build.sh
│   └── start.sh
└── docs/
```

## API Reference

### Tickets

* `POST /api/tickets` - Create a queue ticket
* `GET /api/tickets?roomId={roomId}&status={status}` - Get tickets
* `PATCH /api/tickets/{id}` - Update a ticket
* `POST /api/tickets/{id}/call` - Call a patient
* `POST /api/tickets/{id}/hold` - Put a patient on hold
* `POST /api/tickets/{id}/resume` - Resume a patient
* `POST /api/tickets/{id}/done` - Mark a patient as completed
* `POST /api/tickets/{id}/cancel` - Cancel a ticket

### Doctor's Rooms

* `GET /api/rooms?clinicId={clinicId}` - Get rooms
* `POST /api/rooms/{id}/presence` - Update room status (Away / In Service)

### Settings

* `GET /api/settings/{clinicId}` - Get clinic settings
* `PATCH /api/settings/{clinicId}` - Update clinic settings

## WebSocket Events

* `ticket.created` - A new queue ticket was created
* `ticket.called` - A patient was called (popup + voice announcement)
* `room.presence.updated` - Doctor's room status was updated
* `display.playlist.updated` - Waiting-room display playlist was updated

## Demo IDs

* Clinic: `00000000-0000-4000-8000-000000000001`
* Room 1: `00000000-0000-4000-8000-000000000101`
* Room 2: `00000000-0000-4000-8000-000000000102`

## License

MIT
