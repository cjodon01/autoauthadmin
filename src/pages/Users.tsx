import { useEffect, useState } from 'react'
import { supabase, type Profile } from '../lib/supabase'
import { ResponsiveTable } from '../components/ui/ResponsiveTable'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card'
import { StatsGrid } from '../components/ui/StatsGrid'
import { ActionSheet } from '../components/ui/ActionSheet'
import { Edit, Trash2, Plus, Users as UsersIcon, Crown, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function Users() {
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [actionSheetOpen, setActionSheetOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Profile | null>(null)
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
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

  const handleMobileItemClick = (user: Profile) => {
    setSelectedUser(user)
    setActionSheetOpen(true)
  }

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return Crown
      case 'pro':
      case 'team':
        return Star
      default:
        return UsersIcon
    }
  }

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-800'
      case 'team':
        return 'bg-blue-100 text-blue-800'
      case 'pro':
        return 'bg-green-100 text-green-800'
      case 'starter':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const columns = [
    {
      key: 'brand_name',
      label: 'Brand Name',
      mobileLabel: 'Name',
      priority: 'high' as const,
      sortable: true,
    },
    {
      key: 'email',
      label: 'Email',
      priority: 'high' as const,
      sortable: true,
      render: (user: Profile) => user.email || '-',
    },
    {
      key: 'tier',
      label: 'Tier',
      priority: 'high' as const,
      render: (user: Profile) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTierColor(user.tier || 'free')}`}>
          {user.tier || 'free'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      priority: 'medium' as const,
      render: (user: Profile) => format(new Date(user.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      priority: 'low' as const,
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

  const tierStats = [
    {
      label: 'Total Users',
      value: users.length,
      icon: UsersIcon,
      color: 'bg-blue-500',
    },
    {
      label: 'Free Tier',
      value: users.filter(u => (u.tier || 'free') === 'free').length,
      icon: UsersIcon,
      color: 'bg-gray-500',
    },
    {
      label: 'Paid Users',
      value: users.filter(u => u.tier && u.tier !== 'free').length,
      icon: Star,
      color: 'bg-green-500',
    },
    {
      label: 'Enterprise',
      value: users.filter(u => u.tier === 'enterprise').length,
      icon: Crown,
      color: 'bg-purple-500',
    },
  ]

  const actionSheetActions = selectedUser ? [
    {
      label: 'Edit User',
      icon: Edit,
      onClick: () => handleEdit(selectedUser),
    },
    {
      label: 'Delete User',
      icon: Trash2,
      onClick: () => handleDelete(selectedUser),
      variant: 'danger' as const,
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user profiles and subscription tiers
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Stats */}
      <StatsGrid stats={tierStats} columns={2} />

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent padding="none">
          <div className="p-6">
            <ResponsiveTable
              data={users}
              columns={columns}
              loading={loading}
              onItemClick={handleMobileItemClick}
              emptyMessage="No users found"
            />
          </div>
        </CardContent>
      </Card>

      {/* Edit Modal */}
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

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingUser(null)
              }}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button type="submit" className="w-full sm:w-auto">
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Mobile Action Sheet */}
      <ActionSheet
        isOpen={actionSheetOpen}
        onClose={() => {
          setActionSheetOpen(false)
          setSelectedUser(null)
        }}
        title={selectedUser?.brand_name || 'User Actions'}
        actions={actionSheetActions}
      />
    </div>
  )
}