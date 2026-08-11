import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { useWebSocket } from '@/lib/ws';
import { Ticket, Room } from '@shared';
import { formatTime, formatTimeElapsed } from '@shared';

export default function DisplayPage() {
  const CLINIC_ID = process.env.NEXT_PUBLIC_CLINIC_ID || '00000000-0000-4000-8000-000000000001';
  const router = useRouter();
  const roomParam = typeof router.query.room === 'string' ? router.query.room : undefined;
  const ROOM_ID = process.env.NEXT_PUBLIC_ROOM_ID || roomParam;

  const [currentTicket, setCurrentTicket] = useState<Ticket | null>(null);
  const [nextTickets, setNextTickets] = useState<Ticket[]>([]);
  const [room, setRoom] = useState<Room | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showCallPopup, setShowCallPopup] = useState(false);
  const [playlist, setPlaylist] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const { connected } = useWebSocket(CLINIC_ID, ROOM_ID, async (message) => {
    if (message.type === 'ticket.called') {
      if (message.roomId === ROOM_ID || !ROOM_ID) {
        setCurrentTicket(message.ticket);
        setShowCallPopup(true);

        if (message.tts.enabled) {
          const utterance = new SpeechSynthesisUtterance(message.tts.text);
          utterance.lang = 'en-US';
          window.speechSynthesis.speak(utterance);
        }

        setTimeout(() => {
          setShowCallPopup(false);
        }, 8000);

        fetchTickets();
      }
    } else if (message.type === 'ticket.created' || message.type === 'ticket.updated') {
      fetchTickets();
    } else if (message.type === 'display.playlist.updated') {
      if (!ROOM_ID || message.roomId === ROOM_ID || message.roomId === null) {
        setPlaylist(message.items || []);
        setCurrentIndex(0);
      }
    }
  });

  useEffect(() => {
    if (!ROOM_ID) {
      fetchRooms();
      return;
    }

    fetchRoomInfo(ROOM_ID);
    fetchTickets();
    fetchPlaylist();
  }, [ROOM_ID]);

  const fetchRooms = async () => {
    try {
      const rooms = await api.rooms.list(CLINIC_ID);
      setRooms(rooms);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const fetchRoomInfo = async (roomId: string) => {
    try {
      const rooms = await api.rooms.list(CLINIC_ID);
      const found = rooms.find((item: Room) => item.id === roomId);
      if (found) {
        setRoom(found);
      }
    } catch (error) {
      console.error('Failed to fetch room info:', error);
    }
  };

  const fetchTicketsForRoom = async (roomId: string) => {
    try {
      const tickets = await api.tickets.list(roomId);
      const called = tickets.find((t: Ticket) => t.status === 'CALLED' || t.status === 'IN_SERVICE');
      const waiting = tickets
        .filter((t: Ticket) => t.status === 'WAITING')
        .sort((a: Ticket, b: Ticket) => b.priority - a.priority || a.ticketNo - b.ticketNo)
        .slice(0, 5);

      setCurrentTicket(called || null);
      setNextTickets(waiting);
    } catch (error) {
      console.error('Failed to fetch tickets:', error);
    }
  };

  const fetchTickets = async () => {
    if (ROOM_ID) {
      fetchTicketsForRoom(ROOM_ID);
    }
  };

  const fetchPlaylist = async () => {
    try {
      const items = await api.media.playlist(CLINIC_ID, ROOM_ID);
      setPlaylist(items);
      setCurrentIndex(0);
    } catch (error) {
      console.error('Failed to fetch playlist:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (ROOM_ID) {
        fetchTicketsForRoom(ROOM_ID);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [ROOM_ID]);

  useEffect(() => {
    if (playlist.length === 0) return;
    const current = playlist[currentIndex];
    if (!current) return;
    if (current.kind === 'VIDEO') return;

    const duration = current.durationS || 10;
    const timer = setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % playlist.length);
    }, duration * 1000);

    return () => clearTimeout(timer);
  }, [playlist, currentIndex]);

  const handleVideoEnded = () => {
    if (playlist.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % playlist.length);
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
    const id = match ? match[1] : '';
    if (!id) return url;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&controls=0&loop=1&playlist=${id}`;
  };

  const currentMedia = playlist[currentIndex];

  if (!ROOM_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white text-4xl">
        <div className="text-center">
          <div className="mb-6">Select a room</div>
          {rooms.length === 0 ? (
            <div className="text-xl text-gray-400">Loading rooms…</div>
          ) : (
            <div className="space-y-3 text-2xl">
              {rooms.map((item) => (
                <div key={item.id}>
                  <a className="underline" href={`/?room=${item.id}`}>
                    {item.name}
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="flex flex-col h-screen">
        <div className="bg-teal-700 px-8 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Campus Clinic</h1>
            <p className="text-lg text-teal-100">{room?.name || 'Doctor’s Room'}</p>
          </div>
          <div className="text-xl">Please proceed to the room when called</div>
        </div>

        <div className="flex-1 flex">
          <div className="flex-1 p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-teal-300 mb-4">Now serving</h2>
              {currentTicket ? (
                <div className="bg-teal-800 rounded-2xl p-12 text-center shadow-xl shadow-teal-950/40">
                  <div className="text-8xl font-bold mb-6">{currentTicket.ticketCode}</div>
                  <div className="text-5xl mb-4">{currentTicket.maskedName}</div>
                  <div className="text-2xl text-teal-100">
                    {currentTicket.calledAt && `Called at ${formatTime(currentTicket.calledAt)}`}
                  </div>
                </div>
              ) : (
                <div className="bg-gray-900 rounded-lg p-12 text-center text-gray-400 text-3xl">
                  No patient is currently called
                </div>
              )}
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-teal-300 mb-4">Waiting queue</h2>
              {nextTickets.length === 0 ? (
                <div className="bg-gray-900 rounded-lg p-8 text-center text-gray-400 text-2xl">
                  No patients waiting
                </div>
              ) : (
                <div className="space-y-3">
                  {nextTickets.map((ticket) => (
                    <div
                      key={ticket.id}
                      className="bg-gray-900 rounded-lg p-6 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-6">
                        <div className="text-4xl font-bold text-teal-300 w-24">
                          {ticket.ticketCode}
                        </div>
                        <div>
                          <div className="text-3xl font-semibold">{ticket.maskedName}</div>
                          <div className="text-lg text-gray-400">
                            Registered {formatTime(ticket.createdAt)} · Waiting {formatTimeElapsed(ticket.createdAt)}
                          </div>
                        </div>
                        {ticket.priority > 0 && (
                          <span className="px-4 py-2 bg-amber-500 text-white text-lg rounded">Priority</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="w-1/2 bg-gray-900 p-4">
            <div className="h-full flex items-center justify-center bg-black rounded-lg overflow-hidden">
              {!currentMedia && (
                <div className="text-center text-gray-500">
                  <div className="text-6xl mb-4">📺</div>
                  <div className="text-2xl">No media playlist</div>
                  <div className="text-xl mt-2">Ask the administrator to add media</div>
                </div>
              )}
              {currentMedia?.kind === 'IMAGE' && (
                <img
                  key={currentMedia.id}
                  src={currentMedia.src}
                  alt={currentMedia.title || 'media'}
                  className="w-full h-full object-cover"
                />
              )}
              {currentMedia?.kind === 'VIDEO' && (
                <video
                  key={currentMedia.id}
                  src={currentMedia.src}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                  onEnded={handleVideoEnded}
                />
              )}
              {currentMedia?.kind === 'YOUTUBE' && (
                <iframe
                  key={currentMedia.id}
                  className="w-full h-full"
                  src={getYouTubeEmbedUrl(currentMedia.src)}
                  title={currentMedia.title || 'youtube'}
                  allow="autoplay; fullscreen"
                  allowFullScreen
                />
              )}
              {currentMedia?.kind === 'URL' && (
                <iframe
                  key={currentMedia.id}
                  className="w-full h-full"
                  src={currentMedia.src}
                  title={currentMedia.title || 'media'}
                  allow="autoplay; fullscreen"
                />
              )}
            </div>
          </div>
        </div>

        <div className="bg-gray-800 px-8 py-2 flex justify-between items-center text-sm">
          <div>WiFi: hospital-guest</div>
          <div className="flex items-center space-x-4">
            <span className={connected ? 'text-green-400' : 'text-red-400'}>
              {connected ? '● Connected' : '● Disconnected'}
            </span>
            <span>{new Date().toLocaleString('en-US')}</span>
          </div>
        </div>
      </div>

      {showCallPopup && currentTicket && (
        <div className="fixed inset-0 bg-teal-950/95 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="text-9xl font-bold mb-8">{currentTicket.ticketCode}</div>
            <div className="text-7xl font-bold">{currentTicket.maskedName}</div>
            <div className="text-4xl mt-8 text-teal-200">Please proceed to {room?.name || 'the room'}</div>
          </div>
        </div>
      )}
    </div>
  );
}
