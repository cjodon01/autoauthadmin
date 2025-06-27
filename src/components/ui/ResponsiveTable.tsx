import React from 'react'
import { Table } from './Table'
import { MobileTable } from './MobileTable'

interface Column<T> {
  key: keyof T | string
  label: string
  sortable?: boolean
  render?: (item: T) => React.ReactNode
  mobileLabel?: string
  priority?: 'high' | 'medium' | 'low'
}

interface ResponsiveTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  sortKey?: string
  sortDirection?: 'asc' | 'desc'
  onSort?: (key: string) => void
  onItemClick?: (item: T) => void
  emptyMessage?: string
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  sortKey,
  sortDirection,
  onSort,
  onItemClick,
  emptyMessage
}: ResponsiveTableProps<T>) {
  return (
    <>
      {/* Desktop Table */}
      <div className="hidden lg:block">
        <Table
          data={data}
          columns={columns}
          loading={loading}
          sortKey={sortKey}
          sortDirection={sortDirection}
          onSort={onSort}
        />
      </div>

      {/* Mobile Table */}
      <div className="lg:hidden">
        <MobileTable
          data={data}
          columns={columns}
          loading={loading}
          onItemClick={onItemClick}
          emptyMessage={emptyMessage}
        />
      </div>
    </>
  )
}