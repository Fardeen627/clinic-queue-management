export function formatElapsed(fromIso: string, now: Date = new Date()): string {
  const from = new Date(fromIso);
  const diffMs = Math.max(0, now.getTime() - from.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}
