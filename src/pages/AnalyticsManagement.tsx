import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, RefreshCw, Plus, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function AnalyticsManagement() {
  const [analytics, setAnalytics] = useState<any[]>([])
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAnalytics, setEditingAnalytics] = useState<any>(null)
  const [formData, setFormData] = useState({
    campaign_id: '',
    platform: '',
    post_id: '',
    impressions: 0,
    clicks: 0,
    likes: 0,
    shares: 0,
    comments: 0,
    engagement_rate: 0,
    metrics_json: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [analyticsResult, campaignsResult] = await Promise.all([
        supabase.from('analytics_data').select(`
          *,
          campaigns!analytics_data_campaign_id_fkey(campaign_name)
        `).order('created_at', { ascending: false }),
        supabase.from('campaigns').select('id, campaign_name')
      ])

      if (analyticsResult.error) throw analyticsResult.error
      if (campaignsResult.error) throw campaignsResult.error

      setAnalytics(analyticsResult.data || [])
      setCampaigns(campaignsResult.data || [])
    } catch (error: any) {
      toast.error('Failed to load analytics data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (analytics: any) => {
    setEditingAnalytics(analytics)
    setFormData({
      campaign_id: analytics.campaign_id || '',
      platform: analytics.platform,
      post_id: analytics.post_id,
      impressions: analytics.impressions || 0,
      clicks: analytics.clicks || 0,
      likes: analytics.likes || 0,
      shares: analytics.shares || 0,
      comments: analytics.comments || 0,
      engagement_rate: analytics.engagement_rate || 0,
      metrics_json: analytics.metrics_json ? JSON.stringify(analytics.metrics_json, null, 2) : '',
    })
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingAnalytics(null)
    setFormData({
      campaign_id: '',
      platform: '',
      post_id: '',
      impressions: 0,
      clicks: 0,
      likes: 0,
      shares: 0,
      comments: 0,
      engagement_rate: 0,
      metrics_json: '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (analytics: any) => {
    if (!confirm('Are you sure you want to delete this analytics record?')) return

    try {
      const { error } = await supabase
        .from('analytics_data')
        .delete()
        .eq('id', analytics.id)

      if (error) throw error
      toast.success('Analytics record deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete analytics record')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        metrics_json: formData.metrics_json ? JSON.parse(formData.metrics_json) : null,
      }

      if (editingAnalytics) {
        const { error } = await supabase
          .from('analytics_data')
          .update(submitData)
          .eq('id', editingAnalytics.id)

        if (error) throw error
        toast.success('Analytics record updated successfully')
      } else {
        const { error } = await supabase
          .from('analytics_data')
          .insert([submitData])

        if (error) throw error
        toast.success('Analytics record created successfully')
      }

      setModalOpen(false)
      setEditingAnalytics(null)
      loadData()
    } catch (error: any) {
      toast.error('Failed to save analytics record')
      console.error(error)
    }
  }

  const getPlatformIcon = (platform: string) => {
    const icons = {
      facebook: '📘',
      instagram: '📷',
      twitter: '🐦',
      linkedin: '💼',
      email: '📧',
      blog: '📝',
    }
    return icons[platform as keyof typeof icons] || '📊'
  }

  const formatNumber = (num?: number) => {
    if (!num) return '0'
    return num.toLocaleString()
  }

  const columns = [
    {
      key: 'platform',
      label: 'Platform',
      render: (analytics: any) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getPlatformIcon(analytics.platform)}</span>
          <span className="capitalize">{analytics.platform}</span>
        </div>
      ),
    },
    {
      key: 'campaign',
      label: 'Campaign',
      render: (analytics: any) => analytics.campaigns?.campaign_name || '-',
    },
    {
      key: 'post_id',
      label: 'Post ID',
      render: (analytics: any) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">{analytics.post_id}</p>
        </div>
      ),
    },
    {
      key: 'metrics',
      label: 'Key Metrics',
      render: (analytics: any) => (
        <div className="text-sm">
          <div>👁️ {formatNumber(analytics.impressions)}</div>
          <div>👍 {formatNumber(analytics.likes)}</div>
          <div>💬 {formatNumber(analytics.comments)}</div>
        </div>
      ),
    },
    {
      key: 'engagement_rate',
      label: 'Engagement',
      render: (analytics: any) => 
        analytics.engagement_rate 
          ? `${(analytics.engagement_rate * 100).toFixed(2)}%`
          : '-',
    },
    {
      key: 'fetched_at',
      label: 'Fetched',
      render: (analytics: any) => 
        analytics.fetched_at 
          ? format(new Date(analytics.fetched_at), 'MMM d, yyyy')
          : '-',
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (analytics: any) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(analytics)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(analytics)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const platformOptions = [
    { value: '', label: 'Select Platform' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'email', label: 'Email' },
    { value: 'blog', label: 'Blog' },
  ]

  const stats = {
    totalRecords: analytics.length,
    totalImpressions: analytics.reduce((sum, a) => sum + (a.impressions || 0), 0),
    totalEngagements: analytics.reduce((sum, a) => sum + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0),
    avgEngagementRate: analytics.length > 0 
      ? analytics.reduce((sum, a) => sum + (a.engagement_rate || 0), 0) / analytics.length * 100
      : 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage social media analytics and performance data
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadData} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Record
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Records</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalRecords}</dd>
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
                  <span className="text-white text-sm font-medium">👁️</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Impressions</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(stats.totalImpressions)}</dd>
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
                  <span className="text-white text-sm font-medium">💬</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Engagements</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatNumber(stats.totalEngagements)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">%</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Engagement</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.avgEngagementRate.toFixed(2)}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table
        data={analytics}
        columns={columns}
        loading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingAnalytics(null)
        }}
        title={editingAnalytics ? 'Edit Analytics Record' : 'Add Analytics Record'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Campaign"
              value={formData.campaign_id}
              onChange={(e) => setFormData({ ...formData, campaign_id: e.target.value })}
              options={[
                { value: '', label: 'Select Campaign (Optional)' },
                ...campaigns.map(c => ({ value: c.id, label: c.campaign_name }))
              ]}
            />

            <Select
              label="Platform"
              value={formData.platform}
              onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              options={platformOptions}
              required
            />
          </div>

          <Input
            label="Post ID"
            value={formData.post_id}
            onChange={(e) => setFormData({ ...formData, post_id: e.target.value })}
            required
          />

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Input
              label="Impressions"
              type="number"
              value={formData.impressions}
              onChange={(e) => setFormData({ ...formData, impressions: parseInt(e.target.value) || 0 })}
            />

            <Input
              label="Clicks"
              type="number"
              value={formData.clicks}
              onChange={(e) => setFormData({ ...formData, clicks: parseInt(e.target.value) || 0 })}
            />

            <Input
              label="Likes"
              type="number"
              value={formData.likes}
              onChange={(e) => setFormData({ ...formData, likes: parseInt(e.target.value) || 0 })}
            />

            <Input
              label="Shares"
              type="number"
              value={formData.shares}
              onChange={(e) => setFormData({ ...formData, shares: parseInt(e.target.value) || 0 })}
            />

            <Input
              label="Comments"
              type="number"
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: parseInt(e.target.value) || 0 })}
            />

            <Input
              label="Engagement Rate"
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={formData.engagement_rate}
              onChange={(e) => setFormData({ ...formData, engagement_rate: parseFloat(e.target.value) || 0 })}
            />
          </div>

          <Textarea
            label="Additional Metrics (JSON)"
            value={formData.metrics_json}
            onChange={(e) => setFormData({ ...formData, metrics_json: e.target.value })}
            rows={4}
            placeholder='{"custom_metric": 123, "another_metric": "value"}'
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingAnalytics(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingAnalytics ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}