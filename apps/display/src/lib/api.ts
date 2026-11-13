const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://clinic-queue-management-1-m8e8.onrender.com';

export async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const url = `${API_URL}/api${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
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
  tickets: {
    list: (roomId: string, status?: string) =>
      fetchAPI(`/tickets?roomId=${roomId}${status ? `&status=${status}` : ''}`),
  },
  rooms: {
    list: (clinicId: string) => fetchAPI(`/rooms?clinicId=${clinicId}`),
  },
  media: {
    playlist: (clinicId: string, roomId?: string) =>
      fetchAPI(`/media/playlist?clinicId=${clinicId}${roomId ? `&roomId=${roomId}` : ''}`),
  },
};
