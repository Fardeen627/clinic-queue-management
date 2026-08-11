-- Clinic Queue System - SQLite Schema
-- Convert PostgreSQL schema to SQLite-compatible format

-- clinics: clinic locations
CREATE TABLE IF NOT EXISTS clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Seoul',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- rooms: doctor rooms or service desks
CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  presence TEXT NOT NULL DEFAULT 'AVAILABLE', -- AVAILABLE | AWAY
  presence_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_rooms_clinic_id ON rooms(clinic_id);

-- day_sequences: daily ticket number sequence
CREATE TABLE IF NOT EXISTS day_sequences (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  ymd TEXT NOT NULL, -- YYYYMMDD
  last_no INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clinic_id, room_id, ymd)
);

-- tickets: waiting tickets
CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,

  ymd TEXT NOT NULL, -- YYYYMMDD
  ticket_no INTEGER NOT NULL, -- 1,2,3...
  ticket_code TEXT NOT NULL, -- display value: 001, 002...

  masked_name TEXT NOT NULL, -- waiting room display name: "A. Smith"
  full_name TEXT, -- optional full name for voice calls

  memo_private TEXT, -- reception/doctor only (not shown on display)

  status TEXT NOT NULL DEFAULT 'WAITING', -- WAITING|CALLED|IN_SERVICE|HOLD|DONE|CANCELED
  priority INTEGER NOT NULL DEFAULT 0, -- higher priority is called first

  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  called_at TEXT,
  done_at TEXT,

  UNIQUE(clinic_id, room_id, ymd, ticket_no)
);
CREATE INDEX IF NOT EXISTS idx_tickets_room_status ON tickets(room_id, status, priority DESC, ticket_no ASC);
CREATE INDEX IF NOT EXISTS idx_tickets_room_created ON tickets(room_id, created_at);

-- ticket_events: audit and recall history
CREATE TABLE IF NOT EXISTS ticket_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- CREATED|CALLED|RECALLED|HOLD|RESUME|DONE|CANCELED
  payload TEXT NOT NULL DEFAULT '{}', -- JSON string
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ticket_events_ticket_id ON ticket_events(ticket_id);

-- settings: clinic settings (announcement template/theme)
CREATE TABLE IF NOT EXISTS settings (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  tts_enabled INTEGER NOT NULL DEFAULT 1,
  tts_template TEXT NOT NULL DEFAULT 'Ticket {name}, please proceed to {room}.',
  display_theme TEXT NOT NULL DEFAULT '{}'
);

-- media_items: waiting room videos/images
CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  kind TEXT NOT NULL, -- IMAGE|VIDEO|YOUTUBE|URL
  title TEXT,
  src TEXT NOT NULL,
  duration_s INTEGER, -- image/URL display duration
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_media_items_clinic_id ON media_items(clinic_id);

-- media_playlist_items: playlist order
CREATE TABLE IF NOT EXISTS media_playlist_items (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_id TEXT, -- null means clinic-wide
  sort_no INTEGER NOT NULL,
  media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  PRIMARY KEY (clinic_id, room_id, sort_no)
);
