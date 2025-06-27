import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { RefreshCw, Search, Facebook } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface FacebookAccount {
  id: string
  user_id: string
  page_id: string
  page_name: string
  page_access_token: string
  page_token_expires_at?: string
  created_at: string
  profiles?: {
    brand_name: string
    email: string
  }
}

export function FacebookAccounts() {
  const [accounts, setAccounts] = useState<FacebookAccount[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<FacebookAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadAccounts()
  }, [])

  useEffect(() => {
    filterAccounts()
  }, [accounts, searchTerm])

  const loadAccounts = async () => {
    try {
      const { data, error } = await supabase
        .from('social_pages')
        .select(`
          *,
          profiles!social_pages_user_id_fkey(brand_name, email)
        `)
        .eq('provider', 'facebook')
        .order('created_at', { ascending: false })

      if (error) throw error
      setAccounts(data || [])
    } catch (error: any) {
      toast.error('Failed to load Facebook accounts')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const filterAccounts = () => {
    if (!searchTerm) {
      setFilteredAccounts(accounts)
      return
    }

    const filtered = accounts.filter(account => 
      account.page_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.profiles?.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredAccounts(filtered)
  }

  const truncateToken = (token: string) => {
    if (!token || token.length < 10) return token
    return `${token.substring(0, 6)}...${token.substring(token.length - 4)}`
  }

  const getTokenStatus = (expiresAt?: string) => {
    if (!expiresAt) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">No Expiry</span>
    }

    const expiry = new Date(expiresAt)
    const now = new Date()
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiry < 0) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Expired</span>
    } else if (daysUntilExpiry < 7) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Expires Soon</span>
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
    }
  }

  const columns = [
    {
      key: 'user',
      label: 'User',
      render: (account: FacebookAccount) => (
        <div>
          <div className="font-medium">{account.profiles?.brand_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{account.profiles?.email || '-'}</div>
          <div className="text-xs text-gray-400">ID: {account.user_id}</div>
        </div>
      ),
    },
    {
      key: 'page_name',
      label: 'Facebook Page',
      render: (account: FacebookAccount) => (
        <div>
          <div className="flex items-center space-x-2">
            <Facebook className="h-4 w-4 text-blue-600" />
            <span className="font-medium">{account.page_name}</span>
          </div>
          <div className="text-sm text-gray-500">Page ID: {account.page_id}</div>
        </div>
      ),
    },
    {
      key: 'access_token',
      label: 'Access Token',
      render: (account: FacebookAccount) => (
        <div className="font-mono text-sm">
          {truncateToken(account.page_access_token)}
        </div>
      ),
    },
    {
      key: 'token_status',
      label: 'Token Status',
      render: (account: FacebookAccount) => getTokenStatus(account.page_token_expires_at),
    },
    {
      key: 'expires_at',
      label: 'Token Expires',
      render: (account: FacebookAccount) => 
        account.page_token_expires_at 
          ? format(new Date(account.page_token_expires_at), 'MMM d, yyyy HH:mm')
          : 'Never',
    },
    {
      key: 'connected_at',
      label: 'Connected',
      render: (account: FacebookAccount) => format(new Date(account.created_at), 'MMM d, yyyy'),
    },
  ]

  const stats = {
    total: accounts.length,
    active: accounts.filter(a => !a.page_token_expires_at || new Date(a.page_token_expires_at) > new Date()).length,
    expired: accounts.filter(a => a.page_token_expires_at && new Date(a.page_token_expires_at) <= new Date()).length,
    expiringSoon: accounts.filter(a => {
      if (!a.page_token_expires_at) return false
      const expiry = new Date(a.page_token_expires_at)
      const now = new Date()
      const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry >= 0 && daysUntilExpiry < 7
    }).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connected Facebook Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor all Facebook page connections and token status
          </p>
        </div>
        <Button onClick={loadAccounts} variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <Facebook className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Accounts</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">⚠</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expiring Soon</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.expiringSoon}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✗</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Expired</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.expired}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                placeholder="Search by user name, email, or page name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          {searchTerm && (
            <Button
              variant="secondary"
              onClick={() => setSearchTerm('')}
            >
              Clear
            </Button>
          )}
        </div>
        {searchTerm && (
          <div className="mt-2 text-sm text-gray-600">
            Showing {filteredAccounts.length} of {accounts.length} accounts
          </div>
        )}
      </div>

      <Table
        data={filteredAccounts}
        columns={columns}
        loading={loading}
      />
    </div>
  )
}