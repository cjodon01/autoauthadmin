import React from 'react'
import { X } from 'lucide-react'

interface ActionItem {
  label: string
  icon?: React.ComponentType<any>
  onClick: () => void
  variant?: 'default' | 'danger'
}

interface ActionSheetProps {
  isOpen: boolean
  onClose: () => void
  title: string
  actions: ActionItem[]
}

export function ActionSheet({ isOpen, onClose, title, actions }: ActionSheetProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl shadow-xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-2">
          {actions.map((action, index) => {
            const Icon = action.icon
            return (
              <button
                key={index}
                onClick={() => {
                  action.onClick()
                  onClose()
                }}
                className={`flex items-center w-full p-3 text-left rounded-lg transition-colors ${
                  action.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {Icon && (
                  <Icon className="h-5 w-5 mr-3" />
                )}
                <span className="font-medium">{action.label}</span>
              </button>
            )
          })}
        </div>
        
        {/* Safe area for devices with home indicator */}
        <div className="h-safe-area-inset-bottom" />
      </div>
    </div>
  )
}