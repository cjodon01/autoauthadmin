import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './Login'
import { Dashboard } from './Dashboard'
import { Users } from './Users'
import { UserManagement } from './UserManagement'
import { SocialConnections } from './SocialConnections'
import { SocialPagesManagement } from './SocialPagesManagement'
import { Campaigns } from './Campaigns'
import { Brands } from './Brands'
import { AIConfig } from './AIConfig'
import { ContentLog } from './ContentLog'
import { Surveys } from './Surveys'
import { AccessDenied } from './AccessDenied'
import { SurveyManagement } from './SurveyManagement'
import { AnalyticsManagement } from './AnalyticsManagement'
// ... import the rest of your pages

export function MasterPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        navigate('/login')
        return
      }

      const { data } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', user.id)
        .single()

      setIsAdmin(!!data)
    }

    checkAdmin()
  }, [navigate])

  if (isAdmin === null) return <div>Loading...</div>
  if (!isAdmin) return <AccessDenied />

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/brands" element={<Brands />} />
      <Route path="/campaigns" element={<Campaigns />} />
      {/* Add other protected routes here */}
    </Routes>
  )
}
