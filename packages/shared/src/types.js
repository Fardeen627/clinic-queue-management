import { z } from 'zod';
export const ClinicSchema = z.object({
    id: z.string().uuid(),
    name: z.string(),
    timezone: z.string().default('Asia/Seoul'),
    createdAt: z.string(),
});
export const RoomSchema = z.object({
    id: z.string().uuid(),
    clinicId: z.string().uuid(),
    name: z.string(),
    isActive: z.boolean(),
    presence: z.enum(['AVAILABLE', 'AWAY']),
    presenceNote: z.string().nullable(),
    createdAt: z.string(),
});
export const TicketStatus = z.enum([
    'WAITING',
    'CALLED',
    'IN_SERVICE',
    'HOLD',
    'DONE',
    'CANCELED',
]);
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
export const TicketEventType = z.enum([
    'CREATED',
    'CALLED',
    'RECALLED',
    'HOLD',
    'RESUME',
    'DONE',
    'CANCELED',
]);
export const TicketEventSchema = z.object({
    id: z.number(),
    ticketId: z.string().uuid(),
    type: TicketEventType,
    payload: z.string(),
    createdAt: z.string(),
});
export const SettingsSchema = z.object({
    clinicId: z.string().uuid(),
    ttsEnabled: z.boolean(),
    ttsTemplate: z.string(),
    displayTheme: z.any(),
});
export const MediaKind = z.enum(['IMAGE', 'VIDEO', 'YOUTUBE', 'URL']);
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
export const MediaPlaylistItemSchema = z.object({
    clinicId: z.string().uuid(),
    roomId: z.string().nullable(),
    sortNo: z.number(),
    mediaId: z.string().uuid(),
});
export const CreateTicketSchema = z.object({
    clinicId: z.string().uuid(),
    roomId: z.string().uuid(),
    maskedName: z.string().min(1),
    fullName: z.string().optional(),
    memoPrivate: z.string().optional(),
    priority: z.number().default(0),
});
export const CreateTicket = CreateTicketSchema;
export const UpdateTicketSchema = z.object({
    memoPrivate: z.string().optional(),
    priority: z.number().optional(),
    status: TicketStatus.optional(),
});
export const UpdateTicket = UpdateTicketSchema;
export const CallTicketSchema = z.object({
    mode: z.enum(['NORMAL', 'RECALL']).default('NORMAL'),
});
export const CallTicket = CallTicketSchema;
export const UpdateRoomPresenceSchema = z.object({
    presence: z.enum(['AVAILABLE', 'AWAY']),
    note: z.string().optional(),
});
export const UpdateRoomPresence = UpdateRoomPresenceSchema;
export const UpdateSettingsSchema = z.object({
    ttsEnabled: z.boolean().optional(),
    ttsTemplate: z.string().optional(),
    displayTheme: z.any().optional(),
});
export const UpdateSettings = UpdateSettingsSchema;
export const PresenceSchema = z.object({
    roomId: z.string().uuid(),
    presence: z.enum(['AVAILABLE', 'AWAY']),
    note: z.string().nullable(),
});
export const TicketCreatedEventSchema = z.object({
    type: z.literal('ticket.created'),
    roomId: z.string().uuid(),
    ticket: TicketSchema,
});
export const TicketCalledEventSchema = z.object({
    type: z.literal('ticket.called'),
    roomId: z.string().uuid(),
    ticket: TicketSchema,
    tts: z.object({
        enabled: z.boolean(),
        text: z.string(),
    }),
});
export const TicketUpdatedEventSchema = z.object({
    type: z.literal('ticket.updated'),
    roomId: z.string().uuid(),
    ticket: TicketSchema,
});
export const RoomPresenceUpdatedEventSchema = z.object({
    type: z.literal('room.presence.updated'),
    roomId: z.string().uuid(),
    presence: z.enum(['AVAILABLE', 'AWAY']),
    note: z.string().nullable(),
});
export const DisplayPlaylistUpdatedEventSchema = z.object({
    type: z.literal('display.playlist.updated'),
    clinicId: z.string().uuid(),
    roomId: z.string().nullable(),
    items: z.array(MediaItemSchema),
});
