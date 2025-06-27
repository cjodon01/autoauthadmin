import React from 'react'
import { Card } from './Card'

interface StatItem {
  label: string
  value: string | number
  icon?: React.ComponentType<any>
  color?: string
  trend?: {
    value: number
    isPositive: boolean
  }
  onClick?: () => void
}

interface StatsGridProps {
  stats: StatItem[]
  columns?: 1 | 2 | 3 | 4
}

export function StatsGrid({ stats, columns = 2 }: StatsGridProps) {
  const gridClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  }

  return (
    <div className={`grid gap-4 ${gridClasses[columns]}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card 
            key={index} 
            hover={!!stat.onClick}
            onClick={stat.onClick}
            className="transition-all duration-200"
          >
            <div className="flex items-center">
              {Icon && (
                <div className={`flex-shrink-0 p-3 rounded-xl mr-4 ${
                  stat.color || 'bg-blue-500'
                }`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-500 truncate">
                  {stat.label}
                </p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </p>
                  {stat.trend && (
                    <span className={`ml-2 text-sm font-medium ${
                      stat.trend.isPositive ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )
      })}
    </div>
  )
}