import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { Users } from './pages/Users'
import { SocialConnections } from './pages/SocialConnections'
import { Campaigns } from './pages/Campaigns'
import { Brands } from './pages/Brands'
import { AIConfig } from './pages/AIConfig'
import { ContentLog } from './pages/ContentLog'
import { Surveys } from './pages/Surveys'

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Routes>
          {/* Default route - login page */}
          <Route path="/" element={<Login />} />
          
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/social-connections" element={
            <ProtectedRoute>
              <Layout>
                <SocialConnections />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/campaigns" element={
            <ProtectedRoute>
              <Layout>
                <Campaigns />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/brands" element={
            <ProtectedRoute>
              <Layout>
                <Brands />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/ai-config" element={
            <ProtectedRoute>
              <Layout>
                <AIConfig />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/content-log" element={
            <ProtectedRoute>
              <Layout>
                <ContentLog />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/surveys" element={
            <ProtectedRoute>
              <Layout>
                <Surveys />
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
        <Toaster position="top-right" />
      </div>
    </AuthProvider>
  )
}

export default App