import { useEffect, useState } from 'react'
import { supabase, type Campaign } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Trash2, RefreshCw, Play, Pause } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          profiles!campaigns_user_id_fkey(brand_name, email),
          brands(name),
          social_pages(page_name, provider)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setCampaigns(data || [])
    } catch (error: any) {
      toast.error('Failed to load campaigns')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (campaign: Campaign) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id)

      if (error) throw error
      toast.success('Campaign deleted successfully')
      loadCampaigns()
    } catch (error: any) {
      toast.error('Failed to delete campaign')
      console.error(error)
    }
  }

  const toggleCampaignStatus = async (campaign: Campaign) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !campaign.is_active })
        .eq('id', campaign.id)

      if (error) throw error
      toast.success(`Campaign ${campaign.is_active ? 'paused' : 'activated'} successfully`)
      loadCampaigns()
    } catch (error: any) {
      toast.error('Failed to update campaign status')
      console.error(error)
    }
  }

  const getStatusBadge = (campaign: Campaign) => {
    if (!campaign.is_active) {
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Paused</span>
    }
    return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
  }

  const getCampaignTypeBadge = (type: string) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      journey: 'bg-purple-100 text-purple-800',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {type}
      </span>
    )
  }

  const columns = [
    {
      key: 'campaign_name',
      label: 'Campaign Name',
      render: (campaign: Campaign) => (
        <div>
          <div className="font-medium">{campaign.campaign_name}</div>
          <div className="text-sm text-gray-500">{campaign.description || 'No description'}</div>
        </div>
      ),
    },
    {
      key: 'campaign_type',
      label: 'Type',
      render: (campaign: Campaign) => getCampaignTypeBadge(campaign.campaign_type),
    },
    {
      key: 'user',
      label: 'User',
      render: (campaign: any) => (
        <div>
          <div className="font-medium">{campaign.profiles?.brand_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{campaign.profiles?.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'brand',
      label: 'Brand',
      render: (campaign: any) => campaign.brands?.name || '-',
    },
    {
      key: 'social_page',
      label: 'Social Page',
      render: (campaign: any) => (
        <div>
          <div className="font-medium">{campaign.social_pages?.page_name || '-'}</div>
          <div className="text-sm text-gray-500 capitalize">{campaign.social_pages?.provider || '-'}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (campaign: Campaign) => getStatusBadge(campaign),
    },
    {
      key: 'next_run_at',
      label: 'Next Run',
      render: (campaign: Campaign) => 
        campaign.next_run_at 
          ? format(new Date(campaign.next_run_at), 'MMM d, yyyy HH:mm')
          : '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (campaign: Campaign) => format(new Date(campaign.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (campaign: Campaign) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => toggleCampaignStatus(campaign)}
            title={campaign.is_active ? 'Pause campaign' : 'Activate campaign'}
          >
            {campaign.is_active ? (
              <Pause className="h-4 w-4 text-orange-500" />
            ) : (
              <Play className="h-4 w-4 text-green-500" />
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(campaign)}
            title="Delete campaign"
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
          <h1 className="text-2xl font-bold text-gray-900">Campaigns</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage marketing campaigns and their automation settings
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadCampaigns} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">📊</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Campaigns
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {campaigns.length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">✅</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Active Campaigns
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {campaigns.filter(c => c.is_active).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🎯</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    General Campaigns
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {campaigns.filter(c => c.campaign_type === 'general').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <span className="text-2xl">🗺️</span>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Journey Campaigns
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {campaigns.filter(c => c.campaign_type === 'journey').length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table
        data={campaigns}
        columns={columns}
        loading={loading}
      />
    </div>
  )
}