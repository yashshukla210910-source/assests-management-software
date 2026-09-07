import React from 'react';
import { Bell, CheckCheck, AlertCircle, Package, Users, ShieldCheck, Activity } from 'lucide-react';
import api from '../utils/api';

const timeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const typeIcon = (type) => {
  if (type?.includes('asset')) return <Package size={14} style={{ color: 'var(--accent)' }} />;
  if (type?.includes('identity')) return <Users size={14} style={{ color: 'var(--success)' }} />;
  if (type?.includes('role') || type?.includes('access')) return <ShieldCheck size={14} style={{ color: 'var(--warning)' }} />;
  return <Activity size={14} style={{ color: 'var(--text-muted)' }} />;
};

const groupByDate = (notifications) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const groups = { Today: [], Yesterday: [], Earlier: [] };
  for (const n of notifications) {
    const d = new Date(n.createdAt); d.setHours(0, 0, 0, 0);
    if (d.getTime() === today.getTime()) groups.Today.push(n);
    else if (d.getTime() === yesterday.getTime()) groups.Yesterday.push(n);
    else groups.Earlier.push(n);
  }
  return groups;
};

export const Notifications = () => {
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications?limit=50');
      setNotifications(data.data.notifications || []);
    } catch {
      setError('Failed to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchNotifications(); }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const grouped = groupByDate(notifications);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            System alerts, events and status updates.
            {unreadCount > 0 && <span className="badge badge-blue" style={{ marginLeft: '0.5rem' }}>{unreadCount} unread</span>}
          </p>
        </div>
        <div className="page-actions">
          {unreadCount > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
              <CheckCheck size={13} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="loading-row"><div className="loading-spinner-large" /> Loading notifications...</div>
      ) : error ? (
        <div className="alert alert-error"><AlertCircle size={15} /> {error}</div>
      ) : notifications.length === 0 ? (
        <div className="empty-state">
          <Bell size={36} className="empty-state-icon" />
          <div className="empty-state-title">No notifications</div>
          <div className="empty-state-sub">You're all caught up!</div>
        </div>
      ) : (
        Object.entries(grouped).map(([group, items]) =>
          items.length > 0 ? (
            <div key={group}>
              <div className="section-label" style={{ marginBottom: '0.5rem' }}>{group}</div>
              <div className="panel">
                {items.map((n, i) => (
                  <div
                    key={n.id}
                    onClick={() => markRead(n.id)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
                      padding: '0.875rem 1rem',
                      borderBottom: i < items.length - 1 ? '1px solid var(--border)' : 'none',
                      background: !n.isRead ? 'rgba(37,99,235,0.03)' : 'transparent',
                      cursor: 'pointer', transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = !n.isRead ? 'rgba(37,99,235,0.03)' : 'transparent'}
                  >
                    {/* Icon */}
                    <div style={{
                      width: 32, height: 32, borderRadius: 7,
                      background: 'var(--bg-tertiary)', border: '1px solid var(--border)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      {typeIcon(n.type)}
                    </div>

                    {/* Body */}
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.125rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: !n.isRead ? 600 : 500, color: 'var(--text-primary)' }}>{n.title}</span>
                        {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }} />}
                      </div>
                      {n.body && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.body}</div>}
                    </div>

                    {/* Time */}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      {timeAgo(n.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null
        )
      )}
    </div>
  );
};
