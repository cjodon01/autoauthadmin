import { useEffect, useState } from 'react'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, RefreshCw, Play, Pause, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'
import { useCampaigns, useProfiles, useBrands, useSocialPages, useAIModels } from '../hooks/useDataLoader'
import { supabase } from '../lib/supabase'

export function Campaigns() {
  const { data: campaigns, loading: campaignsLoading, refresh: refreshCampaigns } = useCampaigns()
  const { data: profiles } = useProfiles()
  const { data: brands } = useBrands()
  const { data: socialPages } = useSocialPages()
  const { data: aiModels } = useAIModels()
  
  const [modalOpen, setModalOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState<any>(null)
  const [formData, setFormData] = useState({
    user_id: '',
    page_id: '',
    brand_id: '',
    campaign_name: '',
    description: '',
    campaign_type: 'general',
    goal: '',
    schedule_cron: '',
    timezone: 'UTC',
    is_active: true,
    ai_tone: '',
    ai_posting_frequency: '',
    target_audience_psychographics: '',
    negative_constraints_campaign: '',
    cta_action: '',
    cta_link: '',
    post_length_type: 'medium',
    ai_intent: '',
    journey_start_date: '',
    journey_duration_days: 30,
    key_milestones: '',
    target_audience_journey: '',
    ai_model_for_general_campaign: '',
    ai_model_for_journey_map: '',
  })

  const loading = campaignsLoading

  const handleEdit = (campaign: any) => {
    setEditingCampaign(campaign)
    setFormData({
      user_id: campaign.user_id,
      page_id: campaign.page_id || '',
      brand_id: campaign.brand_id || '',
      campaign_name: campaign.campaign_name,
      description: campaign.description || '',
      campaign_type: campaign.campaign_type,
      goal: campaign.goal || '',
      schedule_cron: campaign.schedule_cron || '',
      timezone: campaign.timezone || 'UTC',
      is_active: campaign.is_active,
      ai_tone: campaign.ai_tone || '',
      ai_posting_frequency: campaign.ai_posting_frequency || '',
      target_audience_psychographics: campaign.target_audience_psychographics || '',
      negative_constraints_campaign: campaign.negative_constraints_campaign || '',
      cta_action: campaign.cta_action || '',
      cta_link: campaign.cta_link || '',
      post_length_type: campaign.post_length_type || 'medium',
      ai_intent: campaign.ai_intent || '',
      journey_start_date: campaign.journey_start_date || '',
      journey_duration_days: campaign.journey_duration_days || 30,
      key_milestones: campaign.key_milestones ? campaign.key_milestones.join(', ') : '',
      target_audience_journey: campaign.target_audience_journey || '',
      ai_model_for_general_campaign: campaign.ai_model_for_general_campaign || '',
      ai_model_for_journey_map: campaign.ai_model_for_journey_map || '',
    })
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingCampaign(null)
    setFormData({
      user_id: '',
      page_id: '',
      brand_id: '',
      campaign_name: '',
      description: '',
      campaign_type: 'general',
      goal: '',
      schedule_cron: '',
      timezone: 'UTC',
      is_active: true,
      ai_tone: '',
      ai_posting_frequency: '',
      target_audience_psychographics: '',
      negative_constraints_campaign: '',
      cta_action: '',
      cta_link: '',
      post_length_type: 'medium',
      ai_intent: '',
      journey_start_date: '',
      journey_duration_days: 30,
      key_milestones: '',
      target_audience_journey: '',
      ai_model_for_general_campaign: '',
      ai_model_for_journey_map: '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (campaign: any) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaign.id)

      if (error) throw error
      toast.success('Campaign deleted successfully')
      refreshCampaigns()
    } catch (error: any) {
      toast.error('Failed to delete campaign')
      console.error(error)
    }
  }

  const toggleCampaignStatus = async (campaign: any) => {
    try {
      const { error } = await supabase
        .from('campaigns')
        .update({ is_active: !campaign.is_active })
        .eq('id', campaign.id)

      if (error) throw error
      toast.success(`Campaign ${campaign.is_active ? 'paused' : 'activated'} successfully`)
      refreshCampaigns()
    } catch (error: any) {
      toast.error('Failed to update campaign status')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        key_milestones: formData.key_milestones ? formData.key_milestones.split(',').map(m => m.trim()).filter(m => m) : [],
      }

      if (editingCampaign) {
        const { error } = await supabase
          .from('campaigns')
          .update(submitData)
          .eq('id', editingCampaign.id)

        if (error) throw error
        toast.success('Campaign updated successfully')
      } else {
        const { error } = await supabase
          .from('campaigns')
          .insert([submitData])

        if (error) throw error
        toast.success('Campaign created successfully')
      }

      setModalOpen(false)
      setEditingCampaign(null)
      refreshCampaigns()
    } catch (error: any) {
      toast.error('Failed to save campaign')
      console.error(error)
    }
  }

  const getStatusBadge = (campaign: any) => {
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
      render: (campaign: any) => (
        <div>
          <div className="font-medium">{campaign.campaign_name}</div>
          <div className="text-sm text-gray-500">{campaign.description || 'No description'}</div>
        </div>
      ),
    },
    {
      key: 'campaign_type',
      label: 'Type',
      render: (campaign: any) => getCampaignTypeBadge(campaign.campaign_type),
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
      render: (campaign: any) => getStatusBadge(campaign),
    },
    {
      key: 'next_run_at',
      label: 'Next Run',
      render: (campaign: any) => 
        campaign.next_run_at 
          ? format(new Date(campaign.next_run_at), 'MMM d, yyyy HH:mm')
          : '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (campaign: any) => format(new Date(campaign.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (campaign: any) => (
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
            onClick={() => handleEdit(campaign)}
          >
            <Edit className="h-4 w-4" />
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

  const campaignTypeOptions = [
    { value: 'general', label: 'General' },
    { value: 'journey', label: 'Journey' },
  ]

  const postLengthOptions = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
  ]

  const ctaActionOptions = [
    { value: '', label: 'No CTA' },
    { value: 'visit_website', label: 'Visit Website' },
    { value: 'sign_up', label: 'Sign Up' },
    { value: 'download', label: 'Download' },
    { value: 'learn_more', label: 'Learn More' },
    { value: 'shop_now', label: 'Shop Now' },
    { value: 'register', label: 'Register' },
    { value: 'reply_below', label: 'Reply Below' },
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
          <Button onClick={refreshCampaigns} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Campaign
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

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCampaign(null)
        }}
        title={editingCampaign ? 'Edit Campaign' : 'Add Campaign'}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              required
            >
              <option value="">Select User</option>
              {profiles.map((profile) => (
                <option key={profile.user_id} value={profile.user_id}>
                  {profile.brand_name} ({profile.email})
                </option>
              ))}
            </select>

            <Input
              label="Campaign Name"
              value={formData.campaign_name}
              onChange={(e) => setFormData({ ...formData, campaign_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Campaign Type"
              value={formData.campaign_type}
              onChange={(e) => setFormData({ ...formData, campaign_type: e.target.value })}
              options={campaignTypeOptions}
            />

            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={formData.brand_id}
              onChange={(e) => setFormData({ ...formData, brand_id: e.target.value })}
            >
              <option value="">Select Brand (Optional)</option>
              {brands
                .filter(brand => !formData.user_id || brand.user_id === formData.user_id)
                .map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>

            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={formData.page_id}
              onChange={(e) => setFormData({ ...formData, page_id: e.target.value })}
            >
              <option value="">Select Social Page (Optional)</option>
              {socialPages
                .filter(page => !formData.user_id || page.user_id === formData.user_id)
                .map((page) => (
                <option key={page.id} value={page.id}>
                  {page.page_name} ({page.provider})
                </option>
              ))}
            </select>
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Goal"
              value={formData.goal}
              onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            />

            <Input
              label="Schedule (Cron)"
              value={formData.schedule_cron}
              onChange={(e) => setFormData({ ...formData, schedule_cron: e.target.value })}
              placeholder="0 9 * * *"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Timezone"
              value={formData.timezone}
              onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            />

            <Select
              label="Post Length"
              value={formData.post_length_type}
              onChange={(e) => setFormData({ ...formData, post_length_type: e.target.value })}
              options={postLengthOptions}
            />

            <Select
              label="CTA Action"
              value={formData.cta_action}
              onChange={(e) => setFormData({ ...formData, cta_action: e.target.value })}
              options={ctaActionOptions}
            />
          </div>

          {formData.cta_action && (
            <Input
              label="CTA Link"
              value={formData.cta_link}
              onChange={(e) => setFormData({ ...formData, cta_link: e.target.value })}
              placeholder="https://example.com"
            />
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="AI Tone"
              value={formData.ai_tone}
              onChange={(e) => setFormData({ ...formData, ai_tone: e.target.value })}
            />

            <Input
              label="Posting Frequency"
              value={formData.ai_posting_frequency}
              onChange={(e) => setFormData({ ...formData, ai_posting_frequency: e.target.value })}
            />
          </div>

          <Textarea
            label="Target Audience Psychographics"
            value={formData.target_audience_psychographics}
            onChange={(e) => setFormData({ ...formData, target_audience_psychographics: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Negative Constraints"
            value={formData.negative_constraints_campaign}
            onChange={(e) => setFormData({ ...formData, negative_constraints_campaign: e.target.value })}
            rows={2}
          />

          <Input
            label="AI Intent"
            value={formData.ai_intent}
            onChange={(e) => setFormData({ ...formData, ai_intent: e.target.value })}
          />

          {formData.campaign_type === 'journey' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Journey Start Date"
                  type="date"
                  value={formData.journey_start_date}
                  onChange={(e) => setFormData({ ...formData, journey_start_date: e.target.value })}
                />

                <Input
                  label="Journey Duration (Days)"
                  type="number"
                  value={formData.journey_duration_days}
                  onChange={(e) => setFormData({ ...formData, journey_duration_days: parseInt(e.target.value) || 30 })}
                />
              </div>

              <Input
                label="Key Milestones (comma-separated)"
                value={formData.key_milestones}
                onChange={(e) => setFormData({ ...formData, key_milestones: e.target.value })}
                placeholder="launch, mid-point, finale"
              />

              <Textarea
                label="Journey Target Audience"
                value={formData.target_audience_journey}
                onChange={(e) => setFormData({ ...formData, target_audience_journey: e.target.value })}
                rows={3}
              />
            </>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={formData.ai_model_for_general_campaign}
              onChange={(e) => setFormData({ ...formData, ai_model_for_general_campaign: e.target.value })}
            >
              <option value="">Select AI Model for General Campaign</option>
              {aiModels
                .filter(model => model.model_type === 'text_generation')
                .map((model) => (
                <option key={model.id} value={model.id}>
                  {model.model_name}
                </option>
              ))}
            </select>

            <select
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              value={formData.ai_model_for_journey_map}
              onChange={(e) => setFormData({ ...formData, ai_model_for_journey_map: e.target.value })}
            >
              <option value="">Select AI Model for Journey Map</option>
              {aiModels
                .filter(model => model.model_type === 'text_generation')
                .map((model) => (
                <option key={model.id} value={model.id}>
                  {model.model_name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingCampaign(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingCampaign ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}