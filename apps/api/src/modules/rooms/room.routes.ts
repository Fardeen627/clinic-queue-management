import { Router, Request, Response } from 'express';
import { RoomService } from './room.service';
import { UpdateRoomPresence } from '@shared';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { clinicId } = req.query;

    if (!clinicId || typeof clinicId !== 'string') {
      return res.status(400).json({ error: 'clinicId is required' });
    }

    const rooms = await RoomService.findByClinicId(clinicId);
    res.json(rooms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:roomId', async (req: Request, res: Response) => {
  try {
    const roomId = String(req.params.roomId);
    const room = await RoomService.findById(roomId);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    res.json(room);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:roomId/presence', async (req: Request, res: Response) => {
  try {
    const roomId = String(req.params.roomId);
    const data = UpdateRoomPresence.parse(req.body);
    const room = await RoomService.updatePresence(roomId, data);

    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const { getWSService } = require('../ws/ws.service');
    getWSService().notifyRoomPresenceUpdated(
      room.id,
      room.clinicId,
      data.presence,
      data.note || null
    );

    res.json(room);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
