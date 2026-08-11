import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

const dbPath = process.env.DATABASE_PATH || path.resolve(__dirname, '../infra/data/clinic-queue.sqlite');
const schemaPath = process.env.SCHEMA_PATH || path.resolve(__dirname, '../docs/schema.sqlite.sql');

if (!fs.existsSync(schemaPath)) {
  throw new Error(`Schema not found: ${schemaPath}`);
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(schemaPath, 'utf8'));

const clinicId = process.env.SEED_CLINIC_ID || '00000000-0000-4000-8000-000000000001';
const room1 = process.env.SEED_ROOM_1_ID || '00000000-0000-4000-8000-000000000101';
const room2 = process.env.SEED_ROOM_2_ID || '00000000-0000-4000-8000-000000000102';
const createdAt = new Date().toISOString();

const exists = db.prepare('SELECT COUNT(*) as count FROM clinics').get() as { count: number };
if (exists.count > 0) {
  console.log('Seed skipped: clinics already exist');
  process.exit(0);
}

db.prepare('INSERT INTO clinics (id, name, timezone, created_at) VALUES (?, ?, ?, ?)')
  .run(clinicId, 'Campus Clinic', 'Asia/Seoul', createdAt);

db.prepare(
  "INSERT INTO rooms (id, clinic_id, name, is_active, presence, created_at) VALUES (?, ?, ?, 1, 'AVAILABLE', ?)"
).run(room1, clinicId, 'Room 1', createdAt);

db.prepare(
  "INSERT INTO rooms (id, clinic_id, name, is_active, presence, created_at) VALUES (?, ?, ?, 1, 'AVAILABLE', ?)"
).run(room2, clinicId, 'Room 2', createdAt);

db.prepare(
  'INSERT INTO settings (clinic_id, tts_enabled, tts_template, display_theme) VALUES (?, 1, ?, ?)'
).run(clinicId, 'Ticket {name}, please proceed to {room}.', '{}');

const today = new Date();
const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

const insertSeq = db.prepare('INSERT INTO day_sequences (clinic_id, room_id, ymd, last_no) VALUES (?, ?, ?, 0)');
insertSeq.run(clinicId, room1, ymd);
insertSeq.run(clinicId, room2, ymd);

console.log('Seeded clinic:', clinicId);
console.log('Room 1:', room1, 'Room 2:', room2);
