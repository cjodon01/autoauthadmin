import { useEffect, useState } from 'react'
import { supabase, type Brand } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

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
  })

  useEffect(() => {
    loadBrands()
  }, [])

  const loadBrands = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('brands').select('*').order('created_at', { ascending: false })
    if (error) {
      toast.error('Failed to load brands')
      console.error(error)
    } else {
      setBrands(data || [])
    }
    setLoading(false)
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
    })
    setModalOpen(true)
  }

  const handleDelete = async (brand: Brand) => {
    if (!confirm('Are you sure you want to delete this brand?')) return
    const { error } = await supabase.from('brands').delete().eq('id', brand.id)
    if (error) {
      toast.error('Delete failed')
    } else {
      toast.success('Brand deleted')
      loadBrands()
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = { ...formData }

    const result = editingBrand
      ? await supabase.from('brands').update(payload).eq('id', editingBrand.id)
      : await supabase.from('brands').insert([payload])

    if (result.error) {
      toast.error('Failed to save brand')
    } else {
      toast.success(editingBrand ? 'Brand updated' : 'Brand added')
      setModalOpen(false)
      setEditingBrand(null)
      loadBrands()
    }
  }

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Brands</h1>
        <Button
          onClick={() => {
            setEditingBrand(null)
            setFormData({
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
            })
            setModalOpen(true)
          }}
        >
          <Plus className="w-4 h-4 mr-2" /> Add Brand
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100">
            <tr>
              {['Name', 'Description', 'Industry', 'Actions'].map((header) => (
                <th key={header} className="px-4 py-2 text-left font-semibold text-gray-700">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {brands.map((brand) => (
              <tr key={brand.id}>
                <td className="px-4 py-2">{brand.name}</td>
                <td className="px-4 py-2 truncate max-w-xs">{brand.description}</td>
                <td className="px-4 py-2">{brand.industry}</td>
                <td className="px-4 py-2 space-x-2">
                  <Button variant="secondary" onClick={() => handleEdit(brand)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="danger" onClick={() => handleDelete(brand)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <p className="text-sm text-gray-400 mt-2">Loading...</p>}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingBrand ? 'Edit Brand' : 'Add Brand'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
          />
          
          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            rows={3}
          />
          
          <Textarea
            label="Mission Statement"
            value={formData.mission_statement}
            onChange={(e) => handleChange('mission_statement', e.target.value)}
            rows={3}
          />
          
          <Textarea
            label="USP Statement"
            value={formData.usp_statement}
            onChange={(e) => handleChange('usp_statement', e.target.value)}
            rows={3}
          />
          
          <Textarea
            label="Brand Persona Description"
            value={formData.brand_persona_description}
            onChange={(e) => handleChange('brand_persona_description', e.target.value)}
            rows={3}
          />
          
          <Input
            label="Target Audience"
            value={formData.target_audience}
            onChange={(e) => handleChange('target_audience', e.target.value)}
          />
          
          <Input
            label="Brand Voice"
            value={formData.brand_voice}
            onChange={(e) => handleChange('brand_voice', e.target.value)}
          />
          
          <Input
            label="Industry"
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
          />
          
          <Input
            label="Primary Color"
            value={formData.primary_color}
            onChange={(e) => handleChange('primary_color', e.target.value)}
            type="color"
          />
          
          <Input
            label="Secondary Color"
            value={formData.secondary_color}
            onChange={(e) => handleChange('secondary_color', e.target.value)}
            type="color"
          />
          
          <Button type="submit" className="w-full">
            {editingBrand ? 'Update Brand' : 'Create Brand'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}