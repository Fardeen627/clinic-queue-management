import type { Server, WebSocket } from "ws";

type ClientMeta = {
  clinicId?: string;
  roomId?: string;
};

const clientMeta = new WeakMap<WebSocket, ClientMeta>();

type ValidateSubscription = (clinicId?: string, roomId?: string) => boolean;

export function attachBroker(server: Server, validate?: ValidateSubscription) {
  server.on("connection", (socket: WebSocket) => {
    socket.on("message", (data) => {
      try {
        const text = typeof data === "string" ? data : data.toString();
        const message = JSON.parse(text);
        if (message.type === "subscribe") {
          const clinicId = message.clinicId as string | undefined;
          const roomId = message.roomId as string | undefined;
          if (validate && !validate(clinicId, roomId)) {
            socket.send(JSON.stringify({ type: "ws.error", message: "invalid subscription" }));
            return;
          }
          clientMeta.set(socket, { clinicId, roomId });
        } else if (message.type === "unsubscribe") {
          clientMeta.delete(socket);
        }
      } catch (error) {
        console.error("WS broker message error:", error);
      }
    });

    socket.on("close", () => {
      clientMeta.delete(socket);
    });
  });
}

export function broadcastToClinic(server: Server, clinicId: string, payload: unknown) {
  const data = JSON.stringify(payload);
  server.clients.forEach((client) => {
    if (client.readyState !== client.OPEN) return;
    const meta = clientMeta.get(client);
    if (meta?.clinicId === clinicId) {
      client.send(data);
    }
  });
}

export function broadcastToRoom(server: Server, roomId: string, payload: unknown) {
  const data = JSON.stringify(payload);
  server.clients.forEach((client) => {
    if (client.readyState !== client.OPEN) return;
    const meta = clientMeta.get(client);
    if (meta?.roomId === roomId) {
      client.send(data);
    }
  });
}
