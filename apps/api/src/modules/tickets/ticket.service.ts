import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db';
import {
  Ticket,
  CreateTicket,
  UpdateTicket,
  CallTicket,
  TicketStatus,
  getTodayYMD,
  generateTicketCode,
} from '@shared';

export class TicketService {
  static async create(data: CreateTicket): Promise<Ticket> {
    const db = getDB();

    const ymd = getTodayYMD();

    const getSequence = db.prepare(
      'SELECT last_no FROM day_sequences WHERE clinic_id = ? AND room_id = ? AND ymd = ? FOR UPDATE'
    );

    const updateSequence = db.prepare(
      'UPDATE day_sequences SET last_no = last_no + 1 WHERE clinic_id = ? AND room_id = ? AND ymd = ?'
    );

    const sequence = getSequence.get(data.clinicId, data.roomId, ymd) as { last_no: number } | undefined;

    if (!sequence) {
      throw new Error('Day sequence not found');
    }

    updateSequence.run(data.clinicId, data.roomId, ymd);

    const ticketNo = sequence.last_no + 1;
    const ticketCode = generateTicketCode(ticketNo);
    const id = uuidv4();
    const now = new Date().toISOString();

    const insertTicket = db.prepare(
      'INSERT INTO tickets (id, clinic_id, room_id, ymd, ticket_no, ticket_code, masked_name, full_name, memo_private, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );

    insertTicket.run(
      id,
      data.clinicId,
      data.roomId,
      ymd,
      ticketNo,
      ticketCode,
      data.maskedName,
      data.fullName || null,
      data.memoPrivate || null,
      'WAITING',
      data.priority,
      now
    );

    const insertEvent = db.prepare(
      'INSERT INTO ticket_events (ticket_id, type, payload, created_at) VALUES (?, ?, ?, ?)'
    );
    insertEvent.run(id, 'CREATED', JSON.stringify({}), now);

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(id) as Ticket;

    db.close();

    return ticket;
  }

  static async update(ticketId: string, data: UpdateTicket): Promise<Ticket | null> {
    const db = getDB();

    const updates: string[] = [];
    const params: any[] = [];

    if (data.memoPrivate !== undefined) {
      updates.push('memo_private = ?');
      params.push(data.memoPrivate);
    }

    if (data.priority !== undefined) {
      updates.push('priority = ?');
      params.push(data.priority);
    }

    if (updates.length === 0) {
      db.close();
      return null;
    }

    params.push(ticketId);

    const updateTicket = db.prepare(`UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`);
    updateTicket.run(...params);

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(ticketId) as Ticket | undefined;

    db.close();

    return ticket || null;
  }

  static async call(ticketId: string, data: CallTicket): Promise<Ticket | null> {
    const db = getDB();

    const now = new Date().toISOString();

    const updateTicket = db.prepare(
      'UPDATE tickets SET status = ?, called_at = ? WHERE id = ?'
    );
    updateTicket.run('CALLED', now, ticketId);

    const eventType = data.mode === 'RECALL' ? 'RECALLED' : 'CALLED';

    const insertEvent = db.prepare(
      'INSERT INTO ticket_events (ticket_id, type, payload, created_at) VALUES (?, ?, ?, ?)'
    );
    insertEvent.run(ticketId, eventType, JSON.stringify({ mode: data.mode }), now);

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(ticketId) as Ticket | undefined;

    db.close();

    return ticket || null;
  }

  static async hold(ticketId: string): Promise<Ticket | null> {
    const db = getDB();

    const updateTicket = db.prepare('UPDATE tickets SET status = ? WHERE id = ?');
    updateTicket.run('HOLD', ticketId);

    const now = new Date().toISOString();

    const insertEvent = db.prepare(
      'INSERT INTO ticket_events (ticket_id, type, payload, created_at) VALUES (?, ?, ?, ?)'
    );
    insertEvent.run(ticketId, 'HOLD', JSON.stringify({}), now);

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(ticketId) as Ticket | undefined;

    db.close();

    return ticket || null;
  }

  static async resume(ticketId: string): Promise<Ticket | null> {
    const db = getDB();

    const updateTicket = db.prepare('UPDATE tickets SET status = ? WHERE id = ?');
    updateTicket.run('WAITING', ticketId);

    const now = new Date().toISOString();

    const insertEvent = db.prepare(
      'INSERT INTO ticket_events (ticket_id, type, payload, created_at) VALUES (?, ?, ?, ?)'
    );
    insertEvent.run(ticketId, 'RESUME', JSON.stringify({}), now);

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(ticketId) as Ticket | undefined;

    db.close();

    return ticket || null;
  }

  static async done(ticketId: string): Promise<Ticket | null> {
    const db = getDB();

    const now = new Date().toISOString();

    const updateTicket = db.prepare('UPDATE tickets SET status = ?, done_at = ? WHERE id = ?');
    updateTicket.run('DONE', now, ticketId);

    const insertEvent = db.prepare(
      'INSERT INTO ticket_events (ticket_id, type, payload, created_at) VALUES (?, ?, ?, ?)'
    );
    insertEvent.run(ticketId, 'DONE', JSON.stringify({}), now);

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(ticketId) as Ticket | undefined;

    db.close();

    return ticket || null;
  }

  static async cancel(ticketId: string): Promise<Ticket | null> {
    const db = getDB();

    const updateTicket = db.prepare('UPDATE tickets SET status = ? WHERE id = ?');
    updateTicket.run('CANCELED', ticketId);

    const now = new Date().toISOString();

    const insertEvent = db.prepare(
      'INSERT INTO ticket_events (ticket_id, type, payload, created_at) VALUES (?, ?, ?, ?)'
    );
    insertEvent.run(ticketId, 'CANCELED', JSON.stringify({}), now);

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(ticketId) as Ticket | undefined;

    db.close();

    return ticket || null;
  }

  static async findByRoomId(roomId: string, status?: string): Promise<Ticket[]> {
    const db = getDB();

    let query = 'SELECT * FROM tickets WHERE room_id = ?';
    const params: any[] = [roomId];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY priority DESC, ticket_no ASC';

    const tickets = db.prepare(query).all(...params) as Ticket[];

    db.close();

    return tickets;
  }

  static async findById(ticketId: string): Promise<Ticket | null> {
    const db = getDB();

    const ticket = db
      .prepare('SELECT * FROM tickets WHERE id = ?')
      .get(ticketId) as Ticket | undefined;

    db.close();

    return ticket || null;
  }
}
