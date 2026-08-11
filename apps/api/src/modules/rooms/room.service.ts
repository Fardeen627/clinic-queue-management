import { getDB } from '../db';
import { Room, UpdateRoomPresence } from '@shared';

export class RoomService {
  static async findByClinicId(clinicId: string): Promise<Room[]> {
    const db = getDB();

    const rooms = db
      .prepare('SELECT * FROM rooms WHERE clinic_id = ? ORDER BY name')
      .all(clinicId) as Room[];

    db.close();

    return rooms;
  }

  static async findById(roomId: string): Promise<Room | null> {
    const db = getDB();

    const room = db
      .prepare('SELECT * FROM rooms WHERE id = ?')
      .get(roomId) as Room | undefined;

    db.close();

    return room || null;
  }

  static async updatePresence(roomId: string, data: UpdateRoomPresence): Promise<Room | null> {
    const db = getDB();

    const updateRoom = db.prepare(
      'UPDATE rooms SET presence = ?, presence_note = ? WHERE id = ?'
    );
    updateRoom.run(data.presence, data.note || null, roomId);

    const room = db
      .prepare('SELECT * FROM rooms WHERE id = ?')
      .get(roomId) as Room | undefined;

    db.close();

    return room || null;
  }
}
