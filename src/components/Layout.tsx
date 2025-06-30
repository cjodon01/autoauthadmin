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
  Search,
  Bell,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'

interface NavigationItem {
  name: string
  href?: string
  icon: React.ComponentType<any>
  badge?: string
  children?: NavigationItem[]
  color?: string
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: Home, color: 'bg-blue-500' },
  {
    name: 'Users',
    icon: Users,
    color: 'bg-green-500',
    children: [
      { name: 'User Profiles', href: '/users', icon: Users },
      { name: 'User Management', href: '/user-management', icon: UserCog },
    ]
  },
  {
    name: 'Social Media',
    icon: Share2,
    color: 'bg-purple-500',
    children: [
      { name: 'Social Connections', href: '/social-connections', icon: Share2 },
      { name: 'Social Pages', href: '/social-pages', icon: Globe },
      { name: 'Campaigns', href: '/campaigns', icon: Megaphone },
      { name: 'Content Log', href: '/content-log', icon: FileText },
      { name: 'Analytics', href: '/analytics', icon: TrendingUp },
    ]
  },
  { name: 'Brands', href: '/brands', icon: Palette, color: 'bg-pink-500' },
  { name: 'AI Configuration', href: '/ai-config', icon: Bot, color: 'bg-indigo-500' },
  {
    name: 'Surveys',
    icon: BarChart3,
    color: 'bg-orange-500',
    children: [
      { name: 'Survey Data', href: '/surveys', icon: BarChart3 },
      { name: 'Survey Management', href: '/survey-management', icon: Settings },
    ]
  },
  {
    name: 'Facebook Review',
    icon: Facebook,
    badge: 'FB Review',
    color: 'bg-blue-600',
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
  const [expandedGroups, setExpandedGroups] = useState<string[]>([])
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
        <div key={item.name} className="mb-2">
          <button
            onClick={() => toggleGroup(item.name)}
            className={`group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              isGroupActiveState
                ? 'bg-primary-100 text-primary-900 shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <div className={`inline-flex items-center justify-center p-2 rounded-lg mr-3 ${
              item.color || 'bg-gray-100'
            }`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <span className="flex-1 text-left">{item.name}</span>
            {item.badge && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
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
            <div className="ml-4 mt-2 space-y-1 border-l-2 border-gray-100 pl-4">
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
        className={`group flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 mb-2 ${
          isChild ? 'ml-2' : ''
        } ${
          isActive
            ? 'bg-primary-100 text-primary-900 shadow-sm'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        }`}
      >
        <div className={`inline-flex items-center justify-center p-2 rounded-lg mr-3 ${
          item.color || 'bg-gray-100'
        }`}>
          <Icon className="h-5 w-5 text-white" />
        </div>
        <span className="flex-1">{item.name}</span>
        {item.badge && (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {item.badge}
          </span>
        )}
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile sidebar header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">AA</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AutoAuthor</h1>
                <p className="text-xs text-gray-500">Admin Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Mobile navigation - scrollable with proper height */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <nav className="px-4 py-6">
              {navigation.map(item => renderNavigationItem(item))}
            </nav>
          </div>

          {/* Mobile user section */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm h-full">
          {/* Desktop header */}
          <div className="flex items-center px-6 py-6 flex-shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold">AA</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AutoAuthor</h1>
                <p className="text-sm text-gray-500">Admin Portal</p>
              </div>
            </div>
          </div>

          {/* Desktop navigation - scrollable with proper height */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <nav className="px-4 pb-4">
              {navigation.map(item => renderNavigationItem(item))}
            </nav>
          </div>

          {/* Desktop user section */}
          <div className="p-4 border-t border-gray-200 flex-shrink-0">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">Administrator</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Mobile top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm lg:hidden">
          <button
            type="button"
            className="p-2 text-gray-700 rounded-lg hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1 flex items-center justify-center">
            <h1 className="text-lg font-semibold text-gray-900">AutoAuthor Admin</h1>
          </div>

          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Search className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <Bell className="h-5 w-5" />
            </button>
            {/* Built with Bolt badge - Mobile */}
            <a
              href="https://bolt.new"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-8 h-8 rounded-full bg-black hover:bg-gray-800 transition-colors"
              title="Built with Bolt"
            >
              <img
                src="/image.png"
                alt="Built with Bolt"
                className="w-6 h-6"
              />
            </a>
          </div>
        </div>

        {/* Desktop top bar */}
        <div className="hidden lg:sticky lg:top-0 lg:z-40 lg:flex lg:h-16 lg:shrink-0 lg:items-center lg:gap-x-4 lg:border-b lg:border-gray-200 lg:bg-white lg:px-6 lg:shadow-sm">
          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="relative flex flex-1 items-center">
              <Search className="pointer-events-none absolute left-4 h-5 w-5 text-gray-400" />
              <input
                className="block h-full w-full border-0 py-0 pl-12 pr-0 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm bg-transparent"
                placeholder="Search..."
                type="search"
              />
            </div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>
              {/* Built with Bolt badge - Desktop */}
              <a
                href="https://bolt.new"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-black hover:bg-gray-800 transition-colors"
                title="Built with Bolt"
              >
                <img
                  src="/image.png"
                  alt="Built with Bolt"
                  className="w-8 h-8"
                />
              </a>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-4 lg:py-8">
          <div className="px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}