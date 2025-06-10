import { useEffect, useState } from 'react'
import { supabase, type SocialConnection } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function SocialConnections() {
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadConnections()
  }, [])

  const loadConnections = async () => {
    try {
      const { data, error } = await supabase
        .from('social_connections')
        .select(`
          *,
          profiles!social_connections_user_id_fkey(brand_name, email)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setConnections(data || [])
    } catch (error: any) {
      toast.error('Failed to load social connections')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (connection: SocialConnection) => {
    if (!confirm('Are you sure you want to delete this connection?')) return

    try {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connection.id)

      if (error) throw error
      toast.success('Connection deleted successfully')
      loadConnections()
    } catch (error: any) {
      toast.error('Failed to delete connection')
      console.error(error)
    }
  }

  const getProviderIcon = (provider: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
    }
    return icons[provider as keyof typeof icons] || '🔗'
  }

  const columns = [
    {
      key: 'provider',
      label: 'Provider',
      render: (connection: SocialConnection) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getProviderIcon(connection.provider)}</span>
          <span className="capitalize">{connection.provider}</span>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (connection: any) => (
        <div>
          <div className="font-medium">{connection.profiles?.brand_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{connection.profiles?.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'account_id',
      label: 'Account ID',
      render: (connection: SocialConnection) => connection.account_id || '-',
    },
    {
      key: 'token_expires_at',
      label: 'Token Expires',
      render: (connection: SocialConnection) => 
        connection.token_expires_at 
          ? format(new Date(connection.token_expires_at), 'MMM d, yyyy HH:mm')
          : 'Never',
    },
    {
      key: 'created_at',
      label: 'Connected',
      render: (connection: SocialConnection) => format(new Date(connection.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (connection: SocialConnection) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(connection)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Connections</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage OAuth connections to social media platforms
          </p>
        </div>
        <Button onClick={loadConnections} variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        {['facebook', 'instagram', 'twitter', 'linkedin'].map((provider) => {
          const count = connections.filter(c => c.provider === provider).length
          return (
            <div key={provider} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{getProviderIcon(provider)}</span>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate capitalize">
                        {provider}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {count} connections
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <Table
        data={connections}
        columns={columns}
        loading={loading}
      />
    </div>
  )
}