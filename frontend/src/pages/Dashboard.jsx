import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Database, Activity, ShieldCheck, ArrowRight, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import api from '../utils/api';

const eventTypeColor = (type) => {
  if (type?.includes('CREATED')) return 'badge-success';
  if (type?.includes('TRANSFERRED')) return 'badge-blue';
  if (type?.includes('MINTED')) return 'badge-info';
  if (type?.includes('REVOKED') || type?.includes('SUSPENDED')) return 'badge-danger';
  if (type?.includes('LOGIN')) return 'badge-neutral';
  return 'badge-neutral';
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '-';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState(null);
  const [activity, setActivity] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    const load = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.data.stats);
        setActivity(data.data.recentActivity || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-row" style={{ minHeight: '60vh' }}>
        <div className="loading-spinner-large" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertCircle size={40} className="empty-state-icon" />
        <div className="empty-state-title">{error}</div>
        <button className="btn btn-primary btn-sm" onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total Identities',
      value: stats?.totalIdentities ?? 0,
      sub: `${stats?.activeIdentities ?? 0} active`,
      icon: Users,
      color: '#3b82f6',
      action: () => navigate('/identities')
    },
    {
      label: 'Total Assets',
      value: stats?.totalAssets ?? 0,
      sub: `${stats?.assignedAssets ?? 0} assigned`,
      icon: Database,
      color: '#22c55e',
      action: () => navigate('/assets')
    },
    {
      label: 'Audit Events',
      value: stats?.totalAuditEvents ?? 0,
      sub: 'Immutable records',
      icon: Activity,
      color: '#f59e0b',
      action: () => navigate('/audit')
    },
    {
      label: 'Notifications',
      value: stats?.unreadNotifications ?? 0,
      sub: 'Unread',
      icon: ShieldCheck,
      color: '#8b5cf6',
      action: null
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Overview of your organization's identities, assets, and activity.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="stat-card"
            style={{ cursor: card.action ? 'pointer' : 'default' }}
            onClick={card.action || undefined}
            role={card.action ? 'button' : undefined}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: 36, height: 36,
                  borderRadius: 8,
                  background: card.color + '18',
                  border: `1px solid ${card.color}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: card.color
                }}
              >
                <card.icon size={18} />
              </div>
              {card.action && (
                <ArrowRight size={14} style={{ color: 'var(--text-muted)', marginTop: 4 }} />
              )}
            </div>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-value">{card.value.toLocaleString()}</div>
            <div className="stat-card-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)' }}>Recent Activity</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>Latest audit events across the platform</div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit')}>
            View all <ArrowRight size={14} />
          </button>
        </div>

        {activity.length === 0 ? (
          <div className="empty-state">
            <Clock size={32} className="empty-state-icon" />
            <div className="empty-state-title">No activity yet</div>
            <div className="empty-state-sub">Actions you and your team take will appear here.</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Event Type</th>
                  <th>Entity</th>
                  <th>Actor</th>
                  <th>Time</th>
                  <th>Tx Hash</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((event) => (
                  <tr key={event.id}>
                    <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                      {event.sequenceNo}
                    </td>
                    <td>
                      <span className={`badge ${eventTypeColor(event.eventType)}`}>
                        {event.eventType?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {event.entityId?.length > 20 ? event.entityId.slice(0, 20) + '...' : (event.entityId || '-')}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {event.actor?.name || event.actorRole || 'System'}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {timeAgo(event.createdAt)}
                    </td>
                    <td>
                      {event.txHash ? (
                        <span className="mono">{event.txHash.slice(0, 14)}...</span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        {[
          { label: 'Register Identity', sub: 'Create a new DID-backed user identity', action: () => navigate('/identities'), icon: Users, color: '#3b82f6' },
          { label: 'Mint Asset', sub: 'Tokenize a new physical or digital asset', action: () => navigate('/assets'), icon: Database, color: '#22c55e' },
          { label: 'View Audit Trail', sub: 'Inspect immutable event history', action: () => navigate('/audit'), icon: Activity, color: '#f59e0b' },
          { label: 'Manage Roles', sub: 'Configure RBAC permissions', action: () => navigate('/roles'), icon: ShieldCheck, color: '#8b5cf6' },
        ].map(qa => (
          <button
            key={qa.label}
            className="card"
            style={{ cursor: 'pointer', border: '1px solid var(--border)', textAlign: 'left', background: 'var(--bg-card)' }}
            onClick={qa.action}
          >
            <div style={{ width: 34, height: 34, borderRadius: 8, background: qa.color + '18', border: `1px solid ${qa.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: qa.color, marginBottom: '0.75rem' }}>
              <qa.icon size={16} />
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>{qa.label}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{qa.sub}</div>
          </button>
        ))}
      </div>
    </div>
  );
};
