import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAdminGuard } from '../lib/useadminguard';
import { Layout } from '../components/Layout';
import Table from '../components/ui/Table';
import { Button } from '../components/ui/Button';

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

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query facebook_api_logs and join with users, then profiles
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
    return new Date(dateString).toLocaleString();
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

  const getUserInfo = (log: FacebookAPILog) => {
    const profile = log.users?.profiles?.[0];
    if (profile) {
      return `${profile.brand_name}${profile.email ? ` (${profile.email})` : ''}`;
    }
    return log.user_id || 'Unknown';
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
      header: 'Timestamp',
      render: (log: FacebookAPILog) => (
        <span className="text-sm text-gray-600">
          {formatDate(log.created_at)}
        </span>
      )
    },
    {
      key: 'user',
      header: 'User',
      render: (log: FacebookAPILog) => (
        <span className="text-sm">
          {getUserInfo(log)}
        </span>
      )
    },
    {
      key: 'action_type',
      header: 'Action',
      render: (log: FacebookAPILog) => (
        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
          {log.action_type}
        </span>
      )
    },
    {
      key: 'method',
      header: 'Method',
      render: (log: FacebookAPILog) => (
        <span className="font-mono text-sm">
          {log.method}
        </span>
      )
    },
    {
      key: 'endpoint',
      header: 'Endpoint',
      render: (log: FacebookAPILog) => (
        <span className="font-mono text-sm text-gray-600 truncate max-w-xs">
          {log.endpoint}
        </span>
      )
    },
    {
      key: 'response_code',
      header: 'Status',
      render: (log: FacebookAPILog) => (
        <span className={`font-bold ${getStatusColor(log.response_code)}`}>
          {log.response_code}
        </span>
      )
    },
    {
      key: 'error_message',
      header: 'Error',
      render: (log: FacebookAPILog) => (
        <span className="text-sm text-red-600 truncate max-w-xs">
          {log.error_message || '-'}
        </span>
      )
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Facebook API Logs</h1>
          <Button onClick={loadLogs} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-red-800">
              <strong>Error:</strong> {error}
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                API Request Logs
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Monitor Facebook API requests and responses for debugging and analytics.
              </p>
            </div>

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
                onRowClick={(log) => {
                  // Show detailed view in a modal or expand row
                  console.log('Log details:', log);
                }}
              />
            )}
          </div>
        </div>

        {logs.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Total Requests:</span>
                <span className="ml-2 font-medium">{logs.length}</span>
              </div>
              <div>
                <span className="text-gray-500">Success (2xx):</span>
                <span className="ml-2 font-medium text-green-600">
                  {logs.filter(log => log.response_code >= 200 && log.response_code < 300).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Client Errors (4xx):</span>
                <span className="ml-2 font-medium text-yellow-600">
                  {logs.filter(log => log.response_code >= 400 && log.response_code < 500).length}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Server Errors (5xx):</span>
                <span className="ml-2 font-medium text-red-600">
                  {logs.filter(log => log.response_code >= 500).length}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default FacebookAPILogs;

export { FacebookAPILogs }