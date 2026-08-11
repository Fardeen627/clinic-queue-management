export function maskName(name: string): string {
  if (name.length <= 1) {
    return name;
  }

  const firstChar = name.charAt(0);
  const lastChar = name.charAt(name.length - 1);
  const middleLength = Math.max(name.length - 2, 0);

  return firstChar + '*'.repeat(middleLength) + (name.length > 1 ? lastChar : '');
}

export function formatTimeElapsed(createdAt: string): string {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatTime(date: string): string {
  const d = new Date(date);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function generateTicketCode(no: number): string {
  return String(no).padStart(3, '0');
}

export function getTodayYMD(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

export function formatTTSTemplate(template: string, name: string, room: string): string {
  return template
    .replace('{name}', name)
    .replace('{room}', room);
}
