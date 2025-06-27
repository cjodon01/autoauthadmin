import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminGuard } from '../lib/useadminguard';
import { Layout } from '../components/Layout';
import { Table } from '../components/ui/Table';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { RefreshCw, Eye, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface FacebookAPILog {
  id: string;
  user_id?: string;
  endpoint: string;
  method: string;
  response_code: number;
  action_type: string;
  request_body?: any;
  response_body?: any;
  error_message?: string;
  created_at: string;
  users?: {
    profiles: {
      brand_name: string;
      email?: string;
    }[];
  };
}

const FacebookAPILogs: React.FC = () => {
  const { isAdmin, loading: authLoading } = useAdminGuard();
  const [logs, setLogs] = useState<FacebookAPILog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<FacebookAPILog | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('facebook_api_logs')
        .select(`
          *,
          users!facebook_api_logs_user_id_fkey(
            profiles!profiles_user_id_fkey(
              brand_name,
              email
            )
          )
        `)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (fetchError) {
        console.error('Supabase error:', fetchError);
        throw new Error(`Failed to fetch logs: ${fetchError.message}`);
      }

      setLogs(data || []);
    } catch (err) {
      console.error('Error loading logs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadLogs();
    }
  }, [isAdmin, authLoading]);

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm:ss');
  };

  const formatJSON = (obj: any) => {
    if (!obj) return 'N/A';
    return JSON.stringify(obj, null, 2);
  };

  const getStatusColor = (code: number) => {
    if (code >= 200 && code < 300) return 'text-green-600';
    if (code >= 400 && code < 500) return 'text-yellow-600';
    if (code >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (code: number) => {
    if (code >= 200 && code < 300) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (code >= 400) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Clock className="h-4 w-4 text-gray-500" />;
  };

  const getUserInfo = (log: FacebookAPILog) => {
    const profile = log.users?.profiles?.[0];
    if (profile) {
      return `${profile.brand_name}${profile.email ? ` (${profile.email})` : ''}`;
    }
    return log.user_id || 'Unknown';
  };

  const handleRowClick = (log: FacebookAPILog) => {
    setSelectedLog(log);
    setDetailModalOpen(true);
  };

  const truncateEndpoint = (endpoint: string) => {
    if (endpoint.length <= 40) return endpoint;
    return `${endpoint.substring(0, 37)}...`;
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!isAdmin) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-lg text-red-600">Access denied. Admin privileges required.</div>
        </div>
      </Layout>
    );
  }

  const columns = [
    {
      key: 'created_at',
      label: 'Timestamp',
      render: (log: FacebookAPILog) => (
        <span className="text-sm text-gray-600">
          {formatDate(log.created_at)}
        </span>
      )
    },
    {
      key: 'user',
      label: 'User',
      render: (log: FacebookAPILog) => (
        <div className="max-w-xs">
          <span className="text-sm truncate block">
            {getUserInfo(log)}
          </span>
        </div>
      )
    },
    {
      key: 'action_type',
      label: 'Action',
      render: (log: FacebookAPILog) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {log.action_type}
        </span>
      )
    },
    {
      key: 'method',
      label: 'Method',
      render: (log: FacebookAPILog) => (
        <span className="font-mono text-sm font-medium">
          {log.method}
        </span>
      )
    },
    {
      key: 'endpoint',
      label: 'Endpoint',
      render: (log: FacebookAPILog) => (
        <span className="font-mono text-sm text-gray-600" title={log.endpoint}>
          {truncateEndpoint(log.endpoint)}
        </span>
      )
    },
    {
      key: 'response_code',
      label: 'Status',
      render: (log: FacebookAPILog) => (
        <div className="flex items-center space-x-2">
          {getStatusIcon(log.response_code)}
          <span className={`font-bold ${getStatusColor(log.response_code)}`}>
            {log.response_code}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (log: FacebookAPILog) => (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleRowClick(log)}
          title="View details"
        >
          <Eye className="h-4 w-4" />
        </Button>
      )
    }
  ];

  const stats = {
    total: logs.length,
    success: logs.filter(log => log.response_code >= 200 && log.response_code < 300).length,
    clientErrors: logs.filter(log => log.response_code >= 400 && log.response_code < 500).length,
    serverErrors: logs.filter(log => log.response_code >= 500).length,
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Facebook API Logs</h1>
            <p className="mt-1 text-sm text-gray-500">
              Monitor Facebook API requests and responses for debugging and analytics
            </p>
          </div>
          <Button onClick={loadLogs} disabled={loading} variant="secondary">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
              <div className="text-red-800">
                <strong>Error:</strong> {error}
              </div>
            </div>
          </div>
        )}

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
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Requests</dt>
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
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Success (2xx)</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.success}</dd>
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
                    <span className="text-white text-sm font-medium">4xx</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Client Errors</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.clientErrors}</dd>
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
                    <span className="text-white text-sm font-medium">5xx</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Server Errors</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.serverErrors}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading logs...</div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No API logs found.</div>
              </div>
            ) : (
              <Table
                data={logs}
                columns={columns}
                loading={loading}
              />
            )}
          </div>
        </div>

        {/* Detail Modal */}
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLog(null);
          }}
          title="API Log Details"
          size="xl"
        >
          {selectedLog && (
            <div className="space-y-6">
              {/* Header Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Request Info</h4>
                  <div className="bg-gray-50 rounded-md p-3 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Method:</span>
                      <span className="text-sm font-mono">{selectedLog.method}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Action:</span>
                      <span className="text-sm">{selectedLog.action_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(selectedLog.response_code)}
                        <span className={`text-sm font-bold ${getStatusColor(selectedLog.response_code)}`}>
                          {selectedLog.response_code}
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Timestamp:</span>
                      <span className="text-sm">{formatDate(selectedLog.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">User Info</h4>
                  <div className="bg-gray-50 rounded-md p-3">
                    <div className="text-sm">{getUserInfo(selectedLog)}</div>
                    {selectedLog.user_id && (
                      <div className="text-xs text-gray-500 mt-1">ID: {selectedLog.user_id}</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Endpoint */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Endpoint</h4>
                <div className="bg-gray-50 rounded-md p-3">
                  <code className="text-sm text-gray-700 break-all">{selectedLog.endpoint}</code>
                </div>
              </div>

              {/* Request Body */}
              {selectedLog.request_body && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Request Body</h4>
                  <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {formatJSON(selectedLog.request_body)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Response Body */}
              {selectedLog.response_body && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Response Body</h4>
                  <div className="bg-gray-50 rounded-md p-3 max-h-64 overflow-y-auto">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {formatJSON(selectedLog.response_body)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {selectedLog.error_message && (
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Error Message</h4>
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{selectedLog.error_message}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </Modal>
      </div>
    </Layout>
  );
};

export default FacebookAPILogs;

export { FacebookAPILogs }