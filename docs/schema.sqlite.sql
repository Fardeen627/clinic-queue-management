-- SQLite schema for Clinic Queue MVP
-- Note: enable foreign keys in app/db connection: PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS clinics (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  presence TEXT NOT NULL DEFAULT 'AVAILABLE',
  presence_note TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS day_sequences (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  ymd TEXT NOT NULL,
  last_no INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (clinic_id, room_id, ymd)
);

CREATE TABLE IF NOT EXISTS tickets (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_id TEXT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  ymd TEXT NOT NULL,
  ticket_no INTEGER NOT NULL,
  ticket_code TEXT NOT NULL,
  masked_name TEXT NOT NULL,
  full_name TEXT,
  memo_private TEXT,
  status TEXT NOT NULL DEFAULT 'WAITING',
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  called_at TEXT,
  done_at TEXT,
  UNIQUE (clinic_id, room_id, ymd, ticket_no)
);

CREATE INDEX IF NOT EXISTS idx_tickets_room_status ON tickets (room_id, status, priority DESC, ticket_no ASC);
CREATE INDEX IF NOT EXISTS idx_tickets_room_created ON tickets (room_id, created_at);

CREATE TABLE IF NOT EXISTS ticket_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  payload TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS settings (
  clinic_id TEXT PRIMARY KEY REFERENCES clinics(id) ON DELETE CASCADE,
  tts_enabled INTEGER NOT NULL DEFAULT 1,
  tts_template TEXT NOT NULL DEFAULT 'Ticket {name}, please proceed to {room}.',
  display_theme TEXT NOT NULL DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS media_items (
  id TEXT PRIMARY KEY,
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  kind TEXT NOT NULL,
  title TEXT,
  src TEXT NOT NULL,
  duration_s INTEGER,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
);

CREATE TABLE IF NOT EXISTS media_playlist_items (
  clinic_id TEXT NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  room_id TEXT,
  sort_no INTEGER NOT NULL,
  media_id TEXT NOT NULL REFERENCES media_items(id) ON DELETE CASCADE,
  PRIMARY KEY (clinic_id, room_id, sort_no)
);
