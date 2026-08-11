import { Router, Request, Response } from 'express';
import { TicketService } from './ticket.service';
import { CreateTicket, UpdateTicket, CallTicket } from '@shared';

const router = Router();

router.post('/', async (req: Request, res: Response) => {
  try {
    const data = CreateTicket.parse(req.body);
    const ticket = await TicketService.create(data);

    const { getWSService } = require('../ws/ws.service');
    getWSService().notifyTicketCreated(ticket.id, ticket.roomId, ticket.clinicId);

    res.status(201).json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    const { roomId, status } = req.query;

    if (!roomId || typeof roomId !== 'string') {
      return res.status(400).json({ error: 'roomId is required' });
    }

    const tickets = await TicketService.findByRoomId(roomId, status as string);
    res.json(tickets);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:ticketId', async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.findById(String(req.params.ticketId));
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }
    res.json(ticket);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:ticketId', async (req: Request, res: Response) => {
  try {
    const data = UpdateTicket.parse(req.body);
    const ticket = await TicketService.update(String(req.params.ticketId), data);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:ticketId/call', async (req: Request, res: Response) => {
  try {
    const data = CallTicket.parse(req.body);
    const ticket = await TicketService.call(String(req.params.ticketId), data);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const { getWSService } = require('../ws/ws.service');
    getWSService().notifyTicketCalled(ticket.id, ticket.roomId, ticket.clinicId);

    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:ticketId/hold', async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.hold(String(req.params.ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:ticketId/resume', async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.resume(String(req.params.ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:ticketId/done', async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.done(String(req.params.ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/:ticketId/cancel', async (req: Request, res: Response) => {
  try {
    const ticket = await TicketService.cancel(String(req.params.ticketId));

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
