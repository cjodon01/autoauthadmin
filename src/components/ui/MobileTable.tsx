import React from 'react'
import { Card } from './Card'

interface Column<T> {
  key: keyof T | string
  label: string
  render?: (item: T) => React.ReactNode
  mobileLabel?: string
  priority?: 'high' | 'medium' | 'low'
}

interface MobileTableProps<T> {
  data: T[]
  columns: Column<T>[]
  loading?: boolean
  onItemClick?: (item: T) => void
  emptyMessage?: string
}

export function MobileTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  onItemClick,
  emptyMessage = 'No data available'
}: MobileTableProps<T>) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card className="text-center py-12">
        <div className="text-gray-400 mb-2">
          <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm">{emptyMessage}</p>
      </Card>
    )
  }

  // Get high priority columns for mobile display
  const highPriorityColumns = columns.filter(col => col.priority === 'high' || !col.priority)
  const mediumPriorityColumns = columns.filter(col => col.priority === 'medium')

  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <Card 
          key={item.id || index} 
          hover={!!onItemClick}
          onClick={() => onItemClick?.(item)}
          className="transition-all duration-200"
        >
          <div className="space-y-3">
            {/* High priority fields - always shown */}
            {highPriorityColumns.map((column) => {
              const value = column.render 
                ? column.render(item) 
                : String(item[column.key] || '-')
              
              return (
                <div key={String(column.key)} className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-500 min-w-0 flex-1">
                    {column.mobileLabel || column.label}
                  </span>
                  <div className="text-sm text-gray-900 text-right min-w-0 flex-1">
                    {value}
                  </div>
                </div>
              )
            })}

            {/* Medium priority fields - shown on larger mobile screens */}
            {mediumPriorityColumns.length > 0 && (
              <div className="hidden sm:block space-y-2 pt-2 border-t border-gray-100">
                {mediumPriorityColumns.map((column) => {
                  const value = column.render 
                    ? column.render(item) 
                    : String(item[column.key] || '-')
                  
                  return (
                    <div key={String(column.key)} className="flex justify-between items-start">
                      <span className="text-xs font-medium text-gray-400">
                        {column.mobileLabel || column.label}
                      </span>
                      <div className="text-xs text-gray-600 text-right">
                        {value}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Card>
      ))}
    </div>
  )
}