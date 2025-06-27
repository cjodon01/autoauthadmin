import { useState } from 'react'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Modal } from '../components/ui/Modal'
import { Table } from '../components/ui/Table'
import { 
  Play, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  MessageSquare,
  Settings,
  Globe,
  User
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useSocialConnections, useSocialPages } from '../hooks/useDataLoader'
import { supabase } from '../lib/supabase'

interface APITestLog {
  id: string
  timestamp: string
  platform: string
  feature: string
  endpoint: string
  account_name: string
  page_name?: string
  status: 'success' | 'error' | 'pending'
  response_summary: string
  full_response?: any
  error_message?: string
}

const PLATFORM_FEATURES = {
  facebook: [
    { value: 'list_pages', label: 'List User Pages', requiresPage: false, scope: 'account' },
    { value: 'list_posts', label: 'List User Posts', requiresPage: false, scope: 'account' },
    { value: 'list_page_posts', label: 'List Page Posts', requiresPage: true, scope: 'page' },
    { value: 'post_to_feed', label: 'Post to User Feed', requiresPage: false, scope: 'account' },
    { value: 'post_to_page', label: 'Post to Page', requiresPage: true, scope: 'page' },
    { value: 'get_engagements', label: 'Get User Post Engagements', requiresPage: false, scope: 'account' },
    { value: 'get_page_engagements', label: 'Get Page Post Engagements', requiresPage: true, scope: 'page' },
    { value: 'get_insights', label: 'Get User Post Insights', requiresPage: false, scope: 'account' },
    { value: 'get_page_insights', label: 'Get Page Insights', requiresPage: true, scope: 'page' },
  ],
  instagram: [
    { value: 'list_pages', label: 'List User Pages', requiresPage: false, scope: 'account' },
    { value: 'list_posts', label: 'List User Posts', requiresPage: false, scope: 'account' },
    { value: 'list_page_posts', label: 'List Page Posts', requiresPage: true, scope: 'page' },
    { value: 'post_to_page', label: 'Post to Page', requiresPage: true, scope: 'page' },
    { value: 'get_engagements', label: 'Get User Post Engagements', requiresPage: false, scope: 'account' },
    { value: 'get_page_engagements', label: 'Get Page Post Engagements', requiresPage: true, scope: 'page' },
    { value: 'get_insights', label: 'Get User Post Insights', requiresPage: false, scope: 'account' },
    { value: 'get_page_insights', label: 'Get Page Insights', requiresPage: true, scope: 'page' },
  ],
  linkedin: [
    { value: 'list_organizations', label: 'List Organizations', requiresPage: false, scope: 'account' },
    { value: 'list_posts', label: 'List User Posts', requiresPage: false, scope: 'account' },
    { value: 'post_to_organization', label: 'Post to Organization', requiresPage: true, scope: 'page' },
    { value: 'get_engagements', label: 'Get Post Engagements', requiresPage: false, scope: 'account' },
  ],
  twitter: [
    { value: 'list_tweets', label: 'List Recent Tweets', requiresPage: false, scope: 'account' },
    { value: 'post_tweet', label: 'Post a Tweet', requiresPage: false, scope: 'account' },
    { value: 'get_engagements', label: 'Get Tweet Engagements', requiresPage: false, scope: 'account' },
  ],
  reddit: [
    { value: 'list_subreddits', label: 'List User Subreddits', requiresPage: false, scope: 'account' },
    { value: 'list_posts', label: 'List Recent Posts', requiresPage: false, scope: 'account' },
    { value: 'post_to_subreddit', label: 'Post to Subreddit', requiresPage: true, scope: 'page' },
    { value: 'get_engagements', label: 'Get Post Engagements', requiresPage: false, scope: 'account' },
  ],
}

export function APITester() {
  const { data: connections, loading: connectionsLoading, refresh: refreshConnections } = useSocialConnections()
  const { data: pages, loading: pagesLoading, refresh: refreshPages } = useSocialPages()
  
  const [testLogs, setTestLogs] = useState<APITestLog[]>([])
  const [testing, setTesting] = useState(false)
  const [selectedLog, setSelectedLog] = useState<APITestLog | null>(null)
  const [logModalOpen, setLogModalOpen] = useState(false)

  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState('')
  const [selectedConnection, setSelectedConnection] = useState('')
  const [selectedPage, setSelectedPage] = useState('')
  const [selectedFeature, setSelectedFeature] = useState('')
  const [testContent, setTestContent] = useState('')
  const [postId, setPostId] = useState('')

  const loading = connectionsLoading || pagesLoading

  const runAPITest = async () => {
    if (!selectedPlatform || !selectedConnection || !selectedFeature) {
      toast.error('Please select platform, connection, and feature')
      return
    }

    // Check if feature requires a page
    const featureConfig = PLATFORM_FEATURES[selectedPlatform as keyof typeof PLATFORM_FEATURES]?.find(f => f.value === selectedFeature)
    if (featureConfig?.requiresPage && !selectedPage) {
      toast.error('This feature requires selecting a page')
      return
    }

    setTesting(true)

    const connection = connections.find(c => c.id === selectedConnection)
    if (!connection) {
      toast.error('Connection not found')
      setTesting(false)
      return
    }

    const page = selectedPage ? pages.find(p => p.id === selectedPage) : null

    const testLog: APITestLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      platform: selectedPlatform,
      feature: selectedFeature,
      endpoint: '',
      account_name: connection.account_name || connection.profiles?.brand_name || 'Unknown',
      page_name: page?.page_name,
      status: 'pending',
      response_summary: 'Testing...',
    }

    setTestLogs(prev => [testLog, ...prev])

    try {
      const testParams = {
        platform: selectedPlatform,
        feature: selectedFeature,
        connection_id: selectedConnection,
        page_id: selectedPage || undefined,
        content: testContent || undefined,
        post_id: postId || undefined,
      }

      const { data, error } = await supabase.functions.invoke('api-tester', {
        body: testParams,
      })

      if (error) throw error

      const updatedLog: APITestLog = {
        ...testLog,
        status: 'success',
        endpoint: data.endpoint || 'Unknown',
        response_summary: data.summary || 'Success',
        full_response: data.response,
      }

      setTestLogs(prev => prev.map(log => 
        log.id === testLog.id ? updatedLog : log
      ))

      toast.success('API test completed successfully')
      
      // Clear form for posting features
      if (selectedFeature.includes('post')) {
        setTestContent('')
      }

    } catch (error: any) {
      const updatedLog: APITestLog = {
        ...testLog,
        status: 'error',
        response_summary: error.message || 'Test failed',
        error_message: error.message,
      }

      setTestLogs(prev => prev.map(log => 
        log.id === testLog.id ? updatedLog : log
      ))

      toast.error('API test failed: ' + error.message)
    } finally {
      setTesting(false)
    }
  }

  const handleViewLog = (log: APITestLog) => {
    setSelectedLog(log)
    setLogModalOpen(true)
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: <Facebook className="h-4 w-4 text-blue-600" />,
      instagram: <Instagram className="h-4 w-4 text-pink-600" />,
      linkedin: <Linkedin className="h-4 w-4 text-blue-700" />,
      twitter: <Twitter className="h-4 w-4 text-blue-400" />,
      reddit: <MessageSquare className="h-4 w-4 text-orange-600" />,
    }
    return icons[platform as keyof typeof icons] || <Settings className="h-4 w-4" />
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getScopeIcon = (scope: string) => {
    return scope === 'page' ? <Globe className="h-3 w-3" /> : <User className="h-3 w-3" />
  }

  const filteredConnections = connections.filter(c => 
    !selectedPlatform || c.provider === selectedPlatform
  )

  const filteredPages = pages.filter(p => 
    selectedConnection && p.connection_id === selectedConnection
  )

  const platformOptions = [
    { value: '', label: 'Select Platform' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'twitter', label: 'Twitter/X' },
    { value: 'reddit', label: 'Reddit' },
  ]

  const connectionOptions = [
    { value: '', label: 'Select Connection' },
    ...filteredConnections.map(c => ({
      value: c.id,
      label: `${c.account_name || c.profiles?.brand_name || 'Unknown'} (${c.provider})`
    }))
  ]

  const pageOptions = [
    { value: '', label: 'Select Page (Optional)' },
    ...filteredPages.map(p => ({
      value: p.id,
      label: p.page_name
    }))
  ]

  const featureOptions = [
    { value: '', label: 'Select Feature', scope: 'none' },
    ...(selectedPlatform ? PLATFORM_FEATURES[selectedPlatform as keyof typeof PLATFORM_FEATURES] || [] : []).map(f => ({
      value: f.value,
      label: f.label,
      scope: f.scope
    }))
  ]

  const selectedFeatureConfig = selectedPlatform && selectedFeature 
    ? PLATFORM_FEATURES[selectedPlatform as keyof typeof PLATFORM_FEATURES]?.find(f => f.value === selectedFeature)
    : null

  const needsContent = selectedFeature && (
    selectedFeature.includes('post') || 
    selectedFeature === 'post_to_page' || 
    selectedFeature === 'post_to_organization' ||
    selectedFeature === 'post_tweet' ||
    selectedFeature === 'post_to_subreddit' ||
    selectedFeature === 'post_to_feed'
  )

  const needsPostId = selectedFeature && (
    selectedFeature.includes('engagement') || 
    selectedFeature.includes('insight')
  )

  const logColumns = [
    {
      key: 'timestamp',
      label: 'Time',
      render: (log: APITestLog) => (
        <span className="text-sm text-gray-600">
          {format(new Date(log.timestamp), 'HH:mm:ss')}
        </span>
      )
    },
    {
      key: 'platform',
      label: 'Platform',
      render: (log: APITestLog) => (
        <div className="flex items-center space-x-2">
          {getPlatformIcon(log.platform)}
          <span className="capitalize">{log.platform}</span>
        </div>
      )
    },
    {
      key: 'feature',
      label: 'Feature',
      render: (log: APITestLog) => {
        const featureConfig = PLATFORM_FEATURES[log.platform as keyof typeof PLATFORM_FEATURES]?.find(f => f.value === log.feature)
        return (
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">
              {log.feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </span>
            {featureConfig && (
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                {getScopeIcon(featureConfig.scope)}
                <span>{featureConfig.scope}</span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'target',
      label: 'Target',
      render: (log: APITestLog) => (
        <div className="text-sm">
          <div className="flex items-center space-x-1">
            <User className="h-3 w-3 text-gray-400" />
            <span>{log.account_name}</span>
          </div>
          {log.page_name && (
            <div className="flex items-center space-x-1 text-xs text-gray-500 mt-1">
              <Globe className="h-3 w-3" />
              <span>{log.page_name}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (log: APITestLog) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(log.status)}
          <span className={`text-sm font-medium ${
            log.status === 'success' ? 'text-green-700' :
            log.status === 'error' ? 'text-red-700' :
            'text-yellow-700'
          }`}>
            {log.status.charAt(0).toUpperCase() + log.status.slice(1)}
          </span>
        </div>
      )
    },
    {
      key: 'summary',
      label: 'Summary',
      render: (log: APITestLog) => (
        <span className="text-sm text-gray-600 truncate max-w-xs">
          {log.response_summary}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (log: APITestLog) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleViewLog(log)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Tester</h1>
          <p className="mt-1 text-sm text-gray-500">
            Test social media API endpoints for both accounts and pages
          </p>
        </div>
        <Button onClick={() => { refreshConnections(); refreshPages(); }} variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* API Testing Panel */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">API Test Configuration</h2>
          </div>

          <div className="space-y-4">
            <Select
              label="Platform"
              value={selectedPlatform}
              onChange={(e) => {
                setSelectedPlatform(e.target.value)
                setSelectedConnection('')
                setSelectedPage('')
                setSelectedFeature('')
              }}
              options={platformOptions}
              disabled={loading}
            />

            <Select
              label="Connected Account"
              value={selectedConnection}
              onChange={(e) => {
                setSelectedConnection(e.target.value)
                setSelectedPage('')
              }}
              options={connectionOptions}
              disabled={!selectedPlatform || loading}
            />

            {filteredPages.length > 0 && (
              <div>
                <Select
                  label="Page/Organization"
                  value={selectedPage}
                  onChange={(e) => setSelectedPage(e.target.value)}
                  options={pageOptions}
                  disabled={loading}
                />
                {selectedFeatureConfig?.requiresPage && !selectedPage && (
                  <p className="text-sm text-amber-600 mt-1">
                    ⚠️ This feature requires selecting a page
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                API Feature
              </label>
              <select
                value={selectedFeature}
                onChange={(e) => setSelectedFeature(e.target.value)}
                disabled={!selectedConnection || loading}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              >
                <option value="">Select Feature</option>
                {featureOptions.slice(1).map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.scope === 'page' ? '📄' : '👤'} {option.label}
                  </option>
                ))}
              </select>
              {selectedFeatureConfig && (
                <div className="mt-1 flex items-center space-x-2 text-xs text-gray-500">
                  {getScopeIcon(selectedFeatureConfig.scope)}
                  <span>
                    {selectedFeatureConfig.scope === 'page' ? 'Page-level operation' : 'Account-level operation'}
                  </span>
                </div>
              )}
            </div>

            {selectedFeatureConfig?.requiresPage && filteredPages.length === 0 && selectedConnection && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                <p className="text-sm text-yellow-800">
                  This feature requires a page, but no pages are available for the selected connection.
                </p>
              </div>
            )}

            {needsContent && (
              <Textarea
                label="Content to Post"
                value={testContent}
                onChange={(e) => setTestContent(e.target.value)}
                rows={4}
                placeholder="Enter the content you want to post..."
              />
            )}

            {needsPostId && (
              <Input
                label="Post ID"
                value={postId}
                onChange={(e) => setPostId(e.target.value)}
                placeholder="Enter post ID for engagement/insights"
              />
            )}

            <Button
              onClick={runAPITest}
              loading={testing}
              disabled={
                !selectedPlatform || 
                !selectedConnection || 
                !selectedFeature || 
                loading ||
                (selectedFeatureConfig?.requiresPage && !selectedPage)
              }
              className="w-full"
            >
              <Play className="h-4 w-4 mr-2" />
              {testing ? 'Running Test...' : 'Run API Test'}
            </Button>
          </div>
        </div>

        {/* Test Results Summary */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Test Results Summary</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {testLogs.filter(l => l.status === 'success').length}
              </div>
              <div className="text-sm text-gray-500">Successful</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {testLogs.filter(l => l.status === 'error').length}
              </div>
              <div className="text-sm text-gray-500">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {testLogs.filter(l => l.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>

          {testLogs.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">Recent Tests</h3>
              {testLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    {getPlatformIcon(log.platform)}
                    <div>
                      <span className="text-sm">{log.feature.replace(/_/g, ' ')}</span>
                      {log.page_name && (
                        <div className="text-xs text-gray-500">→ {log.page_name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(log.status)}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleViewLog(log)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* API Test Logs Table */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">API Test Logs</h2>
        </div>
        <div className="p-6">
          {testLogs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Play className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-500">No API tests run yet</p>
              <p className="text-xs text-gray-400">Configure and run your first test above</p>
            </div>
          ) : (
            <Table
              data={testLogs}
              columns={logColumns}
              loading={false}
            />
          )}
        </div>
      </div>

      {/* Log Detail Modal */}
      <Modal
        isOpen={logModalOpen}
        onClose={() => {
          setLogModalOpen(false)
          setSelectedLog(null)
        }}
        title="API Test Log Details"
        size="xl"
      >
        {selectedLog && (
          <div className="space-y-6">
            {/* Header Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Test Information</h4>
                <div className="bg-gray-50 rounded-md p-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Platform:</span>
                    <div className="flex items-center space-x-1">
                      {getPlatformIcon(selectedLog.platform)}
                      <span className="text-sm capitalize">{selectedLog.platform}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Feature:</span>
                    <span className="text-sm">{selectedLog.feature.replace(/_/g, ' ')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Status:</span>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(selectedLog.status)}
                      <span className="text-sm capitalize">{selectedLog.status}</span>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Timestamp:</span>
                    <span className="text-sm">{format(new Date(selectedLog.timestamp), 'MMM d, yyyy HH:mm:ss')}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Target Information</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  <div className="text-sm">
                    <div className="flex items-center space-x-1 font-medium">
                      <User className="h-3 w-3 text-gray-400" />
                      <span>{selectedLog.account_name}</span>
                    </div>
                    {selectedLog.page_name && (
                      <div className="flex items-center space-x-1 text-gray-600 mt-1">
                        <Globe className="h-3 w-3" />
                        <span>Page: {selectedLog.page_name}</span>
                      </div>
                    )}
                  </div>
                  {selectedLog.endpoint && (
                    <div className="text-xs text-gray-500 mt-1 font-mono break-all">
                      {selectedLog.endpoint}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Response Summary */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Response Summary</h4>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-sm text-gray-700">{selectedLog.response_summary}</p>
              </div>
            </div>

            {/* Full Response */}
            {selectedLog.full_response && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Full Response</h4>
                <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                    {JSON.stringify(selectedLog.full_response, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Error Message */}
            {selectedLog.error_message && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Error Details</h4>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-700">{selectedLog.error_message}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}