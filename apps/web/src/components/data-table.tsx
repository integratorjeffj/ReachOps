'use client';

import { useMemo, useState, type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  /** Numeric columns right-align so magnitudes line up down the column. */
  numeric?: boolean;
  /** Omit to make the column unsortable. */
  sortValue?: (row: T) => number | string;
  render: (row: T) => ReactNode;
  /**
   * Columns marked secondary are hidden on narrow viewports. Meaning must survive their absence,
   * so identity and the metric a reader came for are never secondary.
   */
  secondary?: boolean;
}

interface DataTableProps<T> {
  rows: T[];
  columns: Array<Column<T>>;
  rowKey: (row: T) => string;
  caption: string;
  initialSortKey?: string;
  initialDirection?: 'asc' | 'desc';
  emptyMessage?: string;
}

type Direction = 'asc' | 'desc';

/**
 * A sortable, keyboard-operable table.
 *
 * Sorting lives here rather than in each workspace so every comparative surface behaves the same
 * way, and so sort state survives opening a row's drawer — losing your place in a long table is the
 * problem drawers exist to avoid.
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  caption,
  initialSortKey,
  initialDirection = 'desc',
  emptyMessage = 'No rows match the current filters.',
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState(initialSortKey ?? columns[0]?.key ?? '');
  const [direction, setDirection] = useState<Direction>(initialDirection);

  const sorted = useMemo(() => {
    const column = columns.find((candidate) => candidate.key === sortKey);
    if (!column?.sortValue) return rows;
    const factor = direction === 'asc' ? 1 : -1;
    return [...rows].sort((left, right) => {
      const a = column.sortValue!(left);
      const b = column.sortValue!(right);
      if (typeof a === 'number' && typeof b === 'number') return (a - b) * factor;
      return String(a).localeCompare(String(b)) * factor;
    });
  }, [rows, columns, sortKey, direction]);

  function toggle(key: string) {
    if (key === sortKey) {
      setDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setDirection('desc');
    }
  }

  if (rows.length === 0) {
    return <p className="table-empty">{emptyMessage}</p>;
  }

  return (
    <div className="table-scroll">
      <table className="data-table">
        <caption className="visually-hidden">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => {
              const active = column.key === sortKey;
              const ariaSort = active
                ? direction === 'asc'
                  ? 'ascending'
                  : 'descending'
                : undefined;
              return (
                <th
                  aria-sort={ariaSort}
                  className={[
                    column.numeric ? 'is-numeric' : '',
                    column.secondary ? 'is-secondary' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={column.key}
                  scope="col"
                >
                  {column.sortValue ? (
                    <button
                      className={`table-sort ${active ? 'table-sort--active' : ''}`}
                      onClick={() => toggle(column.key)}
                      type="button"
                    >
                      {column.header}
                      <span aria-hidden="true">
                        {active ? (direction === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  ) : (
                    column.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) => (
                <td
                  className={[
                    column.numeric ? 'is-numeric' : '',
                    column.secondary ? 'is-secondary' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  key={column.key}
                >
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Toggleable quick filters. Each states how many rows it would leave, so none is a blind guess. */
export function FilterChips({
  filters,
  active,
  onToggle,
}: {
  filters: Array<{ key: string; label: string; count: number }>;
  active: string | null;
  onToggle: (key: string | null) => void;
}) {
  return (
    <div className="filter-chips" role="group" aria-label="Quick filters">
      {filters.map((filter) => {
        const isActive = filter.key === active;
        return (
          <button
            aria-pressed={isActive}
            className={`filter-chip ${isActive ? 'filter-chip--active' : ''}`}
            disabled={filter.count === 0 && !isActive}
            key={filter.key}
            onClick={() => onToggle(isActive ? null : filter.key)}
            type="button"
          >
            {filter.label}
            <span>{filter.count}</span>
          </button>
        );
      })}
    </div>
  );
}
