import React, { useEffect, useState } from 'react'
import { supabase, type Brand } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function Brands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null)
  const [formData, setFormData] = useState({
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
    core_values: [] as string[],
    brand_keywords_include: [] as string[],
    brand_keywords_exclude: [] as string[],
  })

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setBrands(data || [])
    } catch (error: any) {
      toast.error('Failed to load brands')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (brand: Brand) => {
    setEditingBrand(brand)
    setFormData({
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
      core_values: brand.core_values || [],
      brand_keywords_include: brand.brand_keywords_include || [],
      brand_keywords_exclude: brand.brand_keywords_exclude || [],
    })
    setModalOpen(true)
  }

  const handleDelete = async (brand: Brand) => {
    if (!confirm('Are you sure you want to delete this brand?')) return

    try {
      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', brand.id)

      if (error) throw error
      toast.success('Brand deleted successfully')
      loadBrands()
    } catch (error: any) {
      toast.error('Failed to delete brand')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingBrand) {
        const { error } = await supabase
          .from('brands')
          .update(formData)
          .eq('id', editingBrand.id)

        if (error) throw error
        toast.success('Brand updated successfully')
      }

      setModalOpen(false)
      setEditingBrand(null)
      loadBrands()
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
      render: (brand: Brand) => brand.industry || '-',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (brand: Brand) => format(new Date(brand.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (brand: Brand) => (
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
        <Button onClick={loadBrands} variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
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
            <Input
              label="Brand Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            
            <Input
              label="Industry"
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
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
              label="Brand Voice"
              value={formData.brand_voice}
              onChange={(e) => setFormData({ ...formData, brand_voice: e.target.value })}
            />
            
            <Input
              label="Primary Color"
              type="color"
              value={formData.primary_color}
              onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
            />
          </div>

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