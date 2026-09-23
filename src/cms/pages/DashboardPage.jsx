import React from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiHelpCircle, FiLink, FiMap, FiImage, FiUsers, FiExternalLink } from 'react-icons/fi';
import { useResource } from '../components/useResource';
import { Alert, Badge, Card, PageHeader, Spinner, Table, Button } from '../components/ui';
import { formatBytes, formatDateTime } from '../lib/format';

const ACTION_LABELS = {
  create: 'added', update: 'updated', delete: 'deleted', upload: 'uploaded',
  login: 'signed in', logout: 'signed out', login_failed: 'failed to sign in',
  password_change: 'changed password', password_reset: 'reset password'
};

function StatCard({ to, icon: Icon, label, value, detail }) {
  return (
    <Link to={to} className="block bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:border-primary-300 hover:shadow transition">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500">{label}</span>
        <Icon className="h-5 w-5 text-primary-500" aria-hidden="true" />
      </div>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value ?? '–'}</p>
      {detail && <p className="text-xs text-gray-500 mt-1">{detail}</p>}
    </Link>
  );
}

export default function DashboardPage() {
  const { data, error, loading, reload } = useResource('/api/cms/dashboard');
  const counts = data?.counts ?? {};

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="What the kiosk is showing right now. Changes made here appear on the kiosk within ten minutes, or immediately after its Refresh button is tapped."
        actions={
          <Button variant="secondary" onClick={() => window.open('../', '_blank', 'noopener')}>
            <FiExternalLink aria-hidden="true" /> Open kiosk
          </Button>
        }
      />
      {error && <Alert tone="error" className="mb-4">{error.message} <button type="button" className="underline" onClick={reload}>Retry</button></Alert>}
      {loading && !data ? (
        <div className="flex justify-center py-16"><Spinner className="w-6 h-6 text-primary-600" /></div>
      ) : data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            <StatCard to="/announcements" icon={FiBell} label="Announcements" value={counts.announcements} detail={`${counts.liveAnnouncements} live on the kiosk`} />
            <StatCard to="/faqs" icon={FiHelpCircle} label="FAQs" value={counts.faqs} />
            <StatCard to="/qr-links" icon={FiLink} label="QR links" value={counts.qrLinks} />
            <StatCard to="/map" icon={FiMap} label="Floors" value={counts.floors} detail={`${counts.locations} locations on the map`} />
            <StatCard to="/media" icon={FiImage} label="Images" value={counts.media} detail={formatBytes(counts.mediaBytes)} />
            <StatCard to="/users" icon={FiUsers} label="Active users" value={counts.users} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="System" className="lg:col-span-1">
              <dl className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Database</dt>
                  <dd><Badge tone={data.health.db === 'ok' ? 'green' : 'red'}>{data.health.db}</Badge></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Image storage</dt>
                  <dd><Badge tone={data.health.storage === 'ok' ? 'green' : 'red'}>{data.health.storage}</Badge></dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Last content change</dt>
                  <dd className="text-gray-800">{formatDateTime(counts.lastContentChange) || 'never'}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">Server version</dt>
                  <dd className="text-gray-800 font-mono text-xs">{data.health.version}</dd>
                </div>
              </dl>
            </Card>
            <Card title="Recent activity" className="lg:col-span-2" padded={false}>
              <Table
                columns={[
                  { key: 'at', label: 'When', render: (row) => <span className="whitespace-nowrap text-gray-500">{formatDateTime(row.at)}</span> },
                  { key: 'username', label: 'Who', render: (row) => row.username ?? '–' },
                  {
                    key: 'action', label: 'What',
                    render: (row) => (
                      <span>
                        {ACTION_LABELS[row.action] ?? row.action} {row.entity.replace('_', ' ')}
                        {row.details?.title || row.details?.name || row.details?.question ? (
                          <span className="text-gray-500"> “{row.details.title ?? row.details.name ?? row.details.question}”</span>
                        ) : row.details?.username ? <span className="text-gray-500"> {row.details.username}</span> : null}
                      </span>
                    )
                  }
                ]}
                rows={data.recentActivity}
                emptyMessage="No activity recorded yet."
              />
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
