import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { Users, Share2, Megaphone, Palette, Bot, FileText } from 'lucide-react'

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
        // Use Promise.allSettled to prevent one failed request from breaking others
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

  const statCards = [
    {
      name: 'Total Users',
      value: stats.users,
      icon: Users,
      href: '/users',
      color: 'bg-blue-500',
    },
    {
      name: 'Social Connections',
      value: stats.socialConnections,
      icon: Share2,
      href: '/social-connections',
      color: 'bg-green-500',
    },
    {
      name: 'Active Campaigns',
      value: stats.campaigns,
      icon: Megaphone,
      href: '/campaigns',
      color: 'bg-purple-500',
    },
    {
      name: 'Brands',
      value: stats.brands,
      icon: Palette,
      href: '/brands',
      color: 'bg-pink-500',
    },
    {
      name: 'AI Models',
      value: stats.aiModels,
      icon: Bot,
      href: '/ai-config',
      color: 'bg-indigo-500',
    },
    {
      name: 'Generated Posts',
      value: stats.posts,
      icon: FileText,
      href: '/content-log',
      color: 'bg-orange-500',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to the AutoAuthor admin portal. Here's an overview of your system.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Link
              key={card.name}
              to={card.href}
              className="relative overflow-hidden rounded-lg bg-white px-4 py-5 shadow hover:shadow-md transition-shadow sm:px-6"
            >
              <div>
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`inline-flex items-center justify-center p-3 rounded-md ${card.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {card.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {card.value.toLocaleString()}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Quick Actions
          </h3>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/users"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              <Users className="mr-2 h-4 w-4" />
              Manage Users
            </Link>
            <Link
              to="/campaigns"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              View Campaigns
            </Link>
            <Link
              to="/brands"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              <Palette className="mr-2 h-4 w-4" />
              Manage Brands
            </Link>
            <Link
              to="/ai-config"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-700 bg-primary-100 hover:bg-primary-200"
            >
              <Bot className="mr-2 h-4 w-4" />
              AI Configuration
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}