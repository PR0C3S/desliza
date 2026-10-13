export function fmtBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) return (mb / 1024).toFixed(1).replace('.', ',') + ' GB';
  if (mb >= 100) return Math.round(mb) + ' MB';
  if (mb >= 0.05) return mb.toFixed(1).replace('.', ',') + ' MB';
  return '0 MB';
}

export function fmtDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' : '') + r;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fmtDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const base = d.getDate() + ' ' + MONTHS[d.getMonth()];
  return d.getFullYear() === now.getFullYear() ? base : base + ' ' + d.getFullYear();
}

export function plural(n: number, one: string, many: string): string {
  return n + ' ' + (n === 1 ? one : many);
}
