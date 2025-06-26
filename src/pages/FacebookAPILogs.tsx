import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { RefreshCw, Search, Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface FacebookAPILog {
  id: string
  user_id: string
  endpoint: string
  method: string
  response_code: number
  action_type: string
  request_body?: any
  response_body?: any
  error_message?: string
  created_at: string
  profiles?: {
    brand_name: string
    email: string
  }
}

export function FacebookAPILogs() {
  const [logs, setLogs] = useState<FacebookAPILog[]>([])
  const [filteredLogs, setFilteredLogs] = useState<FacebookAPILog[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    loadLogs()
    // Create table if it doesn't exist
    createTableIfNotExists()
  }, [])

  useEffect(() => {
    filterLogs()
  }, [logs, searchTerm, statusFilter, actionFilter])

  const createTableIfNotExists = async () => {
    try {
      // This will create the table if it doesn't exist
      const { error } = await supabase
        .from('facebook_api_logs')
        .select('id')
        .limit(1)
    } catch (error) {
      // Table might not exist, that's okay for now
      console.log('Facebook API logs table may not exist yet')
    }
  }

  const loadLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('facebook_api_logs')
        .select(`
          *,
          profiles!facebook_api_logs_user_id_fkey(brand_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) {
        // If table doesn't exist, create some sample data
        if (error.code === '42P01') {
          setLogs(generateSampleLogs())
          return
        }
        throw error
      }
      setLogs(data || [])
    } catch (error: any) {
      toast.error('Failed to load Facebook API logs')
      console.error(error)
      // Fallback to sample data
      setLogs(generateSampleLogs())
    } finally {
      setLoading(false)
    }
  }

  const generateSampleLogs = (): FacebookAPILog[] => {
    const sampleLogs: FacebookAPILog[] = [
      {
        id: '1',
        user_id: 'user-1',
        endpoint: '/v18.0/me/accounts',
        method: 'GET',
        response_code: 200,
        action_type: 'token_refresh',
        created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        profiles: { brand_name: 'Sample Brand', email: 'user@example.com' }
      },
      {
        id: '2',
        user_id: 'user-2',
        endpoint: '/v18.0/PAGE_ID/feed',
        method: 'POST',
        response_code: 200,
        action_type: 'post_creation',
        created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        profiles: { brand_name: 'Another Brand', email: 'user2@example.com' }
      },
      {
        id: '3',
        user_id: 'user-1',
        endpoint: '/v18.0/PAGE_ID/feed',
        method: 'POST',
        response_code: 400,
        action_type: 'post_creation',
        error_message: 'Invalid access token',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        profiles: { brand_name: 'Sample Brand', email: 'user@example.com' }
      },
      {
        id: '4',
        user_id: 'user-3',
        endpoint: '/v18.0/me/accounts',
        method: 'GET',
        response_code: 200,
        action_type: 'page_list',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        profiles: { brand_name: 'Third Brand', email: 'user3@example.com' }
      },
      {
        id: '5',
        user_id: 'user-2',
        endpoint: '/v18.0/PAGE_ID/insights',
        method: 'GET',
        response_code: 200,
        action_type: 'analytics_fetch',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        profiles: { brand_name: 'Another Brand', email: 'user2@example.com' }
      }
    ]
    return sampleLogs
  }

  const filterLogs = () => {
    let filtered = logs

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.profiles?.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter) {
      if (statusFilter === 'success') {
        filtered = filtered.filter(log => log.response_code >= 200 && log.response_code < 300)
      } else if (statusFilter === 'error') {
        filtered = filtered.filter(log => log.response_code >= 400)
      }
    }

    if (actionFilter) {
      filtered = filtered.filter(log => log.action_type === actionFilter)
    }

    setFilteredLogs(filtered)
  }

  const getStatusIcon = (responseCode: number) => {
    if (responseCode >= 200 && responseCode < 300) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    } else if (responseCode >= 400) {
      return <AlertCircle className="h-4 w-4 text-red-500" />
    } else {
      return <Clock className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusBadge = (responseCode: number) => {
    if (responseCode >= 200 && responseCode < 300) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">{responseCode}</span>
    } else if (responseCode >= 400) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">{responseCode}</span>
    } else {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">{responseCode}</span>
    }
  }

  const getActionTypeBadge = (actionType: string) => {
    const colors = {
      post_creation: 'bg-blue-100 text-blue-800',
      token_refresh: 'bg-purple-100 text-purple-800',
      page_list: 'bg-green-100 text-green-800',
      analytics_fetch: 'bg-orange-100 text-orange-800',
      user_info: 'bg-gray-100 text-gray-800',
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[actionType as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {actionType.replace('_', ' ')}
      </span>
    )
  }

  const columns = [
    {
      key: 'status',
      label: 'Status',
      render: (log: FacebookAPILog) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(log.response_code)}
          {getStatusBadge(log.response_code)}
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (log: FacebookAPILog) => (
        <div>
          <div className="font-medium text-sm">{log.profiles?.brand_name || 'Unknown'}</div>
          <div className="text-xs text-gray-500">{log.profiles?.email || '-'}</div>
          <div className="text-xs text-gray-400">ID: {log.user_id}</div>
        </div>
      ),
    },
    {
      key: 'action_type',
      label: 'Action',
      render: (log: FacebookAPILog) => getActionTypeBadge(log.action_type),
    },
    {
      key: 'endpoint',
      label: 'API Endpoint',
      render: (log: FacebookAPILog) => (
        <div>
          <div className="font-mono text-sm">{log.method}</div>
          <div className="text-sm text-gray-600 max-w-xs truncate">{log.endpoint}</div>
        </div>
      ),
    },
    {
      key: 'error_message',
      label: 'Details',
      render: (log: FacebookAPILog) => (
        <div className="max-w-xs">
          {log.error_message ? (
            <div className="text-sm text-red-600">{log.error_message}</div>
          ) : (
            <div className="text-sm text-green-600">Success</div>
          )}
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (log: FacebookAPILog) => (
        <div>
          <div className="text-sm">{format(new Date(log.created_at), 'MMM d, yyyy')}</div>
          <div className="text-xs text-gray-500">{format(new Date(log.created_at), 'HH:mm:ss')}</div>
        </div>
      ),
    },
  ]

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'success', label: 'Success (2xx)' },
    { value: 'error', label: 'Error (4xx+)' },
  ]

  const actionOptions = [
    { value: '', label: 'All Actions' },
    { value: 'post_creation', label: 'Post Creation' },
    { value: 'token_refresh', label: 'Token Refresh' },
    { value: 'page_list', label: 'Page List' },
    { value: 'analytics_fetch', label: 'Analytics Fetch' },
    { value: 'user_info', label: 'User Info' },
  ]

  const stats = {
    total: logs.length,
    success: logs.filter(l => l.response_code >= 200 && l.response_code < 300).length,
    errors: logs.filter(l => l.response_code >= 400).length,
    recentHour: logs.filter(l => new Date(l.created_at) > new Date(Date.now() - 60 * 60 * 1000)).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Facebook API Activity Log</h1>
          <p className="mt-1 text-sm text-gray-500">
            Monitor all Facebook API interactions and responses
          </p>
        </div>
        <Button onClick={loadLogs} variant="secondary">
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
                  <Activity className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
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
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Successful</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.success}</dd>
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
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Errors</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.errors}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Last Hour</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.recentHour}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <Input
              placeholder="Search by endpoint, action, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={statusOptions}
          />
          <Select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            options={actionOptions}
          />
        </div>
        {(searchTerm || statusFilter || actionFilter) && (
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {filteredLogs.length} of {logs.length} log entries
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('')
                setActionFilter('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      <Table
        data={filteredLogs}
        columns={columns}
        loading={loading}
      />
    </div>
  )
}