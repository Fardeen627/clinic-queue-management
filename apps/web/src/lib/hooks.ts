import { useState, useEffect } from 'react';
import { api } from './api';
import { Ticket, Room } from '@shared';

export function useTickets(roomId: string, status?: string) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      if (!roomId) {
        setTickets([]);
        setError(null);
        setLoading(false);
        return;
      }
      const data = await api.tickets.list(roomId, status);
      setTickets(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [roomId, status]);

  const refetch = () => fetchTickets();

  return { tickets, loading, error, refetch };
}

export function useRooms(clinicId: string) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.rooms
      .list(clinicId)
      .then(setRooms)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [clinicId]);

  return { rooms, loading, error };
}
