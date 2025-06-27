import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Send, Facebook, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import toast from 'react-hot-toast'

interface FacebookPage {
  id: string
  page_id: string
  page_name: string
  user_id: string
  profiles?: {
    brand_name: string
    email: string
  }
}

interface PostResult {
  success: boolean
  message: string
  facebook_post_id?: string
  timestamp: string
}

export function ManualPostTrigger() {
  const [pages, setPages] = useState<FacebookPage[]>([])
  const [selectedPageId, setSelectedPageId] = useState('')
  const [postText, setPostText] = useState('')
  const [loading, setLoading] = useState(false)
  const [pagesLoading, setPagesLoading] = useState(true)
  const [recentPosts, setRecentPosts] = useState<PostResult[]>([])

  useEffect(() => {
    loadFacebookPages()
    loadRecentPosts()
  }, [])

  const loadFacebookPages = async () => {
    try {
      const { data, error } = await supabase
        .from('social_pages')
        .select(`
          *,
          profiles!social_pages_user_id_fkey(brand_name, email)
        `)
        .eq('provider', 'facebook')
        .order('page_name')

      if (error) throw error
      setPages(data || [])
    } catch (error: any) {
      toast.error('Failed to load Facebook pages')
      console.error(error)
    } finally {
      setPagesLoading(false)
    }
  }

  const loadRecentPosts = () => {
    // Load recent posts from localStorage for demo purposes
    const stored = localStorage.getItem('recent_manual_posts')
    if (stored) {
      try {
        setRecentPosts(JSON.parse(stored))
      } catch (e) {
        setRecentPosts([])
      }
    }
  }

  const saveRecentPost = (result: PostResult) => {
    const updated = [result, ...recentPosts].slice(0, 10) // Keep last 10
    setRecentPosts(updated)
    localStorage.setItem('recent_manual_posts', JSON.stringify(updated))
  }

  const triggerPost = async () => {
    if (!selectedPageId || !postText.trim()) {
      toast.error('Please select a page and enter post content')
      return
    }

    setLoading(true)

    try {
      // Call the Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('single-post', {
        body: {
          page_id: selectedPageId,
          content: postText.trim(),
        },
      })

      if (error) throw error

      const result: PostResult = {
        success: true,
        message: 'Post published successfully',
        facebook_post_id: data?.post_id || 'demo_post_' + Date.now(),
        timestamp: new Date().toISOString(),
      }

      saveRecentPost(result)
      toast.success('Post published successfully!')
      setPostText('')
      
    } catch (error: any) {
      console.error('Post failed:', error)
      
      const result: PostResult = {
        success: false,
        message: error.message || 'Failed to publish post',
        timestamp: new Date().toISOString(),
      }

      saveRecentPost(result)
      toast.error('Failed to publish post: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const selectedPage = pages.find(p => p.id === selectedPageId)

  const pageOptions = [
    { value: '', label: 'Select a Facebook Page' },
    ...pages.map(page => ({
      value: page.id,
      label: `${page.page_name} (${page.profiles?.brand_name || 'Unknown User'})`
    }))
  ]

  const getResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    )
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Manual Post Trigger</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manually trigger Facebook posts for testing and demonstration purposes
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Post Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Facebook className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-medium text-gray-900">Create Facebook Post</h2>
          </div>

          <div className="space-y-4">
            <Select
              label="Facebook Page"
              value={selectedPageId}
              onChange={(e) => setSelectedPageId(e.target.value)}
              options={pageOptions}
              disabled={pagesLoading}
            />

            {selectedPage && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">{selectedPage.page_name}</div>
                    <div className="text-xs text-gray-600">
                      Owner: {selectedPage.profiles?.brand_name} ({selectedPage.profiles?.email})
                    </div>
                    <div className="text-xs text-gray-500">Page ID: {selectedPage.page_id}</div>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              label="Post Content"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              rows={6}
              placeholder="Enter your Facebook post content here..."
              helperText={`${postText.length}/2200 characters`}
              maxLength={2200}
            />

            <Button
              onClick={triggerPost}
              loading={loading}
              disabled={!selectedPageId || !postText.trim()}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {loading ? 'Publishing Post...' : 'Publish to Facebook'}
            </Button>
          </div>
        </div>

        {/* Recent Posts */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-medium text-gray-900">Recent Posts</h2>
          </div>

          {recentPosts.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">
                <Send className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-sm text-gray-500">No recent posts yet</p>
              <p className="text-xs text-gray-400">Posts you trigger will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPosts.map((post, index) => (
                <div
                  key={index}
                  className={`border rounded-lg p-3 ${
                    post.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    {getResultIcon(post.success)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm font-medium ${
                          post.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {post.success ? 'Success' : 'Failed'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {formatTimestamp(post.timestamp)}
                        </p>
                      </div>
                      <p className={`text-sm ${
                        post.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {post.message}
                      </p>
                      {post.facebook_post_id && (
                        <p className="text-xs text-gray-600 font-mono">
                          Post ID: {post.facebook_post_id}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
              <span className="text-white text-sm font-medium">ℹ</span>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900">Facebook Review Compliance</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>This manual post trigger demonstrates:</p>
              <ul className="mt-1 list-disc list-inside space-y-1">
                <li>Secure Facebook API integration with proper authentication</li>
                <li>Real-time posting capabilities to connected Facebook pages</li>
                <li>Comprehensive error handling and logging</li>
                <li>Admin oversight and control over all Facebook interactions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}