import React from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
}

interface TableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
}

export function Table<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  sortKey,
  sortDirection,
  onSort,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
        ))}
      </div>
    )
  }

  return (
    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                <div className="flex items-center space-x-1">
                  <span>{column.label}</span>
                  {column.sortable && onSort && (
                    <button
                      onClick={() => onSort(String(column.key))}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {sortKey === column.key ? (
                        sortDirection === 'asc' ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )
                      ) : (
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      )}
                    </button>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, index) => (
            <tr key={item.id || index} className="hover:bg-gray-50">
              {columns.map((column) => (
                <td
                  key={String(column.key)}
                  className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                >
                  {column.render
                    ? column.render(item)
                    : String(item[column.key] || '-')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No data available</p>
        </div>
      )}
    </div>
  )
}