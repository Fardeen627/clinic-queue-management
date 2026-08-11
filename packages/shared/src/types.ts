import { z } from 'zod';

export const ClinicSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  timezone: z.string().default('Asia/Seoul'),
  createdAt: z.string(),
});

export type Clinic = z.infer<typeof ClinicSchema>;

export const RoomSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
  presence: z.enum(['AVAILABLE', 'AWAY']),
  presenceNote: z.string().nullable(),
  createdAt: z.string(),
});

export type Room = z.infer<typeof RoomSchema>;

export const TicketStatus = z.enum([
  'WAITING',
  'CALLED',
  'IN_SERVICE',
  'HOLD',
  'DONE',
  'CANCELED',
]);

export type TicketStatus = z.infer<typeof TicketStatus>;

export const TicketSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  roomId: z.string().uuid(),
  ymd: z.string(),
  ticketNo: z.number(),
  ticketCode: z.string(),
  maskedName: z.string(),
  fullName: z.string().nullable(),
  memoPrivate: z.string().nullable(),
  status: TicketStatus,
  priority: z.number(),
  createdAt: z.string(),
  calledAt: z.string().nullable(),
  doneAt: z.string().nullable(),
});

export type Ticket = z.infer<typeof TicketSchema>;

export const TicketEventType = z.enum([
  'CREATED',
  'CALLED',
  'RECALLED',
  'HOLD',
  'RESUME',
  'DONE',
  'CANCELED',
]);

export type TicketEventType = z.infer<typeof TicketEventType>;

export const TicketEventSchema = z.object({
  id: z.number(),
  ticketId: z.string().uuid(),
  type: TicketEventType,
  payload: z.string(),
  createdAt: z.string(),
});

export type TicketEvent = z.infer<typeof TicketEventSchema>;

export const SettingsSchema = z.object({
  clinicId: z.string().uuid(),
  ttsEnabled: z.boolean(),
  ttsTemplate: z.string(),
  displayTheme: z.any(),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const MediaKind = z.enum(['IMAGE', 'VIDEO', 'YOUTUBE', 'URL']);

export type MediaKind = z.infer<typeof MediaKind>;

export const MediaItemSchema = z.object({
  id: z.string().uuid(),
  clinicId: z.string().uuid(),
  kind: MediaKind,
  title: z.string().nullable(),
  src: z.string(),
  durationS: z.number().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export type MediaItem = z.infer<typeof MediaItemSchema>;

export const MediaPlaylistItemSchema = z.object({
  clinicId: z.string().uuid(),
  roomId: z.string().nullable(),
  sortNo: z.number(),
  mediaId: z.string().uuid(),
});

export type MediaPlaylistItem = z.infer<typeof MediaPlaylistItemSchema>;

export const CreateTicketSchema = z.object({
  clinicId: z.string().uuid(),
  roomId: z.string().uuid(),
  maskedName: z.string().min(1),
  fullName: z.string().optional(),
  memoPrivate: z.string().optional(),
  priority: z.number().default(0),
});

export const CreateTicket = CreateTicketSchema;
export type CreateTicket = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = z.object({
  memoPrivate: z.string().optional(),
  priority: z.number().optional(),
  status: TicketStatus.optional(),
});

export const UpdateTicket = UpdateTicketSchema;
export type UpdateTicket = z.infer<typeof UpdateTicketSchema>;

export const CallTicketSchema = z.object({
  mode: z.enum(['NORMAL', 'RECALL']).default('NORMAL'),
});

export const CallTicket = CallTicketSchema;
export type CallTicket = z.infer<typeof CallTicketSchema>;

export const UpdateRoomPresenceSchema = z.object({
  presence: z.enum(['AVAILABLE', 'AWAY']),
  note: z.string().optional(),
});

export const UpdateRoomPresence = UpdateRoomPresenceSchema;
export type UpdateRoomPresence = z.infer<typeof UpdateRoomPresenceSchema>;

export const UpdateSettingsSchema = z.object({
  ttsEnabled: z.boolean().optional(),
  ttsTemplate: z.string().optional(),
  displayTheme: z.any().optional(),
});

export const UpdateSettings = UpdateSettingsSchema;
export type UpdateSettings = z.infer<typeof UpdateSettingsSchema>;

export const PresenceSchema = z.object({
  roomId: z.string().uuid(),
  presence: z.enum(['AVAILABLE', 'AWAY']),
  note: z.string().nullable(),
});

export type Presence = z.infer<typeof PresenceSchema>;

export const TicketCreatedEventSchema = z.object({
  type: z.literal('ticket.created'),
  roomId: z.string().uuid(),
  ticket: TicketSchema,
});

export type TicketCreatedEvent = z.infer<typeof TicketCreatedEventSchema>;

export const TicketCalledEventSchema = z.object({
  type: z.literal('ticket.called'),
  roomId: z.string().uuid(),
  ticket: TicketSchema,
  tts: z.object({
    enabled: z.boolean(),
    text: z.string(),
  }),
});

export type TicketCalledEvent = z.infer<typeof TicketCalledEventSchema>;

export const TicketUpdatedEventSchema = z.object({
  type: z.literal('ticket.updated'),
  roomId: z.string().uuid(),
  ticket: TicketSchema,
});

export type TicketUpdatedEvent = z.infer<typeof TicketUpdatedEventSchema>;

export const RoomPresenceUpdatedEventSchema = z.object({
  type: z.literal('room.presence.updated'),
  roomId: z.string().uuid(),
  presence: z.enum(['AVAILABLE', 'AWAY']),
  note: z.string().nullable(),
});

export type RoomPresenceUpdatedEvent = z.infer<typeof RoomPresenceUpdatedEventSchema>;

export const DisplayPlaylistUpdatedEventSchema = z.object({
  type: z.literal('display.playlist.updated'),
  clinicId: z.string().uuid(),
  roomId: z.string().nullable(),
  items: z.array(MediaItemSchema),
});

export type DisplayPlaylistUpdatedEvent = z.infer<typeof DisplayPlaylistUpdatedEventSchema>;

export type WSEvent =
  | TicketCreatedEvent
  | TicketCalledEvent
  | TicketUpdatedEvent
  | RoomPresenceUpdatedEvent
  | DisplayPlaylistUpdatedEvent;
