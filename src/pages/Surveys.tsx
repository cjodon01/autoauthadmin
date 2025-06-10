import { useEffect, useState } from 'react'
import { supabase, type SurveyQuestion, type SurveyResponse } from '../lib/supabase'
import { Table } from '../components/ui/Table'
import { Button } from '../components/ui/Button'
import { RefreshCw, BarChart3, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export function Surveys() {
  const [questions, setQuestions] = useState<SurveyQuestion[]>([])
  const [responses, setResponses] = useState<SurveyResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'questions' | 'responses'>('questions')

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

  const getResponseValue = (response: SurveyResponse) => {
    if (response.response_yes_no !== null) {
      return response.response_yes_no ? 'Yes' : 'No'
    }
    if (response.response_rating !== null) {
      return `${response.response_rating}/5`
    }
    if (response.response_text) {
      return response.response_text.length > 50 
        ? `${response.response_text.substring(0, 50)}...`
        : response.response_text
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {count} responses
          </span>
        )
      },
    },
    {
      key: 'created_at',
      label: 'Created',
      render: (question: SurveyQuestion) => format(new Date(question.created_at), 'MMM d, yyyy'),
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
      render: (response: SurveyResponse) => (
        <div className="max-w-xs">
          <p className="text-sm text-gray-900">{getResponseValue(response)}</p>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Submitted',
      render: (response: SurveyResponse) => format(new Date(response.created_at), 'MMM d, yyyy HH:mm'),
    },
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
          <h1 className="text-2xl font-bold text-gray-900">Survey Data</h1>
          <p className="mt-1 text-sm text-gray-500">
            View survey questions and user responses
          </p>
        </div>
        <Button onClick={loadData} variant="secondary">
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
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Questions
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalQuestions}
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
                  <Users className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Responses
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalResponses}
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
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <span className="text-white text-sm font-medium">Avg</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Avg Responses/Question
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.avgResponsesPerQuestion}
                  </dd>
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
    </div>
  )
}