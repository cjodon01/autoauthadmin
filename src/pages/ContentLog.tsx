import { useEffect, useState } from 'react'
import { supabase, type PostLog } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { RefreshCw, Eye } from 'lucide-react'
import { Modal } from '../components/ui/Modal'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function ContentLog() {
  const [posts, setPosts] = useState<PostLog[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedPost, setSelectedPost] = useState<PostLog | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts_log')
        .select(`
          *,
          campaigns!posts_log_campaign_id_fkey(campaign_name),
          social_pages!posts_log_page_id_fkey(page_name, provider)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (error: any) {
      toast.error('Failed to load content log')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewContent = (post: PostLog) => {
    setSelectedPost(post)
    setModalOpen(true)
  }

  const getStatusBadge = (post: PostLog) => {
    if (post.posted_at) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Posted
        </span>
      )
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          Generated
        </span>
      )
    }
  }

  const columns = [
    {
      key: 'campaign',
      label: 'Campaign',
      render: (post: any) => post.campaigns?.campaign_name || '-',
    },
    {
      key: 'page',
      label: 'Social Page',
      render: (post: any) => (
        <div>
          <div className="font-medium">{post.social_pages?.page_name || '-'}</div>
          <div className="text-sm text-gray-500 capitalize">
            {post.social_pages?.provider || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'content_preview',
      label: 'Content Preview',
      render: (post: PostLog) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">
            {post.generated_content.substring(0, 100)}
            {post.generated_content.length > 100 ? '...' : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (post: PostLog) => getStatusBadge(post),
    },
    {
      key: 'posted_at',
      label: 'Posted At',
      render: (post: PostLog) => 
        post.posted_at 
          ? format(new Date(post.posted_at), 'MMM d, yyyy HH:mm')
          : '-',
    },
    {
      key: 'created_at',
      label: 'Generated At',
      render: (post: PostLog) => format(new Date(post.created_at), 'MMM d, yyyy HH:mm'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (post: PostLog) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleViewContent(post)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      ),
    },
  ]

  const stats = {
    total: posts.length,
    posted: posts.filter(p => p.posted_at).length,
    generated: posts.filter(p => !p.posted_at).length,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Content Log</h1>
          <p className="mt-1 text-sm text-gray-500">
            View generated and posted content across all campaigns
          </p>
        </div>
        <Button onClick={loadPosts} variant="secondary">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
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
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Content
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.total}
                  </dd>
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
                  <span className="text-white text-sm font-medium">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Posted
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.posted}
                  </dd>
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
                  <span className="text-white text-sm font-medium">G</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Generated Only
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.generated}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Table
        data={posts}
        columns={columns}
        loading={loading}
      />

      {/* Content Detail Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedPost(null)
        }}
        title="Content Details"
        size="lg"
      >
        {selectedPost && (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Generated Content</h4>
              <div className="bg-gray-50 rounded-md p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {selectedPost.generated_content}
                </p>
              </div>
            </div>

            {selectedPost.ai_prompt_used && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">AI Prompt Used</h4>
                <div className="bg-gray-50 rounded-md p-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">
                    {selectedPost.ai_prompt_used}
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-900">Status:</span>
                <div className="mt-1">{getStatusBadge(selectedPost)}</div>
              </div>
              <div>
                <span className="font-medium text-gray-900">Generated:</span>
                <p className="text-gray-700 mt-1">
                  {format(new Date(selectedPost.created_at), 'MMM d, yyyy HH:mm')}
                </p>
              </div>
              {selectedPost.posted_at && (
                <div>
                  <span className="font-medium text-gray-900">Posted:</span>
                  <p className="text-gray-700 mt-1">
                    {format(new Date(selectedPost.posted_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}