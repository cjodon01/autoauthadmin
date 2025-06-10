import React, { useEffect, useState } from 'react'
import { supabase, type AIProvider, type AIModel } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, Plus, RefreshCw, Bot, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function AIConfig() {
  const [providers, setProviders] = useState<AIProvider[]>([])
  const [models, setModels] = useState<AIModel[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'providers' | 'models'>('providers')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<AIProvider | null>(null)
  const [editingModel, setEditingModel] = useState<AIModel | null>(null)
  const [providerFormData, setProviderFormData] = useState({
    provider_name: '',
    api_key: '',
    api_base_url: '',
    status: 'active',
  })
  const [modelFormData, setModelFormData] = useState({
    model_name: '',
    model_type: 'text_generation',
    provider_id: '',
    api_model_id: '',
    is_active: true,
    max_tokens_default: 0,
    temperature_default: 0.7,
    strengths_description: '',
    best_use_cases: '',
    pricing: '',
    status: 'active',
    min_tier: 'free',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [providersResult, modelsResult] = await Promise.all([
        supabase.from('ai_providers').select('*').order('created_at', { ascending: false }),
        supabase.from('ai_models').select(`
          *,
          ai_providers!ai_models_provider_id_fkey(provider_name)
        `).order('created_at', { ascending: false })
      ])

      if (providersResult.error) throw providersResult.error
      if (modelsResult.error) throw modelsResult.error

      setProviders(providersResult.data || [])
      setModels(modelsResult.data || [])
    } catch (error: any) {
      toast.error('Failed to load AI configuration')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProvider = (provider: AIProvider) => {
    setEditingProvider(provider)
    setProviderFormData({
      provider_name: provider.provider_name,
      api_key: provider.api_key,
      api_base_url: provider.api_base_url,
      status: provider.status,
    })
    setModalOpen(true)
  }

  const handleEditModel = (model: AIModel) => {
    setEditingModel(model)
    setModelFormData({
      model_name: model.model_name,
      model_type: model.model_type,
      provider_id: model.provider_id,
      api_model_id: model.api_model_id || '',
      is_active: model.is_active,
      max_tokens_default: model.max_tokens_default || 0,
      temperature_default: model.temperature_default || 0.7,
      strengths_description: model.strengths_description || '',
      best_use_cases: model.best_use_cases || '',
      pricing: model.pricing || '',
      status: model.status,
      min_tier: model.min_tier,
    })
    setModalOpen(true)
  }

  const handleDeleteProvider = async (provider: AIProvider) => {
    if (!confirm('Are you sure you want to delete this provider?')) return

    try {
      const { error } = await supabase
        .from('ai_providers')
        .delete()
        .eq('id', provider.id)

      if (error) throw error
      toast.success('Provider deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete provider')
      console.error(error)
    }
  }

  const handleDeleteModel = async (model: AIModel) => {
    if (!confirm('Are you sure you want to delete this model?')) return

    try {
      const { error } = await supabase
        .from('ai_models')
        .delete()
        .eq('id', model.id)

      if (error) throw error
      toast.success('Model deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete model')
      console.error(error)
    }
  }

  const handleSubmitProvider = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProvider) {
        const { error } = await supabase
          .from('ai_providers')
          .update(providerFormData)
          .eq('id', editingProvider.id)

        if (error) throw error
        toast.success('Provider updated successfully')
      } else {
        const { error } = await supabase
          .from('ai_providers')
          .insert([providerFormData])

        if (error) throw error
        toast.success('Provider created successfully')
      }

      setModalOpen(false)
      setEditingProvider(null)
      loadData()
    } catch (error: any) {
      toast.error('Failed to save provider')
      console.error(error)
    }
  }

  const handleSubmitModel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingModel) {
        const { error } = await supabase
          .from('ai_models')
          .update(modelFormData)
          .eq('id', editingModel.id)

        if (error) throw error
        toast.success('Model updated successfully')
      } else {
        const { error } = await supabase
          .from('ai_models')
          .insert([modelFormData])

        if (error) throw error
        toast.success('Model created successfully')
      }

      setModalOpen(false)
      setEditingModel(null)
      loadData()
    } catch (error: any) {
      toast.error('Failed to save model')
      console.error(error)
    }
  }

  const providerColumns = [
    {
      key: 'provider_name',
      label: 'Provider Name',
      sortable: true,
    },
    {
      key: 'api_base_url',
      label: 'API Base URL',
    },
    {
      key: 'status',
      label: 'Status',
      render: (provider: AIProvider) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          provider.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {provider.status}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (provider: AIProvider) => format(new Date(provider.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (provider: AIProvider) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditProvider(provider)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteProvider(provider)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const modelColumns = [
    {
      key: 'model_name',
      label: 'Model Name',
      sortable: true,
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (model: any) => model.ai_providers?.provider_name || '-',
    },
    {
      key: 'model_type',
      label: 'Type',
      render: (model: AIModel) => (
        <span className="capitalize">{model.model_type.replace('_', ' ')}</span>
      ),
    },
    {
      key: 'min_tier',
      label: 'Min Tier',
      render: (model: AIModel) => (
        <span className="capitalize">{model.min_tier}</span>
      ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (model: AIModel) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          model.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {model.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (model: AIModel) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditModel(model)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteModel(model)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const modelTypeOptions = [
    { value: 'text_generation', label: 'Text Generation' },
    { value: 'image_generation', label: 'Image Generation' },
  ]

  const tierOptions = [
    { value: 'free', label: 'Free' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' },
  ]

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">AI Configuration</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage AI providers and models for content generation
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadData} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={() => {
              if (activeTab === 'providers') {
                setEditingProvider(null)
                setProviderFormData({
                  provider_name: '',
                  api_key: '',
                  api_base_url: '',
                  status: 'active',
                })
              } else {
                setEditingModel(null)
                setModelFormData({
                  model_name: '',
                  model_type: 'text_generation',
                  provider_id: '',
                  api_model_id: '',
                  is_active: true,
                  max_tokens_default: 0,
                  temperature_default: 0.7,
                  strengths_description: '',
                  best_use_cases: '',
                  pricing: '',
                  status: 'active',
                  min_tier: 'free',
                })
              }
              setModalOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {activeTab === 'providers' ? 'Provider' : 'Model'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('providers')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'providers'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Providers
          </button>
          <button
            onClick={() => setActiveTab('models')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'models'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Bot className="h-4 w-4 inline mr-2" />
            Models
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'providers' ? (
        <Table
          data={providers}
          columns={providerColumns}
          loading={loading}
        />
      ) : (
        <Table
          data={models}
          columns={modelColumns}
          loading={loading}
        />
      )}

      {/* Provider Modal */}
      <Modal
        isOpen={modalOpen && (editingProvider !== null || (editingProvider === null && activeTab === 'providers'))}
        onClose={() => {
          setModalOpen(false)
          setEditingProvider(null)
        }}
        title={editingProvider ? 'Edit Provider' : 'Add Provider'}
      >
        <form onSubmit={handleSubmitProvider} className="space-y-4">
          <Input
            label="Provider Name"
            value={providerFormData.provider_name}
            onChange={(e) => setProviderFormData({ ...providerFormData, provider_name: e.target.value })}
            required
          />
          
          <Input
            label="API Key"
            type="password"
            value={providerFormData.api_key}
            onChange={(e) => setProviderFormData({ ...providerFormData, api_key: e.target.value })}
            required
          />

          <Input
            label="API Base URL"
            value={providerFormData.api_base_url}
            onChange={(e) => setProviderFormData({ ...providerFormData, api_base_url: e.target.value })}
            required
          />

          <Select
            label="Status"
            value={providerFormData.status}
            onChange={(e) => setProviderFormData({ ...providerFormData, status: e.target.value })}
            options={statusOptions}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingProvider(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingProvider ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Model Modal */}
      <Modal
        isOpen={modalOpen && (editingModel !== null || (editingModel === null && activeTab === 'models'))}
        onClose={() => {
          setModalOpen(false)
          setEditingModel(null)
        }}
        title={editingModel ? 'Edit Model' : 'Add Model'}
        size="lg"
      >
        <form onSubmit={handleSubmitModel} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Model Name"
              value={modelFormData.model_name}
              onChange={(e) => setModelFormData({ ...modelFormData, model_name: e.target.value })}
              required
            />
            
            <Select
              label="Provider"
              value={modelFormData.provider_id}
              onChange={(e) => setModelFormData({ ...modelFormData, provider_id: e.target.value })}
              options={[
                { value: '', label: 'Select Provider' },
                ...providers.map(p => ({ value: p.id, label: p.provider_name }))
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Model Type"
              value={modelFormData.model_type}
              onChange={(e) => setModelFormData({ ...modelFormData, model_type: e.target.value as any })}
              options={modelTypeOptions}
            />

            <Input
              label="API Model ID"
              value={modelFormData.api_model_id}
              onChange={(e) => setModelFormData({ ...modelFormData, api_model_id: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Select
              label="Minimum Tier"
              value={modelFormData.min_tier}
              onChange={(e) => setModelFormData({ ...modelFormData, min_tier: e.target.value as any })}
              options={tierOptions}
            />

            <Input
              label="Max Tokens"
              type="number"
              value={modelFormData.max_tokens_default}
              onChange={(e) => setModelFormData({ ...modelFormData, max_tokens_default: parseInt(e.target.value) })}
            />

            <Input
              label="Temperature"
              type="number"
              step="0.1"
              min="0"
              max="2"
              value={modelFormData.temperature_default}
              onChange={(e) => setModelFormData({ ...modelFormData, temperature_default: parseFloat(e.target.value) })}
            />
          </div>

          <Textarea
            label="Strengths Description"
            value={modelFormData.strengths_description}
            onChange={(e) => setModelFormData({ ...modelFormData, strengths_description: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Best Use Cases"
            value={modelFormData.best_use_cases}
            onChange={(e) => setModelFormData({ ...modelFormData, best_use_cases: e.target.value })}
            rows={3}
          />

          <Input
            label="Pricing"
            value={modelFormData.pricing}
            onChange={(e) => setModelFormData({ ...modelFormData, pricing: e.target.value })}
          />

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_active"
              checked={modelFormData.is_active}
              onChange={(e) => setModelFormData({ ...modelFormData, is_active: e.target.checked })}
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
                setEditingModel(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingModel ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}