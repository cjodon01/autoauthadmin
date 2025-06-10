import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Shield, ArrowLeft } from 'lucide-react'

export function AccessDenied() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <div className="mx-auto h-24 w-24 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-12 w-12 text-red-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You don't have permission to access this admin portal.
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Only authorized administrators can access this system.
          </p>
        </div>
        
        <div className="mt-8">
          <Button
            onClick={() => navigate('/login')}
            className="w-full"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Button>
        </div>
      </div>
    </div>
  )
}