import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, RefreshCw, Plus, UserX, Key, UserCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

interface AuthUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at?: string
  email_confirmed_at?: string
  banned_until?: string
  user_metadata?: any
}

interface Profile {
  id: string
  user_id: string
  brand_name: string
  brand_bio?: string
  brand_tone?: string
  email?: string
  stripe_customer_id?: string
  subscription?: string
  tier?: 'free' | 'starter' | 'pro' | 'team' | 'enterprise'
  created_at: string
  updated_at: string
}

export function UserManagement() {
  const [authUsers, setAuthUsers] = useState<AuthUser[]>([])
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [editingProfile, setEditingProfile] = useState<Profile | null>(null)
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [newPassword, setNewPassword] = useState('')
  const [formData, setFormData] = useState({
    brand_name: '',
    brand_bio: '',
    brand_tone: '',
    email: '',
    tier: 'free' as 'free' | 'starter' | 'pro' | 'team' | 'enterprise',
  })

  useEffect(() => {
    loadData()
  }, [])

  const callAdminFunction = async (action: string, method: string = 'GET', body?: any) => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-users?action=${action}`
    const response = await fetch(url, {
      method,
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }

    return response.json()
  }

  const loadData = async () => {
    try {
      // Load auth users using admin function
      const authResult = await callAdminFunction('list')

      // Load profiles
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (profileError) throw profileError

      setAuthUsers(authResult.users || [])
      setProfiles(profileData || [])
    } catch (error: any) {
      toast.error('Failed to load user data: ' + error.message)
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditProfile = (profile: Profile) => {
    setEditingProfile(profile)
    setFormData({
      brand_name: profile.brand_name,
      brand_bio: profile.brand_bio || '',
      brand_tone: profile.brand_tone || '',
      email: profile.email || '',
      tier: profile.tier || 'free',
    })
    setModalOpen(true)
  }

  const handleCreateProfile = () => {
    setEditingProfile(null)
    setFormData({
      brand_name: '',
      brand_bio: '',
      brand_tone: '',
      email: '',
      tier: 'free',
    })
    setModalOpen(true)
  }

  const handleDeleteProfile = async (profile: Profile) => {
    if (!confirm('Are you sure you want to delete this profile? This will also delete the associated auth user.')) return

    try {
      // Delete auth user using admin function
      await callAdminFunction('delete', 'DELETE', { userId: profile.user_id })

      toast.success('User deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete user: ' + error.message)
      console.error(error)
    }
  }

  const handleSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(formData)
          .eq('id', editingProfile.id)

        if (error) throw error
        toast.success('Profile updated successfully')
      } else {
        // Create new auth user using admin function
        const authResult = await callAdminFunction('create', 'POST', {
          email: formData.email,
          password: 'TempPassword123!',
        })

        // Create profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            user_id: authResult.user.id,
            ...formData,
          }])

        if (profileError) throw profileError
        toast.success('User created successfully')
      }

      setModalOpen(false)
      setEditingProfile(null)
      loadData()
    } catch (error: any) {
      toast.error('Failed to save user: ' + error.message)
      console.error(error)
    }
  }

  const handleBanUser = async (userId: string, ban: boolean) => {
    try {
      const updates = ban 
        ? { ban_duration: '876000h' } // 100 years
        : { ban_duration: 'none' }

      await callAdminFunction('update', 'POST', {
        userId,
        updates
      })

      toast.success(`User ${ban ? 'banned' : 'unbanned'} successfully`)
      loadData()
    } catch (error: any) {
      toast.error(`Failed to ${ban ? 'ban' : 'unban'} user: ` + error.message)
      console.error(error)
    }
  }

  const handleResetPassword = async () => {
    if (!selectedUserId || !newPassword) return

    try {
      await callAdminFunction('update', 'POST', {
        userId: selectedUserId,
        updates: { password: newPassword }
      })

      toast.success('Password reset successfully')
      setPasswordModalOpen(false)
      setNewPassword('')
      setSelectedUserId('')
    } catch (error: any) {
      toast.error('Failed to reset password: ' + error.message)
      console.error(error)
    }
  }

  const openPasswordModal = (userId: string) => {
    setSelectedUserId(userId)
    setPasswordModalOpen(true)
  }

  const getUserProfile = (userId: string) => {
    return profiles.find(p => p.user_id === userId)
  }

  const isUserBanned = (user: AuthUser) => {
    return user.banned_until && new Date(user.banned_until) > new Date()
  }

  const columns = [
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      render: (user: AuthUser) => (
        <div>
          <div className="font-medium">{user.email}</div>
          <div className="text-sm text-gray-500">
            {getUserProfile(user.id)?.brand_name || 'No profile'}
          </div>
        </div>
      ),
    },
    {
      key: 'tier',
      label: 'Tier',
      render: (user: AuthUser) => {
        const profile = getUserProfile(user.id)
        const tier = profile?.tier || 'free'
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            tier === 'enterprise' ? 'bg-purple-100 text-purple-800' :
            tier === 'team' ? 'bg-blue-100 text-blue-800' :
            tier === 'pro' ? 'bg-green-100 text-green-800' :
            tier === 'starter' ? 'bg-yellow-100 text-yellow-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {tier}
          </span>
        )
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (user: AuthUser) => {
        const banned = isUserBanned(user)
        const confirmed = user.email_confirmed_at
        
        if (banned) {
          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Banned</span>
        }
        if (!confirmed) {
          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Unconfirmed</span>
        }
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
      },
    },
    {
      key: 'last_sign_in_at',
      label: 'Last Sign In',
      render: (user: AuthUser) => 
        user.last_sign_in_at 
          ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy HH:mm')
          : 'Never',
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (user: AuthUser) => format(new Date(user.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: AuthUser) => {
        const profile = getUserProfile(user.id)
        const banned = isUserBanned(user)
        
        return (
          <div className="flex space-x-1">
            {profile && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEditProfile(profile)}
                title="Edit profile"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => openPasswordModal(user.id)}
              title="Reset password"
            >
              <Key className="h-4 w-4 text-blue-500" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleBanUser(user.id, !banned)}
              title={banned ? 'Unban user' : 'Ban user'}
            >
              {banned ? (
                <UserCheck className="h-4 w-4 text-green-500" />
              ) : (
                <UserX className="h-4 w-4 text-orange-500" />
              )}
            </Button>
            {profile && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleDeleteProfile(profile)}
                title="Delete user"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]

  const tierOptions = [
    { value: 'free', label: 'Free' },
    { value: 'starter', label: 'Starter' },
    { value: 'pro', label: 'Pro' },
    { value: 'team', label: 'Team' },
    { value: 'enterprise', label: 'Enterprise' },
  ]

  const stats = {
    total: authUsers.length,
    active: authUsers.filter(u => !isUserBanned(u) && u.email_confirmed_at).length,
    banned: authUsers.filter(u => isUserBanned(u)).length,
    unconfirmed: authUsers.filter(u => !u.email_confirmed_at).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage user accounts, profiles, and authentication
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadData} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreateProfile}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">T</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">B</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Banned</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.banned}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">U</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Unconfirmed</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.unconfirmed}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table
        data={authUsers}
        columns={columns}
        loading={loading}
      />

      {/* Profile Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingProfile(null)
        }}
        title={editingProfile ? 'Edit User Profile' : 'Create New User'}
      >
        <form onSubmit={handleSubmitProfile} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={!!editingProfile}
          />
          
          <Input
            label="Brand Name"
            value={formData.brand_name}
            onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
            required
          />

          <Select
            label="Tier"
            value={formData.tier}
            onChange={(e) => setFormData({ ...formData, tier: e.target.value as any })}
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
                setEditingProfile(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingProfile ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Password Reset Modal */}
      <Modal
        isOpen={passwordModalOpen}
        onClose={() => {
          setPasswordModalOpen(false)
          setSelectedUserId('')
          setNewPassword('')
        }}
        title="Reset User Password"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Enter a new password for this user. They will be able to sign in with this password immediately.
          </p>
          
          <Input
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPasswordModalOpen(false)
                setSelectedUserId('')
                setNewPassword('')
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleResetPassword}
              disabled={!newPassword}
            >
              Reset Password
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}