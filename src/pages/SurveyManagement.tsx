import React, { useEffect, useState } from 'react'
import { supabase, type SurveyQuestion } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
//import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Textarea } from '../components/ui/Textarea'
import { Edit, Trash2, RefreshCw, Plus, BarChart3, Users, Eye } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function SurveyManagement() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responses, setResponses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'questions' | 'responses'>('questions')
  const [modalOpen, setModalOpen] = useState(false)
  const [responseModalOpen, setResponseModalOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<SurveyQuestion | null>(null)
  const [selectedResponses, setSelectedResponses] = useState<any[]>([])
  const [formData, setFormData] = useState({
    question_text: '',
    question_type: 'text',
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [questionsResult, responsesResult] = await Promise.all([
        supabase.from('survey_questions').select('*').order('created_at', { ascending: false }),
        supabase.from('survey_responses').select(`
          *,
          survey_questions!survey_responses_question_id_fkey(question_text, question_type),
          profiles!survey_responses_user_id_fkey(brand_name, email)
        `).order('created_at', { ascending: false })
      ])

      if (questionsResult.error) throw questionsResult.error
      if (responsesResult.error) throw responsesResult.error

      setQuestions(questionsResult.data || [])
      setResponses(responsesResult.data || [])
    } catch (error: any) {
      toast.error('Failed to load survey data')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleEditQuestion = (question: SurveyQuestion) => {
    setEditingQuestion(question)
    setFormData({
      question_text: question.question_text,
      question_type: question.question_type,
    })
    setModalOpen(true)
  }

  const handleCreateQuestion = () => {
    setEditingQuestion(null)
    setFormData({
      question_text: '',
      question_type: 'text',
    })
    setModalOpen(true)
  }

  const handleDeleteQuestion = async (question: SurveyQuestion) => {
    if (!confirm('Are you sure you want to delete this question? This will also delete all associated responses.')) return

    try {
      const { error } = await supabase
        .from('survey_questions')
        .delete()
        .eq('id', question.id)

      if (error) throw error
      toast.success('Question deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete question')
      console.error(error)
    }
  }

  const handleDeleteResponse = async (response: any) => {
    if (!confirm('Are you sure you want to delete this response?')) return

    try {
      const { error } = await supabase
        .from('survey_responses')
        .delete()
        .eq('id', response.id)

      if (error) throw error
      toast.success('Response deleted successfully')
      loadData()
    } catch (error: any) {
      toast.error('Failed to delete response')
      console.error(error)
    }
  }

  const handleSubmitQuestion = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from('survey_questions')
          .update(formData)
          .eq('id', editingQuestion.id)

        if (error) throw error
        toast.success('Question updated successfully')
      } else {
        const { error } = await supabase
          .from('survey_questions')
          .insert([formData])

        if (error) throw error
        toast.success('Question created successfully')
      }

      setModalOpen(false)
      setEditingQuestion(null)
      loadData()
    } catch (error: any) {
      toast.error('Failed to save question')
      console.error(error)
    }
  }

  const handleViewResponses = (questionId: string) => {
    const questionResponses = responses.filter(r => r.question_id === questionId)
    setSelectedResponses(questionResponses)
    setResponseModalOpen(true)
  }

  const getQuestionTypeIcon = (type: string) => {
    switch (type) {
      case 'yes_no':
        return '✓/✗'
      case 'rating_1_5':
        return '⭐'
      case 'text':
        return '📝'
      default:
        return '❓'
    }
  }

  const getResponseValue = (response: any) => {
    if (response.response_yes_no !== null) {
      return response.response_yes_no ? 'Yes' : 'No'
    }
    if (response.response_rating !== null) {
      return `${response.response_rating}/5`
    }
    if (response.response_text) {
      return response.response_text
    }
    return '-'
  }

  const questionColumns = [
    {
      key: 'question_type',
      label: 'Type',
      render: (question: SurveyQuestion) => (
        <div className="flex items-center space-x-2">
          <span className="text-lg">{getQuestionTypeIcon(question.question_type)}</span>
          <span className="capitalize text-sm">{question.question_type.replace('_', ' ')}</span>
        </div>
      ),
    },
    {
      key: 'question_text',
      label: 'Question',
      render: (question: SurveyQuestion) => (
        <div className="max-w-md">
          <p className="text-sm text-gray-900">{question.question_text}</p>
        </div>
      ),
    },
    {
      key: 'responses_count',
      label: 'Responses',
      render: (question: SurveyQuestion) => {
        const count = responses.filter(r => r.question_id === question.id).length
        return (
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {count} responses
            </span>
            {count > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleViewResponses(question.id)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (question: SurveyQuestion) => format(new Date(question.created_at), 'MMM d, yyyy'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (question: SurveyQuestion) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEditQuestion(question)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleDeleteQuestion(question)}
          >
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ]

  const responseColumns = [
    {
      key: 'question',
      label: 'Question',
      render: (response: any) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900 truncate">
            {response.survey_questions?.question_text || '-'}
          </p>
          <p className="text-xs text-gray-500 capitalize">
            {response.survey_questions?.question_type?.replace('_', ' ') || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'user',
      label: 'User',
      render: (response: any) => (
        <div>
          <div className="font-medium text-sm">{response.profiles?.brand_name || 'Unknown'}</div>
          <div className="text-xs text-gray-500">{response.profiles?.email || '-'}</div>
        </div>
      ),
    },
    {
      key: 'response',
      label: 'Response',
      render: (response: any) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900">{getResponseValue(response)}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (response: any) => format(new Date(response.created_at), 'MMM d, yyyy HH:mm'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (response: any) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleDeleteResponse(response)}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      ),
    },
  ]

  const questionTypeOptions = [
    { value: 'text', label: 'Text' },
    { value: 'yes_no', label: 'Yes/No' },
    { value: 'rating_1_5', label: 'Rating (1-5)' },
  ]

  const stats = {
    totalQuestions: questions.length,
    totalResponses: responses.length,
    avgResponsesPerQuestion: questions.length > 0 ? Math.round(responses.length / questions.length * 10) / 10 : 0,
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Survey Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage survey questions and view user responses
          </p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={loadData} variant="secondary">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          {activeTab === 'questions' && (
            <Button onClick={handleCreateQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Questions</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalQuestions}</dd>
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
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Responses</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalResponses}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Avg</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Responses/Question</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.avgResponsesPerQuestion}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questions'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 inline mr-2" />
            Questions ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('responses')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'responses'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Responses ({responses.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'questions' ? (
        <Table
          data={questions}
          columns={questionColumns}
          loading={loading}
        />
      ) : (
        <Table
          data={responses}
          columns={responseColumns}
          loading={loading}
        />
      )}

      {/* Question Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingQuestion(null)
        }}
        title={editingQuestion ? 'Edit Question' : 'Add Question'}
      >
        <form onSubmit={handleSubmitQuestion} className="space-y-4">
          <Select
            label="Question Type"
            value={formData.question_type}
            onChange={(e) => setFormData({ ...formData, question_type: e.target.value })}
            options={questionTypeOptions}
          />

          <Textarea
            label="Question Text"
            value={formData.question_text}
            onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
            rows={3}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setModalOpen(false)
                setEditingQuestion(null)
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingQuestion ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Responses Modal */}
      <Modal
        isOpen={responseModalOpen}
        onClose={() => {
          setResponseModalOpen(false)
          setSelectedResponses([])
        }}
        title="Question Responses"
        size="lg"
      >
        <div className="space-y-4">
          {selectedResponses.length > 0 ? (
            <div className="space-y-3">
              {selectedResponses.map((response) => (
                <div key={response.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {response.profiles?.brand_name || 'Unknown User'}
                      </div>
                      <div className="text-xs text-gray-500 mb-2">
                        {response.profiles?.email || '-'} • {format(new Date(response.created_at), 'MMM d, yyyy HH:mm')}
                      </div>
                      <div className="text-sm text-gray-900">
                        <strong>Response:</strong> {getResponseValue(response)}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDeleteResponse(response)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No responses for this question yet.</p>
          )}
        </div>
      </Modal>
    </div>
  )
}