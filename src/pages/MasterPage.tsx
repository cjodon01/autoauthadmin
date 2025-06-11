import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from '../components/Layout'

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
        .maybeSingle()

      setIsAdmin(!!data)
    }

    checkAdmin()
  }, [navigate])

  if (isAdmin === null) return <div>Loading...</div>
  if (!isAdmin) return <AccessDenied />

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/users" element={<Users />} />
        <Route path="/user-management" element={<UserManagement />} />
        <Route path="/social-connections" element={<SocialConnections />} />
        <Route path="/social-pages" element={<SocialPagesManagement />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/brands" element={<Brands />} />
        <Route path="/ai-config" element={<AIConfig />} />
        <Route path="/content-log" element={<ContentLog />} />
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/survey-management" element={<SurveyManagement />} />
        <Route path="/analytics" element={<AnalyticsManagement />} />
        <Route path="/access-denied" element={<AccessDenied />} />
      </Routes>
    </Layout>
  )
}