# Real-time Events (WebSocket)

```json
// event: ticket.created
{
  "type": "ticket.created",
  "roomId": "uuid",
  "ticket": {
    "id": "uuid",
    "ticketCode": "001",
    "maskedName": "F*Akhtar",
    "status": "WAITING",
    "createdAt": "2026-01-19T10:12:00+05:30"
  }
}

// event: ticket.called (call popup + voice trigger)
{
  "type": "ticket.called",
  "roomId": "uuid",
  "ticket": {
    "id": "uuid",
    "ticketCode": "001",
    "maskedName": "F*Akhtar",
    "fullName": "Fardeen Akhtar",
    "status": "CALLED",
    "calledAt": "2026-01-19T10:21:03+05:30"
  },
  "tts": {
    "enabled": true,
    "text": "Fardeen Akhtar, please proceed to Room 1"
  }
}

// event: ticket.updated (status/memo/priority changed)
{
  "type": "ticket.updated",
  "roomId": "uuid",
  "ticket": {
    "id": "uuid",
    "ticketCode": "001",
    "maskedName": "F*Akhtar",
    "status": "HOLD"
  }
}

// event: room.presence.updated
{
  "type": "room.presence.updated",
  "roomId": "uuid",
  "presence": "AWAY",
  "note": "Lunch break"
}

// event: display.playlist.updated
{
  "type": "display.playlist.updated",
  "clinicId": "uuid",
  "roomId": null,
  "items": [
    {
      "kind": "VIDEO",
      "src": "file-or-url",
      "durationS": null
    }
  ]
}