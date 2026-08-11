import http from "node:http";
import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { WebSocketServer } from "ws";
import { openDb } from "./db/sqlite.js";
import { attachBroker, broadcastToClinic, broadcastToRoom } from "./ws/broker.js";

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());

const db = openDb();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
attachBroker(wss, (clinicId?: string, roomId?: string) => {
  if (!clinicId) return false;
  const clinic = db.prepare("SELECT 1 FROM clinics WHERE id = ?").get(clinicId);
  if (!clinic) return false;
  if (!roomId) return true;
  const room = db.prepare("SELECT 1 FROM rooms WHERE id = ? AND clinic_id = ?").get(roomId, clinicId);
  return Boolean(room);
});

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin1234";
const STAFF_PASSWORD = process.env.STAFF_PASSWORD || "staff1234";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "admin-token";
const STAFF_TOKEN = process.env.STAFF_TOKEN || "staff-token";

if (process.env.AUTO_SEED !== "false") {
  ensureSeed();
}

function nowIso() {
  return new Date().toISOString();
}

function ymdToday() {
  const d = new Date();
  const yyyy = String(d.getFullYear());
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}${mm}${dd}`;
}

function issueTicketNo(clinicId: string, roomId: string) {
  const ymd = ymdToday();
  db.prepare("BEGIN IMMEDIATE").run();
  try {
    const row = db
      .prepare("SELECT last_no FROM day_sequences WHERE clinic_id = ? AND room_id = ? AND ymd = ?")
      .get(clinicId, roomId, ymd) as { last_no?: number } | undefined;

    const nextNo = (row?.last_no || 0) + 1;
    if (row) {
      db.prepare("UPDATE day_sequences SET last_no = ? WHERE clinic_id = ? AND room_id = ? AND ymd = ?")
        .run(nextNo, clinicId, roomId, ymd);
    } else {
      db.prepare(
        "INSERT INTO day_sequences (clinic_id, room_id, ymd, last_no) VALUES (?, ?, ?, ?)"
      ).run(clinicId, roomId, ymd, nextNo);
    }

    db.prepare("COMMIT").run();
    return { ymd, ticketNo: nextNo, ticketCode: String(nextNo).padStart(3, "0") };
  } catch (error) {
    db.prepare("ROLLBACK").run();
    throw error;
  }
}

function getSettings(clinicId: string) {
  const row = db
    .prepare("SELECT tts_enabled, tts_template FROM settings WHERE clinic_id = ?")
    .get(clinicId) as { tts_enabled?: number; tts_template?: string } | undefined;
  return {
    ttsEnabled: row ? row.tts_enabled === 1 : true,
    ttsTemplate: row?.tts_template || "Ticket {name}, please proceed to {room}.",
  };
}

type AuthRole = "admin" | "staff";

function getRoleFromAuthHeader(header?: string | string[]) {
  const value = Array.isArray(header) ? header[0] : header;
  if (!value) return null;
  const token = value.replace(/^Bearer\s+/i, "");
  if (token === ADMIN_TOKEN) return "admin";
  if (token === STAFF_TOKEN) return "staff";
  return null;
}

function requireRole(req: express.Request, res: express.Response, roles: AuthRole[]) {
  const role = getRoleFromAuthHeader(req.headers.authorization);
  if (!role || !roles.includes(role)) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return role;
}

function mapRoom(row: any) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    name: row.name,
    isActive: row.is_active === 1,
    presence: row.presence,
    presenceNote: row.presence_note,
    createdAt: row.created_at,
  };
}

function mapTicket(row: any) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    roomId: row.room_id,
    ymd: row.ymd,
    ticketNo: row.ticket_no,
    ticketCode: row.ticket_code,
    maskedName: row.masked_name,
    fullName: row.full_name,
    memoPrivate: row.memo_private,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    calledAt: row.called_at,
    doneAt: row.done_at,
  };
}

function mapTicketPublic(row: any) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    roomId: row.room_id,
    ymd: row.ymd,
    ticketNo: row.ticket_no,
    ticketCode: row.ticket_code,
    maskedName: row.masked_name,
    fullName: null,
    memoPrivate: null,
    status: row.status,
    priority: row.priority,
    createdAt: row.created_at,
    calledAt: row.called_at,
    doneAt: row.done_at,
  };
}

function mapMedia(row: any) {
  return {
    id: row.id,
    clinicId: row.clinic_id,
    kind: row.kind,
    title: row.title,
    src: row.src,
    durationS: row.duration_s,
    isActive: row.is_active === 1,
    createdAt: row.created_at,
  };
}

function getPlaylistItems(clinicId: string, roomId: string | null) {
  const rows = roomId
    ? db
        .prepare(
          "SELECT m.* FROM media_playlist_items p JOIN media_items m ON p.media_id = m.id WHERE p.clinic_id = ? AND p.room_id = ? ORDER BY p.sort_no ASC"
        )
        .all(clinicId, roomId)
    : db
        .prepare(
          "SELECT m.* FROM media_playlist_items p JOIN media_items m ON p.media_id = m.id WHERE p.clinic_id = ? AND p.room_id IS NULL ORDER BY p.sort_no ASC"
        )
        .all(clinicId);
  return rows.map(mapMedia);
}

function emitTicketUpdated(ticketRow: any) {
  if (!ticketRow) return;
  const ticket = mapTicketPublic(ticketRow);
  const payload = {
    type: "ticket.updated",
    roomId: ticket.roomId,
    ticket,
  };
  broadcastToClinic(wss, ticket.clinicId, payload);
  broadcastToRoom(wss, ticket.roomId, payload);
}

function ensureSeed() {
  const exists = db.prepare("SELECT COUNT(*) as count FROM clinics").get() as { count: number };
  if (exists.count > 0) return;

  const clinicId = process.env.SEED_CLINIC_ID || "00000000-0000-4000-8000-000000000001";
  const createdAt = nowIso();
  db.prepare("INSERT INTO clinics (id, name, timezone, created_at) VALUES (?, ?, ?, ?)")
    .run(clinicId, "Campus Clinic", "Asia/Seoul", createdAt);

  const rooms = [
    { id: process.env.SEED_ROOM_1_ID || "00000000-0000-4000-8000-000000000101", name: "Room 1" },
    { id: process.env.SEED_ROOM_2_ID || "00000000-0000-4000-8000-000000000102", name: "Room 2" },
  ];

  const insertRoom = db.prepare(
    "INSERT INTO rooms (id, clinic_id, name, is_active, presence, created_at) VALUES (?, ?, ?, 1, 'AVAILABLE', ?)"
  );
  rooms.forEach((room) => insertRoom.run(room.id, clinicId, room.name, createdAt));

  db.prepare(
    "INSERT INTO settings (clinic_id, tts_enabled, tts_template, display_theme) VALUES (?, 1, ?, ?)"
  ).run(clinicId, "Ticket {name}, please proceed to {room}.", "{}");

  const ymd = ymdToday();
  const insertSeq = db.prepare(
    "INSERT INTO day_sequences (clinic_id, room_id, ymd, last_no) VALUES (?, ?, ?, 0)"
  );
  rooms.forEach((room) => insertSeq.run(clinicId, room.id, ymd));

  const mediaA = process.env.SEED_MEDIA_1_ID || randomUUID();
  const mediaB = process.env.SEED_MEDIA_2_ID || randomUUID();
  db.prepare(
    "INSERT INTO media_items (id, clinic_id, kind, title, src, duration_s, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
  ).run(mediaA, clinicId, "IMAGE", "Clinic wellness information", "https://placehold.co/1200x800?text=Clinic+Information", 10, createdAt);
  db.prepare(
    "INSERT INTO media_items (id, clinic_id, kind, title, src, duration_s, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
  ).run(mediaB, clinicId, "URL", "Clinic website", "https://example.com", 15, createdAt);
  db.prepare(
    "INSERT INTO media_playlist_items (clinic_id, room_id, sort_no, media_id) VALUES (?, NULL, 1, ?)"
  ).run(clinicId, mediaA);
  db.prepare(
    "INSERT INTO media_playlist_items (clinic_id, room_id, sort_no, media_id) VALUES (?, NULL, 2, ?)"
  ).run(clinicId, mediaB);

  console.log(`Seeded clinic: ${clinicId}`);
  rooms.forEach((room) => console.log(`Seeded room: ${room.name} ${room.id}`));
}

function createTicketEvent(ticketId: string, type: string, payload: Record<string, unknown>) {
  db.prepare(
    "INSERT INTO ticket_events (ticket_id, type, payload, created_at) VALUES (?, ?, ?, ?)"
  ).run(ticketId, type, JSON.stringify(payload), nowIso());
}

app.post("/api/auth/login", (req, res) => {
  const { role, password } = req.body as { role?: string; password?: string };
  if (role === "admin" && password === ADMIN_PASSWORD) {
    res.json({ token: ADMIN_TOKEN, role: "admin" });
    return;
  }
  if ((role === "staff" || role === "desk" || role === "doctor") && password === STAFF_PASSWORD) {
    res.json({ token: STAFF_TOKEN, role: "staff" });
    return;
  }
  res.status(401).json({ error: "invalid credentials" });
});

app.get("/api/rooms", (req, res) => {
  const clinicId = req.query.clinicId ? String(req.query.clinicId) : null;
  const sql = clinicId
    ? "SELECT * FROM rooms WHERE clinic_id = ? AND is_active = 1 ORDER BY name"
    : "SELECT * FROM rooms WHERE is_active = 1 ORDER BY name";
  const rows = clinicId ? db.prepare(sql).all(clinicId) : db.prepare(sql).all();
  res.json(rows.map(mapRoom));
});

app.post("/api/rooms/:roomId/presence", (req, res) => {
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { roomId } = req.params;
  const { presence, note } = req.body as { presence?: string; note?: string };
  db.prepare("UPDATE rooms SET presence = ?, presence_note = ? WHERE id = ?")
    .run(presence || "AVAILABLE", note || null, roomId);

  const roomRow = db.prepare("SELECT * FROM rooms WHERE id = ?").get(roomId);
  if (roomRow) {
    const room = mapRoom(roomRow);
    const payload = {
      type: "room.presence.updated",
      roomId,
      presence: presence || "AVAILABLE",
      note: note || null,
    };
    broadcastToClinic(wss, room.clinicId, payload);
    broadcastToRoom(wss, roomId, payload);
  }

  res.json({ ok: true });
});

app.get("/api/tickets", (req, res) => {
  const roomId = String(req.query.roomId || "");
  const status = req.query.status ? String(req.query.status) : null;
  if (!roomId) {
    res.status(400).json({ error: "roomId is required" });
    return;
  }

  const sql = status
    ? "SELECT * FROM tickets WHERE room_id = ? AND status = ? ORDER BY priority DESC, ticket_no ASC"
    : "SELECT * FROM tickets WHERE room_id = ? ORDER BY priority DESC, ticket_no ASC";
  const rows = status
    ? db.prepare(sql).all(roomId, status)
    : db.prepare(sql).all(roomId);
  const role = getRoleFromAuthHeader(req.headers.authorization);
  const mapper = role ? mapTicket : mapTicketPublic;
  res.json(rows.map(mapper));
});

app.post("/api/tickets", (req, res) => {
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { clinicId, roomId, maskedName, fullName, memoPrivate, priority } = req.body as {
    clinicId: string;
    roomId: string;
    maskedName: string;
    fullName?: string;
    memoPrivate?: string;
    priority?: number;
  };

  if (!clinicId || !roomId || !maskedName) {
    res.status(400).json({ error: "clinicId, roomId, maskedName are required" });
    return;
  }

  const { ymd, ticketNo, ticketCode } = issueTicketNo(clinicId, roomId);
  const id = randomUUID();
  const createdAt = nowIso();

  db.prepare(
    "INSERT INTO tickets (id, clinic_id, room_id, ymd, ticket_no, ticket_code, masked_name, full_name, memo_private, status, priority, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'WAITING', ?, ?)"
  ).run(
    id,
    clinicId,
    roomId,
    ymd,
    ticketNo,
    ticketCode,
    maskedName,
    fullName || null,
    memoPrivate || null,
    priority || 0,
    createdAt
  );

  createTicketEvent(id, "CREATED", { ticketCode });

  const ticket = mapTicket(db.prepare("SELECT * FROM tickets WHERE id = ?").get(id));
  const publicTicket = mapTicketPublic(db.prepare("SELECT * FROM tickets WHERE id = ?").get(id));

  broadcastToClinic(wss, clinicId, {
    type: "ticket.created",
    roomId,
    ticket: publicTicket,
  });
  broadcastToRoom(wss, roomId, {
    type: "ticket.created",
    roomId,
    ticket: publicTicket,
  });

  res.status(201).json(ticket);
});

app.patch("/api/tickets/:ticketId", (req, res) => {
  const { ticketId } = req.params;
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { memoPrivate, priority, status } = req.body as {
    memoPrivate?: string;
    priority?: number;
    status?: string;
  };

  const updates: string[] = [];
  const params: any[] = [];

  if (memoPrivate !== undefined) {
    updates.push("memo_private = ?");
    params.push(memoPrivate);
  }
  if (priority !== undefined) {
    updates.push("priority = ?");
    params.push(priority);
  }
  if (status) {
    updates.push("status = ?");
    params.push(status);
  }

  if (updates.length === 0) {
    res.json({ ok: true });
    return;
  }

  params.push(ticketId);
  db.prepare(`UPDATE tickets SET ${updates.join(", ")} WHERE id = ?`).run(...params);
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
  if (row) {
    emitTicketUpdated(row);
    res.json(mapTicket(row));
    return;
  }
  res.json({ ok: true });
});

app.post("/api/tickets/:ticketId/call", (req, res) => {
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { ticketId } = req.params;
  const { mode } = req.body as { mode?: "NORMAL" | "RECALL" };

  const ticket = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId) as any;
  if (!ticket) {
    res.status(404).json({ error: "ticket not found" });
    return;
  }

  const calledAt = nowIso();
  db.prepare("UPDATE tickets SET status = 'CALLED', called_at = ? WHERE id = ?").run(calledAt, ticketId);
  createTicketEvent(ticketId, mode === "RECALL" ? "RECALLED" : "CALLED", { calledAt });

  const settings = getSettings(ticket.clinic_id);
  const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(ticket.room_id) as any;
  const roomName = room?.name || ticket.room_id;
  const ttsText = settings.ttsTemplate
    .replace("{name}", ticket.full_name || ticket.masked_name)
    .replace("{room}", roomName);

  const mapped = mapTicketPublic(db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId));

  const payload = {
    type: "ticket.called",
    roomId: ticket.room_id,
    ticket: mapped,
    tts: {
      enabled: settings.ttsEnabled,
      text: ttsText,
    },
  };

  broadcastToClinic(wss, ticket.clinic_id, payload);
  broadcastToRoom(wss, ticket.room_id, payload);

  res.json({ ok: true });
});

app.post("/api/tickets/:ticketId/hold", (req, res) => {
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { ticketId } = req.params;
  db.prepare("UPDATE tickets SET status = 'HOLD' WHERE id = ?").run(ticketId);
  createTicketEvent(ticketId, "HOLD", {});
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
  if (row) {
    emitTicketUpdated(row);
    res.json(mapTicket(row));
    return;
  }
  res.json({ ok: true });
});

app.post("/api/tickets/:ticketId/resume", (req, res) => {
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { ticketId } = req.params;
  db.prepare("UPDATE tickets SET status = 'WAITING' WHERE id = ?").run(ticketId);
  createTicketEvent(ticketId, "RESUME", {});
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
  if (row) {
    emitTicketUpdated(row);
    res.json(mapTicket(row));
    return;
  }
  res.json({ ok: true });
});

app.post("/api/tickets/:ticketId/done", (req, res) => {
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { ticketId } = req.params;
  const doneAt = nowIso();
  db.prepare("UPDATE tickets SET status = 'DONE', done_at = ? WHERE id = ?").run(doneAt, ticketId);
  createTicketEvent(ticketId, "DONE", { doneAt });
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
  if (row) {
    emitTicketUpdated(row);
    res.json(mapTicket(row));
    return;
  }
  res.json({ ok: true });
});

app.post("/api/tickets/:ticketId/cancel", (req, res) => {
  if (!requireRole(req, res, ["staff", "admin"])) return;
  const { ticketId } = req.params;
  db.prepare("UPDATE tickets SET status = 'CANCELED' WHERE id = ?").run(ticketId);
  createTicketEvent(ticketId, "CANCELED", {});
  const row = db.prepare("SELECT * FROM tickets WHERE id = ?").get(ticketId);
  if (row) {
    emitTicketUpdated(row);
    res.json(mapTicket(row));
    return;
  }
  res.json({ ok: true });
});

app.get("/api/settings/:clinicId", (req, res) => {
  if (!requireRole(req, res, ["admin"])) return;
  const { clinicId } = req.params;
  const row = db
    .prepare("SELECT clinic_id, tts_enabled, tts_template, display_theme FROM settings WHERE clinic_id = ?")
    .get(clinicId) as any;
  if (!row) {
    res.json({ clinicId, ttsEnabled: true, ttsTemplate: "Ticket {name}, please proceed to {room}.", displayTheme: {} });
    return;
  }

  res.json({
    clinicId: row.clinic_id,
    ttsEnabled: row.tts_enabled === 1,
    ttsTemplate: row.tts_template,
    displayTheme: JSON.parse(row.display_theme || "{}"),
  });
});

app.patch("/api/settings/:clinicId", (req, res) => {
  if (!requireRole(req, res, ["admin"])) return;
  const { clinicId } = req.params;
  const { ttsEnabled, ttsTemplate, displayTheme } = req.body as {
    ttsEnabled?: boolean;
    ttsTemplate?: string;
    displayTheme?: Record<string, unknown>;
  };

  const existing = db.prepare("SELECT clinic_id FROM settings WHERE clinic_id = ?").get(clinicId) as any;
  if (!existing) {
    db.prepare(
      "INSERT INTO settings (clinic_id, tts_enabled, tts_template, display_theme) VALUES (?, ?, ?, ?)"
    ).run(
      clinicId,
      ttsEnabled === false ? 0 : 1,
      ttsTemplate || "Ticket {name}, please proceed to {room}.",
      JSON.stringify(displayTheme || {})
    );
  } else {
    db.prepare(
      "UPDATE settings SET tts_enabled = COALESCE(?, tts_enabled), tts_template = COALESCE(?, tts_template), display_theme = COALESCE(?, display_theme) WHERE clinic_id = ?"
    ).run(
      typeof ttsEnabled === "boolean" ? (ttsEnabled ? 1 : 0) : null,
      ttsTemplate ?? null,
      displayTheme ? JSON.stringify(displayTheme) : null,
      clinicId
    );
  }

  res.json({ ok: true });
});

app.get("/api/media/items", (req, res) => {
  if (!requireRole(req, res, ["admin"])) return;
  const clinicId = String(req.query.clinicId || "");
  if (!clinicId) {
    res.status(400).json({ error: "clinicId is required" });
    return;
  }
  const rows = db.prepare("SELECT * FROM media_items WHERE clinic_id = ? ORDER BY created_at DESC").all(clinicId);
  res.json(rows.map(mapMedia));
});

app.post("/api/media/items", (req, res) => {
  if (!requireRole(req, res, ["admin"])) return;
  const { clinicId, kind, title, src, durationS } = req.body as {
    clinicId: string;
    kind: string;
    title?: string;
    src: string;
    durationS?: number;
  };
  if (!clinicId || !kind || !src) {
    res.status(400).json({ error: "clinicId, kind, src are required" });
    return;
  }
  const id = randomUUID();
  const createdAt = nowIso();
  db.prepare(
    "INSERT INTO media_items (id, clinic_id, kind, title, src, duration_s, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?)"
  ).run(id, clinicId, kind, title || null, src, durationS ?? null, createdAt);
  const row = db.prepare("SELECT * FROM media_items WHERE id = ?").get(id);
  res.status(201).json(mapMedia(row));
});

app.delete("/api/media/items/:mediaId", (req, res) => {
  if (!requireRole(req, res, ["admin"])) return;
  const { mediaId } = req.params;
  const row = db.prepare("SELECT * FROM media_items WHERE id = ?").get(mediaId);
  if (!row) {
    res.status(404).json({ error: "media not found" });
    return;
  }
  const clinicId = row.clinic_id;
  db.prepare("DELETE FROM media_playlist_items WHERE media_id = ?").run(mediaId);
  db.prepare("DELETE FROM media_items WHERE id = ?").run(mediaId);
  const items = getPlaylistItems(clinicId, null);
  const payload = {
    type: "display.playlist.updated",
    clinicId,
    roomId: null,
    items,
  };
  broadcastToClinic(wss, clinicId, payload);
  res.json({ ok: true });
});

app.get("/api/media/playlist", (req, res) => {
  const clinicId = String(req.query.clinicId || "");
  const roomId = req.query.roomId ? String(req.query.roomId) : null;
  if (!clinicId) {
    res.status(400).json({ error: "clinicId is required" });
    return;
  }

  res.json(getPlaylistItems(clinicId, roomId));
});

app.post("/api/media/playlist", (req, res) => {
  if (!requireRole(req, res, ["admin"])) return;
  const { clinicId, roomId, mediaId } = req.body as { clinicId: string; roomId?: string; mediaId: string };
  if (!clinicId || !mediaId) {
    res.status(400).json({ error: "clinicId and mediaId are required" });
    return;
  }
  const current = db
    .prepare(
      "SELECT MAX(sort_no) as max_sort FROM media_playlist_items WHERE clinic_id = ? AND room_id IS ?"
    )
    .get(clinicId, roomId ?? null) as { max_sort?: number };
  const nextSort = (current?.max_sort || 0) + 1;
  db.prepare(
    "INSERT INTO media_playlist_items (clinic_id, room_id, sort_no, media_id) VALUES (?, ?, ?, ?)"
  ).run(clinicId, roomId ?? null, nextSort, mediaId);

  const items = getPlaylistItems(clinicId, roomId ?? null);
  const payload = {
    type: "display.playlist.updated",
    clinicId,
    roomId: roomId ?? null,
    items,
  };
  broadcastToClinic(wss, clinicId, payload);
  if (roomId) {
    broadcastToRoom(wss, roomId, payload);
  }
  res.status(201).json(items);
});

app.delete("/api/media/playlist", (req, res) => {
  if (!requireRole(req, res, ["admin"])) return;
  const clinicId = String(req.query.clinicId || "");
  const mediaId = String(req.query.mediaId || "");
  const roomId = req.query.roomId ? String(req.query.roomId) : null;
  if (!clinicId || !mediaId) {
    res.status(400).json({ error: "clinicId and mediaId are required" });
    return;
  }
  db.prepare(
    "DELETE FROM media_playlist_items WHERE clinic_id = ? AND room_id IS ? AND media_id = ?"
  ).run(clinicId, roomId ?? null, mediaId);

  const items = getPlaylistItems(clinicId, roomId ?? null);
  const payload = {
    type: "display.playlist.updated",
    clinicId,
    roomId: roomId ?? null,
    items,
  };
  broadcastToClinic(wss, clinicId, payload);
  if (roomId) {
    broadcastToRoom(wss, roomId, payload);
  }
  res.json(items);
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "ws.connected" }));
});

const port = Number(process.env.PORT || 8080);
server.listen(port, () => {
  console.log(`API listening on :${port}`);
});
