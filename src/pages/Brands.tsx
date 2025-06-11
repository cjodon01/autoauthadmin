import React, { useEffect, useState } from 'react'
import { supabase, type Brand } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, RefreshCw, Plus } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function Brands() {
  const [brands, setBrands] = useState<any[]>([])
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<any>(null)
  const [formData, setFormData] = useState({
    user_id: '',
    name: '',
    description: '',
    mission_statement: '',
    usp_statement: '',
    brand_persona_description: '',
    target_audience: '',
    brand_voice: '',
    industry: '',
    primary_color: '',
    secondary_color: '',
    core_values: '',
    brand_keywords_include: '',
    brand_keywords_exclude: '',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [brandsResult, profilesResult] = await Promise.all([
        supabase.from('brands').select(`
          *,
          users!brands_user_id_fkey(email)
        `).order('created_at', { ascending: false }),
        supabase.from('profiles').select('user_id, brand_name, email')
      ])

      if (brandsResult.error) throw brandsResult.error
      if (profilesResult.error) throw profilesResult.error

      setBrands(brandsResult.data || [])
      setProfiles(profilesResult.data || [])
    } catch (error: any) {
      toast.error('Failed to load brands')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (brand: any) => {
    setEditingBrand(brand)
    setFormData({
      user_id: brand.user_id,
      name: brand.name,
      description: brand.description || '',
      mission_statement: brand.mission_statement || '',
      usp_statement: brand.usp_statement || '',
      brand_persona_description: brand.brand_persona_description || '',
      target_audience: brand.target_audience || '',
      brand_voice: brand.brand_voice || '',
      industry: brand.industry || '',
      primary_color: brand.primary_color || '',
      secondary_color: brand.secondary_color || '',
      core_values: brand.core_values ? brand.core_values.join(', ') : '',
      brand_keywords_include: brand.brand_keywords_include ? brand.brand_keywords_include.join(', ') : '',
      brand_keywords_exclude: brand.brand_keywords_exclude ? brand.brand_keywords_exclude.join(', ') : '',
    })
    setModalOpen(true)
  }

  const handleCreate = () => {
    setEditingBrand(null)
    setFormData({
      user_id: '',
      name: '',
      description: '',
      mission_statement: '',
      usp_statement: '',
      brand_persona_description: '',
      target_audience: '',
      brand_voice: '',
      industry: '',
      primary_color: '',
      secondary_color: '',
      core_values: '',
      brand_keywords_include: '',
      brand_keywords_exclude: '',
    })
    setModalOpen(true)
  }

  const handleDelete = async (brand: any) => {
    if (!confirm('Are you sure you want to delete this brand?')) return

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brand.id)

      if (error) throw error
      toast.success('Brand deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete brand')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const submitData = {
        ...formData,
        core_values: formData.core_values ? formData.core_values.split(',').map(v => v.trim()).filter(v => v) : [],
        brand_keywords_include: formData.brand_keywords_include ? formData.brand_keywords_include.split(',').map(v => v.trim()).filter(v => v) : [],
        brand_keywords_exclude: formData.brand_keywords_exclude ? formData.brand_keywords_exclude.split(',').map(v => v.trim()).filter(v => v) : [],
      }

      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(submitData)
          .eq('id', editingBrand.id)

        if (error) throw error
        toast.success('Brand updated successfully')
      } else {
        const { error } = await supabase
          .from('brands')
          .insert([submitData])

        if (error) throw error
        toast.success('Brand created successfully')
      }

      setModalOpen(false)
      setEditingBrand(null)
      loadData()
    } catch (error: any) {
      toast.error('Failed to save brand')
      console.error(error)
    }
  }

  const columns = [
    {
      key: 'name',
      label: 'Brand Name',
      sortable: true,
    },
    {
      key: 'industry',
      label: 'Industry',
      render: (brand: any) => brand.industry || '-',
    },
    {
      key: 'user',
      label: 'Owner',
      render: (brand: any) => (
        <div>
          <div className="font-medium">{brand.users?.email || 'Unknown'}</div>
          <div className="text-sm text-gray-500">{brand.user_id}</div>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (brand: any) => format(new Date(brand.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (brand: any) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(brand)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(brand)}
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
          <h1 className="text-2xl font-bold text-gray-900">Brands</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage brand profiles and configurations
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadData} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Add Brand
          </Button>
        </div>
      </div>

      <Table
        data={brands}
        columns={columns}
        loading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingBrand(null)
        }}
        title={editingBrand ? 'Edit Brand' : 'Add Brand'}
        size="lg"
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
              label="Brand Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
            />
            
            <Input
              label="Brand Voice"
              value={formData.brand_voice}
              onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
            />
          </div>

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Mission Statement"
            value={formData.mission_statement}
            onChange={(e) => setFormData({ ...formData, mission_statement: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Unique Selling Proposition"
            value={formData.usp_statement}
            onChange={(e) => setFormData({ ...formData, usp_statement: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Brand Persona Description"
            value={formData.brand_persona_description}
            onChange={(e) => setFormData({ ...formData, brand_persona_description: e.target.value })}
            rows={3}
          />

          <Textarea
            label="Target Audience"
            value={formData.target_audience}
            onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
            rows={3}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Primary Color"
              type="color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
            />
            
            <Input
              label="Secondary Color"
              type="color"
              value={formData.secondary_color}
              onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
            />
          </div>

          <Input
            label="Core Values (comma-separated)"
            value={formData.core_values}
            onChange={(e) => setFormData({ ...formData, core_values: e.target.value })}
            placeholder="innovation, quality, customer-first"
          />

          <Input
            label="Keywords to Include (comma-separated)"
            value={formData.brand_keywords_include}
            onChange={(e) => setFormData({ ...formData, brand_keywords_include: e.target.value })}
            placeholder="sustainable, premium, innovative"
          />

          <Input
            label="Keywords to Exclude (comma-separated)"
            value={formData.brand_keywords_exclude}
            onChange={(e) => setFormData({ ...formData, brand_keywords_exclude: e.target.value })}
            placeholder="cheap, low-quality, generic"
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingBrand(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingBrand ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}