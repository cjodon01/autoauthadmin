import { useEffect, useState } from 'react'
import { supabase, type Profile } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function Users() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [formData, setFormData] = useState({
    brand_name: '',
    brand_bio: '',
    brand_tone: '',
    email: '',
    tier: 'free' as 'free' | 'starter' | 'pro' | 'team' | 'enterprise',
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error: any) {
      toast.error('Failed to load users')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: Profile) => {
    setEditingUser(user)
    setFormData({
      brand_name: user.brand_name,
      brand_bio: user.brand_bio || '',
      brand_tone: user.brand_tone || '',
      email: user.email || '',
      tier: user.tier || 'free',
    })
    setModalOpen(true)
  }

  const handleDelete = async (user: Profile) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', user.id)

      if (error) throw error
      toast.success('User deleted successfully')
      loadUsers()
    } catch (error: any) {
      toast.error('Failed to delete user')
      console.error(error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUser) {
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', editingUser.id)

        if (error) throw error
        toast.success('User updated successfully')
      }

      setModalOpen(false)
      setEditingUser(null)
      loadUsers()
    } catch (error: any) {
      toast.error('Failed to save user')
      console.error(error)
    }
  }

  const columns = [
    {
      key: 'brand_name',
      label: 'Brand Name',
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user: Profile) => user.email || '-',
    },
    {
      key: 'tier',
      label: 'Tier',
      render: (user: Profile) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          user.tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
          user.tier === 'team' ? 'bg-blue-100 text-blue-800' :
          user.tier === 'pro' ? 'bg-green-100 text-green-800' :
          user.tier === 'starter' ? 'bg-yellow-100 text-yellow-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {user.tier || 'free'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (user: Profile) => format(new Date(user.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: Profile) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(user)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDelete(user)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const tierOptions = [
    { value: 'free', label: 'Free' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user profiles and subscription tiers
          </p>
        </div>
      </div>

      <Table
        data={users}
        columns={columns}
        loading={loading}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingUser(null)
        }}
        title={editingUser ? 'Edit User' : 'Add User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Brand Name"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            required
          />
          
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Select
            label="Tier"
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value as 'free' | 'starter' | 'pro' | 'team' | 'enterprise' })}
            options={tierOptions}
          />

          <Textarea
            label="Brand Bio"
            value={formData.brand_bio}
            onChange={(e) => setFormData({ ...formData, brand_bio: e.target.value })}
            rows={3}
          />

          <Input
            label="Brand Tone"
            value={formData.brand_tone}
            onChange={(e) => setFormData({ ...formData, brand_tone: e.target.value })}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingUser(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}