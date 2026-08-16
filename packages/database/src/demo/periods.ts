/**
 * Period boundaries for the frozen Summit & Sage reporting window.
 *
 * These helpers are shared by the database seeder and the static demo snapshot builder so both
 * derive identical period starts and ends from the same fixture months.
 */

export const PRIOR_WEEK_START = new Date('2026-07-20T06:00:00.000Z');
export const PRIOR_WEEK_END = new Date('2026-07-27T05:59:59.999Z');

export function nextMonth(month: string): string {
  const [yearText, monthText] = month.split('-');
  const year = Number(yearText);
  const monthNumber = Number(monthText);
  const next = monthNumber === 12 ? [year + 1, 1] : [year, monthNumber + 1];
  return `${next[0]}-${String(next[1]).padStart(2, '0')}`;
}

export function denverOffsetAtMonthStart(month: string): '-06:00' | '-07:00' {
  return ['2025-12', '2026-01', '2026-02', '2026-03'].includes(month) ? '-07:00' : '-06:00';
}

export function monthlyPeriod(month: string): { start: Date; end: Date } {
  const followingMonth = nextMonth(month);
  const start = new Date(`${month}-01T00:00:00${denverOffsetAtMonthStart(month)}`);
  const nextStart = new Date(
    `${followingMonth}-01T00:00:00${denverOffsetAtMonthStart(followingMonth)}`,
  );
  return { start, end: new Date(nextStart.getTime() - 1) };
}
