import React, { ReactNode } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { Skeleton } from './Skeleton';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  width?: string;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  isLoading?: boolean;
  emptyState?: ReactNode;
  onRowClick?: (row: T) => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  onSort?: (columnKey: string) => void;
  className?: string;
  dense?: boolean;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  emptyState,
  onRowClick,
  sortColumn,
  sortDirection,
  onSort,
  className = '',
  dense = false,
}: TableProps<T>) {
  const py = dense ? 'py-2' : 'py-3';

  return (
    <div className={`w-full overflow-x-auto rounded-xl border border-zinc-800/90 bg-[#0c1018] ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        {/* Sticky Institutional Table Header */}
        <thead className="bg-[#090d14] border-b border-zinc-800 text-zinc-400 select-none">
          <tr>
            {columns.map((col) => {
              const isSorted = sortColumn === col.key;
              const alignClass = {
                left: 'text-left',
                center: 'text-center',
                right: 'text-right justify-end',
              }[col.align || 'left'];

              return (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={`px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-zinc-400 whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-zinc-200' : ''
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className={`inline-flex items-center gap-1.5 ${alignClass}`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-zinc-500">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-amber-400" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-amber-400" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>

        {/* Table Body */}
        <tbody className="divide-y divide-zinc-800/60 text-zinc-200">
          {isLoading ? (
            // Skeleton Loader Rows
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-4 ${py}`}>
                    <Skeleton className="h-4 w-3/4 rounded" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-zinc-500">
                {emptyState || 'No records found'}
              </td>
            </tr>
          ) : (
            data.map((row, rIdx) => (
              <tr
                key={keyExtractor(row, rIdx)}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors ${
                  onRowClick
                    ? 'hover:bg-[#121824] cursor-pointer active:bg-[#151c2a]'
                    : 'hover:bg-zinc-900/40'
                }`}
              >
                {columns.map((col) => {
                  const alignClass = {
                    left: 'text-left',
                    center: 'text-center',
                    right: 'text-right',
                  }[col.align || 'left'];

                  const val = (row as any)[col.key];

                  return (
                    <td
                      key={col.key}
                      className={`px-4 ${py} ${alignClass} ${col.className || ''}`}
                    >
                      {col.render ? col.render(row, rIdx) : val !== undefined ? String(val) : '—'}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
