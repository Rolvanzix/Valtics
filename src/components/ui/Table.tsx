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
    <div className={`w-full overflow-x-auto rounded-xl border border-[#670CDC]/25 bg-[#140130] ${className}`}>
      <table className="w-full text-left text-xs border-collapse">
        {/* Sticky Institutional Table Header */}
        <thead className="bg-[#100126] border-b border-[#670CDC]/25 text-[#B8A9CC] select-none">
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
                  className={`px-4 py-3 font-semibold text-[11px] uppercase tracking-wider text-[#B8A9CC] whitespace-nowrap ${
                    col.sortable ? 'cursor-pointer hover:text-[#F7F3FF]' : ''
                  } ${col.className || ''}`}
                  onClick={() => col.sortable && onSort?.(col.key)}
                >
                  <div className={`inline-flex items-center gap-1.5 ${alignClass}`}>
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-[#7E6D96]">
                        {isSorted ? (
                          sortDirection === 'asc' ? (
                            <ChevronUp className="w-3 h-3 text-[#F99225]" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-[#F99225]" />
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
        <tbody className="divide-y divide-[#670CDC]/15 text-[#F7F3FF]">
          {isLoading ? (
            // Skeleton Loader Rows
            Array.from({ length: 5 }).map((_, rIdx) => (
              <tr key={rIdx} className="animate-pulse">
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-4 ${py}`}>
                    <Skeleton className="h-4 w-3/4 rounded bg-[#1C0142]" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-[#7E6D96]">
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
                    ? 'hover:bg-[#1E0247] cursor-pointer active:bg-[#250355]'
                    : 'hover:bg-[#1A023E]/50'
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
