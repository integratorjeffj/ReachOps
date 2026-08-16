const WORKSPACE_TIMEZONE = 'America/Denver';

const numberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

const dayFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  timeZone: WORKSPACE_TIMEZONE,
});

const dayWithYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: WORKSPACE_TIMEZONE,
});

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: WORKSPACE_TIMEZONE,
});

const yearFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  timeZone: WORKSPACE_TIMEZONE,
});

const monthYearFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: WORKSPACE_TIMEZONE,
});

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}

export function formatDay(instant: string): string {
  return dayFormatter.format(new Date(instant));
}

export function formatTimestamp(instant: string): string {
  return timestampFormatter.format(new Date(instant));
}

export function formatYear(instant: string): string {
  return yearFormatter.format(new Date(instant));
}

export function formatMonthYear(instant: string): string {
  return monthYearFormatter.format(new Date(instant));
}

/** Renders a calendar date (`YYYY-MM-DD`) without shifting it across a timezone boundary. */
export function formatCalendarDate(date: string): string {
  return dayWithYearFormatter.format(new Date(`${date}T12:00:00.000Z`));
}

export function formatRange(start: string, end: string): string {
  return `${formatDay(start)} – ${formatDay(end)}`;
}

export function formatMetricValue(value: number, unit: string): string {
  if (unit === 'PERCENTAGE') return `${value.toFixed(2)}%`;
  if (unit === 'RATING') return value.toFixed(2);
  if (unit === 'AVERAGE_POSITION') return value.toFixed(1);
  return numberFormatter.format(value);
}

export function formatSignedPercentage(value: number | null): string {
  if (value === null) return 'Prior value was zero';
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
}

export function formatSignedPoints(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)} pp`;
}

export function sourceModeLabel(mode: string): string {
  return mode === 'IMPORTED' ? 'Imported' : mode === 'LIVE' ? 'Live' : 'Simulated';
}

export function priorityLabel(priority: string): string {
  return priority === 'OPPORTUNITY'
    ? 'Opportunity'
    : priority === 'HIGH'
      ? 'High priority'
      : 'Medium priority';
}
