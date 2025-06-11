import React, { useEffect, useState } from 'react'
import { supabase, type SocialPage } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, RefreshCw, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface SocialConnection {
  id: string
  user_id: string
  provider: string
}

interface Profile {
  user_id: string
  brand_name: string
  email: string
}

export function SocialPagesManagement() {
  const [pages, setPages] = useState<any[]>([])
  const [connections, setConnections] = useState<SocialConnection[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPage, setEditingPage] = useState<any>(null)
  const [formData, setFormData] = useState({
    connection_id: '',
    user_id: '',
    page_id: '',
    page_name: '',
    page_category: '',
    page_picture_url: '',
    page_access_token: '',
    page_description: '',
    preferred_audience: '',
    provider: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [pagesResult, connectionsResult, profilesResult] = await Promise.all([
        supabase.from('social_pages').select(`
          *,
          social_connections!social_pages_connection_id_fkey(provider),
          profiles!social_pages_user_id_fkey(brand_name, email)
        `).order('created_at', { ascending: false }),
        supabase.from('social_connections').select('id, user_id, provider'),
        supabase.from('profiles').select('user_id, brand_name, email')
      ])

      if (pagesResult.error) throw pagesResult.error
      if (connectionsResult.error) throw connectionsResult.error
      if (profilesResult.error) throw profilesResult.error

      setPages(pagesResult.data || [])
      setConnections(connectionsResult.data || [])
      setProfiles(profilesResult.data || [])
    } catch (error: any) {
      toast.error('Failed to load social pages')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (page: any) => {
    setEditingPage(page)
    setFormData({
      connection_id: page.connection_id,
      user_id: page.user_id,
      page_id: page.page_id,
      page_name: page.page_name,
      page_category: page.page_category || '',
      page_picture_url: page.page_picture_url || '',
      page_access_token: page.page_access_token,
      page_description: page.page_description || '',
      preferred_audience: page.preferred_audience || '',
      provider: page.provider || '',
    })
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingPage(null)
    setFormData({
      connection_id: '',
      user_id: '',
      page_id: '',
      page_name: '',
      page_category: '',
      page_picture_url: '',
      page_access_token: '',
      page_description: '',
      preferred_audience: '',
      provider: '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (page: any) => {
    if (!confirm('Are you sure you want to delete this social page?')) return

    try {
      const { error } = await supabase
        .from('social_pages')
        .delete()
        .eq('id', page.id)

      if (error) throw error
      toast.success('Social page deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete social page')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingPage) {
        const { error } = await supabase
          .from('social_pages')
          .update(formData)
          .eq('id', editingPage.id)

        if (error) throw error
        toast.success('Social page updated successfully')
      } else {
        const { error } = await supabase
          .from('social_pages')
          .insert([formData])

        if (error) throw error
        toast.success('Social page created successfully')
      }

      setModalOpen(false)
      setEditingPage(null)
      loadData()
    } catch (error: any) {
      toast.error('Failed to save social page')
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
      key: 'page_name',
      label: 'Page Name',
      render: (page: any) => (
        <div>
          <div className="font-medium">{page.page_name}</div>
          <div className="text-sm text-gray-500">{page.page_id}</div>
        </div>
      ),
    },
    {
      key: 'provider',
      label: 'Provider',
      render: (page: any) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getProviderIcon(page.provider)}</span>
          <span className="capitalize">{page.provider}</span>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (page: any) => (
        <div>
          <div className="font-medium">{page.profiles?.brand_name || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{page.profiles?.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'page_category',
      label: 'Category',
      render: (page: any) => page.page_category || '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (page: any) => format(new Date(page.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (page: any) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(page)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(page)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const providerOptions = [
    { value: '', label: 'Select Provider' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'twitter', label: 'Twitter' },
    { value: 'linkedin', label: 'LinkedIn' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Social Pages</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage social media pages and their configurations
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadData} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Page
          </Button>
        </div>
      </div>

      <Table
        data={pages}
        columns={columns}
        loading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingPage(null)
        }}
        title={editingPage ? 'Edit Social Page' : 'Add Social Page'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="User"
              value={formData.user_id}
              onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
              options={[
                { value: '', label: 'Select User' },
                ...profiles.map(p => ({ value: p.user_id, label: `${p.brand_name} (${p.email})` }))
              ]}
              required
            />

            <Select
              label="Connection"
              value={formData.connection_id}
              onChange={(e) => setFormData({ ...formData, connection_id: e.target.value })}
              options={[
                { value: '', label: 'Select Connection' },
                ...connections
                  .filter(c => !formData.user_id || c.user_id === formData.user_id)
                  .map(c => ({ value: c.id, label: `${c.provider} connection` }))
              ]}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Page ID"
              value={formData.page_id}
              onChange={(e) => setFormData({ ...formData, page_id: e.target.value })}
              required
            />

            <Input
              label="Page Name"
              value={formData.page_name}
              onChange={(e) => setFormData({ ...formData, page_name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Provider"
              value={formData.provider}
              onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
              options={providerOptions}
            />

            <Input
              label="Category"
              value={formData.page_category}
              onChange={(e) => setFormData({ ...formData, page_category: e.target.value })}
            />
          </div>

          <Input
            label="Picture URL"
            value={formData.page_picture_url}
            onChange={(e) => setFormData({ ...formData, page_picture_url: e.target.value })}
          />

          <Textarea
            label="Access Token"
            value={formData.page_access_token}
            onChange={(e) => setFormData({ ...formData, page_access_token: e.target.value })}
            rows={3}
            required
          />

          <Textarea
            label="Description"
            value={formData.page_description}
            onChange={(e) => setFormData({ ...formData, page_description: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Preferred Audience"
            value={formData.preferred_audience}
            onChange={(e) => setFormData({ ...formData, preferred_audience: e.target.value })}
            rows={2}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingPage(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingPage ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}