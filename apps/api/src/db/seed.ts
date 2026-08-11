import { v4 as uuidv4 } from 'uuid';
import { getDB } from './index';

export function seedDB(): void {
  const db = getDB();

  const clinicId = uuidv4();

  const insertClinic = db.prepare(
    'INSERT INTO clinics (id, name, timezone, created_at) VALUES (?, ?, ?, ?)'
  );
  insertClinic.run(clinicId, 'Campus Clinic', 'Asia/Seoul', new Date().toISOString());

  const roomIds = [
    { id: uuidv4(), name: 'Room 1' },
    { id: uuidv4(), name: 'Room 2' },
    { id: uuidv4(), name: 'Reception' },
  ];

  const insertRoom = db.prepare(
    'INSERT INTO rooms (id, clinic_id, name, is_active, presence, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  );

  roomIds.forEach(room => {
    insertRoom.run(room.id, clinicId, room.name, 1, 'AVAILABLE', new Date().toISOString());
  });

  const insertSettings = db.prepare(
    'INSERT INTO settings (clinic_id, tts_enabled, tts_template, display_theme) VALUES (?, ?, ?, ?)'
  );
  insertSettings.run(clinicId, 1, 'Ticket {name}, please proceed to {room}.', '{}');

  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const insertDaySequence = db.prepare(
    'INSERT INTO day_sequences (clinic_id, room_id, ymd, last_no) VALUES (?, ?, ?, ?)'
  );

  roomIds.forEach(room => {
    insertDaySequence.run(clinicId, room.id, ymd, 0);
  });

  console.log('Database seeded successfully');
  console.log(`Clinic ID: ${clinicId}`);
  console.log(`Room IDs: ${roomIds.map(r => `${r.name}: ${r.id}`).join(', ')}`);

  db.close();
}
