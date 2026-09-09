import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Package, Activity, ShieldCheck, ArrowRight,
  AlertCircle, Clock, RefreshCw, TrendingUp, CheckCircle,
  Server, Database, Wifi
} from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/useAuthStore';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getExplorerUrl } from '../utils/explorer';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const eventTypeLabel = (type) => {
  if (!type) return '—';
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
};

const eventTypeBadge = (type) => {
  if (type?.includes('CREATED')) return 'badge-success';
  if (type?.includes('TRANSFERRED')) return 'badge-blue';
  if (type?.includes('MINTED')) return 'badge-info';
  if (type?.includes('REVOKED') || type?.includes('SUSPENDED')) return 'badge-danger';
  if (type?.includes('LOGIN')) return 'badge-neutral';
  return 'badge-neutral';
};

const timeAgo = (dateStr) => {
  if (!dateStr) return '—';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

// Chart color palette — professional, no neon
const CHART_COLORS = ['#2563eb', '#16a34a', '#d97706', '#7c3aed', '#0891b2', '#dc2626'];

const PIE_COLORS = {
  active: '#16a34a',
  suspended: '#d97706',
  revoked: '#dc2626',
};

// ─── Tooltip style ────────────────────────────────────────────────────────────
const ChartTooltipStyle = {
  background: '#fff',
  border: '1px solid #e2e8f0',
  borderRadius: 6,
  fontSize: '0.8rem',
  color: '#1a2332',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

// ─── System Status ────────────────────────────────────────────────────────────
const SystemStatus = () => {
  const [status, setStatus] = React.useState(null);

  React.useEffect(() => {
    api.get('/admin/system').then(r => setStatus(r.data.data)).catch(() => {});
  }, []);

  const items = [
    { label: 'Backend API', status: 'operational' },
    { label: 'Database', status: status ? 'operational' : 'unknown' },
    { label: 'Blockchain (Sepolia)', status: status?.blockchain ? 'operational' : 'unknown' },
    { label: 'Identity Registry', status: status?.blockchain?.contracts?.identityRegistry ? 'operational' : 'degraded' },
    { label: 'Asset Registry', status: status?.blockchain?.contracts?.assetRegistry ? 'operational' : 'degraded' },
  ];

  return (
    <div className="chart-panel">
      <div className="chart-panel-header">
        <div>
          <div className="chart-panel-title">System Status</div>
          <div className="chart-panel-sub">Live service health</div>
        </div>
        <Server size={15} style={{ color: 'var(--text-muted)' }} />
      </div>
      <div className="chart-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map(item => (
          <div key={item.label} className="system-status-item">
            <span className="system-status-label">{item.label}</span>
            <span className={`status-dot ${item.status}`}>
              {item.status === 'operational' ? 'Operational' :
               item.status === 'degraded' ? 'Degraded' : 'Checking...'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const Dashboard = () => {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user);
  const [stats, setStats] = React.useState(null);
  const [activity, setActivity] = React.useState([]);
  const [recentAssets, setRecentAssets] = React.useState([]);
  const [charts, setCharts] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState(null);

  const isAdmin = user?.roles?.includes('admin');
  const isManager = user?.roles?.includes('manager') || user?.roles?.includes('auditor');

  const load = React.useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const [dashRes, chartsRes, assetsRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/dashboard-charts').catch(() => ({ data: { data: null } })),
        api.get('/assets?limit=5').catch(() => ({ data: { data: [] } }))
      ]);
      setStats(dashRes.data.data.stats);
      setActivity(dashRes.data.data.recentActivity || []);
      setCharts(chartsRes.data.data);
      setRecentAssets(assetsRes.data.data || []);
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="loading-row" style={{ minHeight: '50vh' }}>
        <div className="loading-spinner-large" />
        <span>Loading dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="empty-state">
        <AlertCircle size={36} className="empty-state-icon" />
        <div className="empty-state-title">{error}</div>
        <button className="btn btn-primary btn-sm" onClick={() => load()}>Retry</button>
      </div>
    );
  }

  // ── KPI cards
  const kpiCards = [
    {
      label: 'Total Identities',
      value: stats?.totalIdentities ?? 0,
      sub: `${stats?.activeIdentities ?? 0} active`,
      icon: Users,
      color: '#2563eb',
      action: () => navigate('/identities')
    },
    {
      label: 'Active Identities',
      value: stats?.activeIdentities ?? 0,
      sub: 'DID-verified',
      icon: ShieldCheck,
      color: '#16a34a',
      action: () => navigate('/identities')
    },
    {
      label: 'Total Assets',
      value: stats?.totalAssets ?? 0,
      sub: `${stats?.assignedAssets ?? 0} assigned`,
      icon: Package,
      color: '#7c3aed',
      action: () => navigate('/assets')
    },
    {
      label: 'Audit Events',
      value: stats?.totalAuditEvents ?? 0,
      sub: 'Immutable records',
      icon: Activity,
      color: '#d97706',
      action: () => navigate('/audit')
    },
    {
      label: 'Unread Alerts',
      value: stats?.unreadNotifications ?? 0,
      sub: 'Notifications',
      icon: AlertCircle,
      color: stats?.unreadNotifications > 0 ? '#dc2626' : '#8898aa',
      action: () => navigate('/notifications')
    },
  ];

  // ── Quick actions (filtered by role)
  const quickActions = [
    { label: 'Register Identity', sub: 'Create new DID-backed identity', action: () => navigate('/identities'), icon: Users, color: '#2563eb', show: isAdmin },
    { label: 'Mint Asset', sub: 'Tokenize a new asset', action: () => navigate('/assets'), icon: Package, color: '#7c3aed', show: isAdmin || isManager },
    { label: 'Verify Identity', sub: 'Check DID on blockchain', action: () => navigate('/verification'), icon: ShieldCheck, color: '#16a34a', show: true },
    { label: 'Audit Trail', sub: 'View compliance records', action: () => navigate('/audit'), icon: Activity, color: '#d97706', show: true },
  ].filter(a => a.show);

  // ── Asset activity chart data
  const activityData = charts?.assetActivity || [];

  // ── Category chart
  const categoryData = charts?.assetsByCategory || [];

  // ── Role distribution
  const roleData = charts?.usersByRole || [];

  // ── Identity status
  const identityStatusData = charts?.identitiesByStatus || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

      {/* ── Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Overview of identities, assets, ownership and system activity.</p>
        </div>
        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={() => load(true)} disabled={refreshing}>
            <RefreshCw size={13} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Row */}
      <div className="stats-grid">
        {kpiCards.map(card => (
          <div
            key={card.label}
            className="stat-card"
            role={card.action ? 'button' : undefined}
            onClick={card.action}
            tabIndex={card.action ? 0 : undefined}
          >
            <div className="stat-card-header">
              <div className="stat-card-icon" style={{ background: card.color + '14', border: `1px solid ${card.color}26` }}>
                <card.icon size={15} style={{ color: card.color }} />
              </div>
              {card.action && <ArrowRight size={13} style={{ color: 'var(--text-muted)' }} />}
            </div>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-value">{card.value.toLocaleString()}</div>
            <div className="stat-card-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row */}
      {charts && (
        <div className="charts-grid">
          {/* Activity Line Chart */}
          <div className="chart-panel">
            <div className="chart-panel-header">
              <div>
                <div className="chart-panel-title">System Activity — Last 7 Days</div>
                <div className="chart-panel-sub">Events by type over time</div>
              </div>
              <TrendingUp size={15} style={{ color: 'var(--text-muted)' }} />
            </div>
            <div className="chart-panel-body">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={activityData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8898aa' }}
                    tickFormatter={v => v ? v.slice(5) : v} />
                  <YAxis tick={{ fontSize: 11, fill: '#8898aa' }} allowDecimals={false} />
                  <Tooltip contentStyle={ChartTooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '0.75rem' }} />
                  <Line type="monotone" dataKey="created" stroke="#2563eb" strokeWidth={2} dot={false} name="Created" />
                  <Line type="monotone" dataKey="minted" stroke="#7c3aed" strokeWidth={2} dot={false} name="Minted" />
                  <Line type="monotone" dataKey="transferred" stroke="#d97706" strokeWidth={2} dot={false} name="Transferred" />
                  <Line type="monotone" dataKey="other" stroke="#8898aa" strokeWidth={1.5} dot={false} name="Other" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right column: two small charts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Asset by Category */}
            <div className="chart-panel" style={{ flex: 1 }}>
              <div className="chart-panel-header">
                <div className="chart-panel-title">Assets by Category</div>
              </div>
              <div className="chart-panel-body">
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={130}>
                    <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#8898aa' }} allowDecimals={false} />
                      <YAxis type="category" dataKey="category" tick={{ fontSize: 10, fill: '#4b5a72' }} width={80} />
                      <Tooltip contentStyle={ChartTooltipStyle} />
                      <Bar dataKey="count" name="Assets" radius={[0, 3, 3, 0]}>
                        {categoryData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="empty-state" style={{ padding: '1.5rem' }}>
                    <span className="text-muted text-sm">No asset data</span>
                  </div>
                )}
              </div>
            </div>

            {/* Identity Status Donut */}
            <div className="chart-panel" style={{ flex: 1 }}>
              <div className="chart-panel-header">
                <div className="chart-panel-title">Identity Status</div>
              </div>
              <div className="chart-panel-body" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {identityStatusData.length > 0 ? (
                  <>
                    <ResponsiveContainer width={90} height={90}>
                      <PieChart>
                        <Pie data={identityStatusData} cx="50%" cy="50%" innerRadius={28} outerRadius={42}
                          dataKey="count" nameKey="status" paddingAngle={2}>
                          {identityStatusData.map((entry, i) => (
                            <Cell key={i} fill={PIE_COLORS[entry.status] || CHART_COLORS[i]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={ChartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                      {identityStatusData.map((entry, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem' }}>
                          <div style={{ width: 8, height: 8, borderRadius: 2, background: PIE_COLORS[entry.status] || CHART_COLORS[i], flexShrink: 0 }} />
                          <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{entry.status}</span>
                          <span style={{ color: 'var(--text-primary)', fontWeight: 600, marginLeft: 'auto' }}>{entry.count}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="empty-state" style={{ padding: '1rem', width: '100%' }}>
                    <span className="text-muted text-sm">No identity data</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Bottom Row: Recent Activity + Quick Actions + System */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1rem' }}>

        {/* Left Column: Activity & Assets */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          
          {/* Recent Activity Table */}
          <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Recent Activity</div>
              <div className="panel-sub">Latest audit events across the platform</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/audit')}>
              View all <ArrowRight size={13} />
            </button>
          </div>

          {activity.length === 0 ? (
            <div className="empty-state">
              <Clock size={28} className="empty-state-icon" />
              <div className="empty-state-title">No activity yet</div>
              <div className="empty-state-sub">Actions taken on the platform will appear here.</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Event</th>
                    <th>Actor</th>
                    <th>Entity</th>
                    <th>Time</th>
                    <th>Tx</th>
                  </tr>
                </thead>
                <tbody>
                  {activity.slice(0, 8).map(event => (
                    <tr key={event.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/audit')}>
                      <td>
                        <span className={`badge ${eventTypeBadge(event.eventType)}`}>
                          {eventTypeLabel(event.eventType)}
                        </span>
                      </td>
                      <td className="text-primary" style={{ fontWeight: 500 }}>
                        {event.actor?.name || event.actorRole || 'System'}
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {event.entityId?.length > 16 ? event.entityId.slice(0, 16) + '…' : (event.entityId || '—')}
                      </td>
                      <td style={{ whiteSpace: 'nowrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {timeAgo(event.createdAt)}
                      </td>
                      <td>
                        {event.txHash ? (
                          <a
                            href={getExplorerUrl(event.txHash)}
                            target="_blank" rel="noopener noreferrer"
                            className="mono"
                            style={{ fontSize: '0.7rem' }}
                            onClick={e => e.stopPropagation()}
                          >
                            {event.txHash.slice(0, 8)}…
                          </a>
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

        {/* Recent Assets Table */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Recent Assets</div>
              <div className="panel-sub">Latest registered and assigned assets</div>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/assets')}>
              View all <ArrowRight size={13} />
            </button>
          </div>

          {recentAssets.length === 0 ? (
            <div className="empty-state">
              <Package size={28} className="empty-state-icon" />
              <div className="empty-state-title">No assets found</div>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Owner</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssets.map(asset => {
                    const owner = asset.ownershipRecords?.[0];
                    const ownerName = owner ? (owner.owner?.name || owner.didRecord?.user?.name || 'Unknown') : '—';
                    return (
                      <tr key={asset.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/assets')}>
                        <td className="mono" style={{ fontSize: '0.8rem' }}>{asset.assetCode}</td>
                        <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{asset.name}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{asset.category}</td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>{ownerName}</td>
                        <td>
                          <span className={`badge badge-neutral`}>{asset.status}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
        </div>

        {/* Right column: Quick Actions + Role Distribution */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Quick Actions */}
          <div className="panel">
            <div className="panel-header">
              <div className="panel-title">Quick Actions</div>
            </div>
            <div style={{ padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {quickActions.map(qa => (
                <button key={qa.label} className="quick-action-card" onClick={qa.action}>
                  <div className="quick-action-icon" style={{ background: qa.color + '14', border: `1px solid ${qa.color}26` }}>
                    <qa.icon size={15} style={{ color: qa.color }} />
                  </div>
                  <div>
                    <div className="quick-action-label">{qa.label}</div>
                    <div className="quick-action-sub">{qa.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Role Distribution */}
          {roleData.length > 0 && (
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title">Users by Role</div>
              </div>
              <div style={{ padding: '0.875rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {roleData.map((entry, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                    <div style={{ width: 6, height: 6, borderRadius: 2, background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', flex: 1 }}>{entry.role}</span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>{entry.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <SystemStatus />
        </div>
      </div>
    </div>
  );
};
