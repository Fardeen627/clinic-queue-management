const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getAuthToken() {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('clinic-queue-token');
}

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}/api${endpoint}`;
  const token = getAuthToken();
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (role: string, password: string) =>
      fetchAPI('/auth/login', { method: 'POST', body: JSON.stringify({ role, password }) }),
  },
  tickets: {
    list: (roomId: string, status?: string) =>
      fetchAPI(`/tickets?roomId=${roomId}${status ? `&status=${status}` : ''}`),
    create: (data: any) => fetchAPI('/tickets', { method: 'POST', body: JSON.stringify(data) }),
    update: (ticketId: string, data: any) =>
      fetchAPI(`/tickets/${ticketId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    call: (ticketId: string, data: any) =>
      fetchAPI(`/tickets/${ticketId}/call`, { method: 'POST', body: JSON.stringify(data) }),
    hold: (ticketId: string) => fetchAPI(`/tickets/${ticketId}/hold`, { method: 'POST' }),
    resume: (ticketId: string) => fetchAPI(`/tickets/${ticketId}/resume`, { method: 'POST' }),
    done: (ticketId: string) => fetchAPI(`/tickets/${ticketId}/done`, { method: 'POST' }),
    cancel: (ticketId: string) => fetchAPI(`/tickets/${ticketId}/cancel`, { method: 'POST' }),
  },
  rooms: {
    list: (clinicId: string) => fetchAPI(`/rooms?clinicId=${clinicId}`),
    updatePresence: (roomId: string, data: any) =>
      fetchAPI(`/rooms/${roomId}/presence`, { method: 'POST', body: JSON.stringify(data) }),
  },
  settings: {
    get: (clinicId: string) => fetchAPI(`/settings/${clinicId}`),
    update: (clinicId: string, data: any) =>
      fetchAPI(`/settings/${clinicId}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  media: {
    list: (clinicId: string) => fetchAPI(`/media/items?clinicId=${clinicId}`),
    create: (data: any) => fetchAPI('/media/items', { method: 'POST', body: JSON.stringify(data) }),
    remove: (mediaId: string) => fetchAPI(`/media/items/${mediaId}`, { method: 'DELETE' }),
    playlist: (clinicId: string, roomId?: string) =>
      fetchAPI(`/media/playlist?clinicId=${clinicId}${roomId ? `&roomId=${roomId}` : ''}`),
    playlistAdd: (data: any) => fetchAPI('/media/playlist', { method: 'POST', body: JSON.stringify(data) }),
    playlistRemove: (clinicId: string, mediaId: string, roomId?: string) =>
      fetchAPI(`/media/playlist?clinicId=${clinicId}&mediaId=${mediaId}${roomId ? `&roomId=${roomId}` : ''}`, {
        method: 'DELETE',
      }),
  },
};
