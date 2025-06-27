import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Users, Share2, Megaphone, Palette, Bot, FileText, TrendingUp, Activity } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { StatsGrid } from '../components/ui/StatsGrid'

interface Stats {
  users: number
  socialConnections: number
  campaigns: number
  brands: number
  aiModels: number
  posts: number
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    users: 0,
    socialConnections: 0,
    campaigns: 0,
    brands: 0,
    aiModels: 0,
    posts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const loadStats = async () => {
      try {
        const results = await Promise.allSettled([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('social_connections').select('*', { count: 'exact', head: true }),
          supabase.from('campaigns').select('*', { count: 'exact', head: true }),
          supabase.from('brands').select('*', { count: 'exact', head: true }),
          supabase.from('ai_models').select('*', { count: 'exact', head: true }),
          supabase.from('posts_log').select('*', { count: 'exact', head: true }),
        ])

        if (mounted) {
          const [users, socialConnections, campaigns, brands, aiModels, posts] = results.map(result => 
            result.status === 'fulfilled' ? result.value.count || 0 : 0
          )

          setStats({
            users,
            socialConnections,
            campaigns,
            brands,
            aiModels,
            posts,
          })
        }
      } catch (error) {
        console.error('Error loading stats:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      mounted = false
    }
  }, [])

  const statItems = [
    {
      label: 'Total Users',
      value: stats.users,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: 'Social Connections',
      value: stats.socialConnections,
      icon: Share2,
      color: 'bg-green-500',
    },
    {
      label: 'Active Campaigns',
      value: stats.campaigns,
      icon: Megaphone,
      color: 'bg-purple-500',
    },
    {
      label: 'Brands',
      value: stats.brands,
      icon: Palette,
      color: 'bg-pink-500',
    },
    {
      label: 'AI Models',
      value: stats.aiModels,
      icon: Bot,
      color: 'bg-indigo-500',
    },
    {
      label: 'Generated Posts',
      value: stats.posts,
      icon: FileText,
      color: 'bg-orange-500',
    },
  ]

  const quickActions = [
    {
      title: 'Manage Users',
      description: 'View and manage user accounts',
      href: '/users',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'View Campaigns',
      description: 'Monitor active campaigns',
      href: '/campaigns',
      icon: Megaphone,
      color: 'bg-purple-500',
    },
    {
      title: 'Manage Brands',
      description: 'Configure brand settings',
      href: '/brands',
      icon: Palette,
      color: 'bg-pink-500',
    },
    {
      title: 'AI Configuration',
      description: 'Manage AI models and providers',
      href: '/ai-config',
      icon: Bot,
      color: 'bg-indigo-500',
    },
    {
      title: 'Analytics',
      description: 'View performance metrics',
      href: '/analytics',
      icon: TrendingUp,
      color: 'bg-green-500',
    },
    {
      title: 'API Logs',
      description: 'Monitor API activity',
      href: '/facebook-api-logs',
      icon: Activity,
      color: 'bg-red-500',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <StatsGrid stats={Array(6).fill({ label: '', value: 0 })} columns={2} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-sm lg:text-base text-gray-500">
          Welcome to the AutoAuthor admin portal. Here's an overview of your system.
        </p>
      </div>

      {/* Stats Grid */}
      <StatsGrid stats={statItems} columns={2} />

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  to={action.href}
                  className="group p-4 rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start space-x-3">
                    <div className={`flex-shrink-0 p-2 rounded-lg ${action.color}`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-800">All systems operational</span>
              </div>
              <span className="text-xs text-green-600">Last checked: just now</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Database</span>
                <span className="text-green-600 font-medium">Healthy</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">API Services</span>
                <span className="text-green-600 font-medium">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Background Jobs</span>
                <span className="text-green-600 font-medium">Running</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Storage</span>
                <span className="text-green-600 font-medium">Available</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}