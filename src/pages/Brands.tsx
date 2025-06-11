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
    setFormData({ ...brand })
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
                  <Button variant="outline" onClick={() => handleEdit(brand)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="destructive" onClick={() => handleDelete(brand)}>
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
          {Object.entries(formData).map(([key, value]) => (
            <Input
              key={key}
              label={key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              value={value}
              onChange={(val) => handleChange(key, val)}
            />
          ))}
          <Button type="submit" className="w-full">
            {editingBrand ? 'Update Brand' : 'Create Brand'}
          </Button>
        </form>
      </Modal>
    </div>
  )
}
