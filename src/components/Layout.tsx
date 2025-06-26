import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import {
  Menu,
  X,
  Home,
  Users,
  UserCog,
  Share2,
  Globe,
  Megaphone,
  Palette,
  Bot,
  FileText,
  LogOut,
  Settings,
  BarChart3,
  TrendingUp,
  Facebook,
  Activity,
  Send,
  ChevronRight,
  ChevronDown,
  TestTube,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<any>
  badge?: string
  children?: NavigationItem[]
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  {
    name: 'Users',
    icon: Users,
    children: [
      { name: 'User Profiles', href: '/users', icon: Users },
      { name: 'User Management', href: '/user-management', icon: UserCog },
    ]
  },
  {
    name: 'Social Media',
    icon: Share2,
    children: [
      { name: 'Social Connections', href: '/social-connections', icon: Share2 },
      { name: 'Social Pages', href: '/social-pages', icon: Globe },
      { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
      { name: 'Content Log', href: '/content-log', icon: FileText },
      { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    ]
  },
  { name: 'Brands', href: '/brands', icon: Palette },
  { name: 'AI Configuration', href: '/ai-config', icon: Bot },
  {
    name: 'Surveys',
    icon: BarChart3,
    children: [
      { name: 'Survey Data', href: '/surveys', icon: BarChart3 },
      { name: 'Survey Management', href: '/survey-management', icon: Settings },
    ]
  },
  {
    name: 'Facebook Review',
    icon: Facebook,
    badge: 'FB Review',
    children: [
      { 
        name: 'Facebook Accounts', 
        href: '/facebook-accounts', 
        icon: Facebook,
        badge: 'FB Review'
      },
      { 
        name: 'Facebook API Logs', 
        href: '/facebook-api-logs', 
        icon: Activity,
        badge: 'FB Review'
      },
      { 
        name: 'Manual Post Trigger', 
        href: '/manual-post-trigger', 
        icon: Send,
        badge: 'FB Review'
      },
      { 
        name: 'API Tester', 
        href: '/api-tester', 
        icon: TestTube,
        badge: 'FB Review'
      },
    ]
  },
]

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['Social Media', 'Facebook Review'])
  const { user, signOut } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const handleSignOut = () => {
    signOut()
    navigate('/login')
    toast.success('Signed out successfully')
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  const isGroupExpanded = (groupName: string) => expandedGroups.includes(groupName)

  const isActiveRoute = (href?: string) => {
    if (!href) return false
    return location.pathname === href
  }

  const isGroupActive = (children?: NavigationItem[]) => {
    if (!children) return false
    return children.some(child => isActiveRoute(child.href))
  }

  const renderNavigationItem = (item: NavigationItem, isChild = false) => {
    const Icon = item.icon
    const hasChildren = item.children && item.children.length > 0
    const isExpanded = isGroupExpanded(item.name)
    const isActive = isActiveRoute(item.href)
    const isGroupActiveState = isGroupActive(item.children)

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleGroup(item.name)}
            className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md ${
              isGroupActiveState
                ? 'bg-primary-100 text-primary-900'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
            <span className="flex-1 text-left">{item.name}</span>
            {item.badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                {item.badge}
              </span>
            )}
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children?.map(child => renderNavigationItem(child, true))}
            </div>
          )}
        </div>
      )
    }

    return (
      <Link
        key={item.name}
        to={item.href!}
        onClick={() => setSidebarOpen(false)}
        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
          isChild ? 'ml-2' : ''
        } ${
          isActive
            ? 'bg-primary-100 text-primary-900'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? '' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-gray-900">AutoAuthor Admin</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map(item => renderNavigationItem(item))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-gray-900">AutoAuthor Admin</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {navigation.map(item => renderNavigationItem(item))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1" />
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-2">
                <span className="text-sm text-gray-700">{user?.email}</span>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-x-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}