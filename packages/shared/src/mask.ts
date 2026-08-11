export function maskName(name: string): string {
  if (!name) return "";
  const chars = Array.from(name);
  if (chars.length <= 1) return "*";
  if (chars.length === 2) return `${chars[0]}*`;
  return `${chars[0]}*${chars[chars.length - 1]}`;
}
