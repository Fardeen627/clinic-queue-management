import { WebSocketServer, WebSocket } from 'ws';
import { WSEvent } from '@shared';
import { TicketService } from '../modules/tickets/ticket.service';
import { RoomService } from '../modules/rooms/room.service';
import { SettingsService } from '../modules/settings/settings.service';

export class WSService {
  private wss: WebSocketServer;
  private clients: Map<string, Set<WebSocket>> = new Map();
  private roomClients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: any) {
    this.wss = new WebSocketServer({ server });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.on('message', async (data: string) => {
        try {
          const message = JSON.parse(data);

          if (message.type === 'subscribe') {
            this.subscribe(ws, message.clinicId, message.roomId);
          } else if (message.type === 'unsubscribe') {
            this.unsubscribe(ws, message.clinicId, message.roomId);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      });

      ws.on('close', () => {
        this.removeClient(ws);
      });
    });
  }

  private subscribe(ws: WebSocket, clinicId: string, roomId?: string): void {
    if (!this.clients.has(clinicId)) {
      this.clients.set(clinicId, new Set());
    }
    this.clients.get(clinicId)!.add(ws);

    if (roomId) {
      if (!this.roomClients.has(roomId)) {
        this.roomClients.set(roomId, new Set());
      }
      this.roomClients.get(roomId)!.add(ws);
    }
  }

  private unsubscribe(ws: WebSocket, clinicId: string, roomId?: string): void {
    const clinicClients = this.clients.get(clinicId);
    if (clinicClients) {
      clinicClients.delete(ws);
    }

    if (roomId) {
      const roomClients = this.roomClients.get(roomId);
      if (roomClients) {
        roomClients.delete(ws);
      }
    }
  }

  private removeClient(ws: WebSocket): void {
    this.clients.forEach((clients) => clients.delete(ws));
    this.roomClients.forEach((clients) => clients.delete(ws));
  }

  broadcast(clinicId: string, event: WSEvent): void {
    const clients = this.clients.get(clinicId);
    if (!clients) return;

    const message = JSON.stringify(event);

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  broadcastToRoom(roomId: string, event: WSEvent): void {
    const clients = this.roomClients.get(roomId);
    if (!clients) return;

    const message = JSON.stringify(event);

    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async notifyTicketCreated(ticketId: string, roomId: string, clinicId: string): Promise<void> {
    const ticket = await TicketService.findById(ticketId);
    if (!ticket) return;

    const event: WSEvent = {
      type: 'ticket.created',
      roomId,
      ticket,
    };

    this.broadcast(clinicId, event);
    this.broadcastToRoom(roomId, event);
  }

  async notifyTicketCalled(ticketId: string, roomId: string, clinicId: string): Promise<void> {
    const ticket = await TicketService.findById(ticketId);
    if (!ticket) return;

    const settings = await SettingsService.findByClinicId(clinicId);
    const room = await RoomService.findById(roomId);

    if (!settings || !room) return;

    const ttsText = settings.ttsTemplate
      .replace('{name}', ticket.fullName || ticket.maskedName)
      .replace('{room}', room.name);

    const event: WSEvent = {
      type: 'ticket.called',
      roomId,
      ticket,
      tts: {
        enabled: settings.ttsEnabled,
        text: ttsText,
      },
    };

    this.broadcast(clinicId, event);
    this.broadcastToRoom(roomId, event);
  }

  async notifyRoomPresenceUpdated(roomId: string, clinicId: string, presence: string, note: string | null): Promise<void> {
    const event: WSEvent = {
      type: 'room.presence.updated',
      roomId,
      presence: presence as any,
      note,
    };

    this.broadcast(clinicId, event);
    this.broadcastToRoom(roomId, event);
  }
}

let wsService: WSService | null = null;

export function initWSService(server: any): WSService {
  if (!wsService) {
    wsService = new WSService(server);
  }
  return wsService;
}

export function getWSService(): WSService {
  if (!wsService) {
    throw new Error('WSService not initialized');
  }
  return wsService;
}
