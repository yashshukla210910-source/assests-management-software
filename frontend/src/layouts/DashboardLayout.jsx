import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import api from '../utils/api';
import {
  LayoutDashboard, Users, Database, ShieldCheck, Activity,
  Settings, LogOut, Bell, ChevronRight
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label, end = false }) => (
  <NavLink
    to={to}
    end={end}
    className={({ isActive }) =>
      `nav-item${isActive ? ' active' : ''}`
    }
  >
    <Icon size={16} />
    <span>{label}</span>
  </NavLink>
);

const NotificationPanel = ({ onClose }) => {
  const [notifications, setNotifications] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.get('/notifications')
      .then(r => { setNotifications(r.data.data.notifications || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const markRead = async (id) => {
    await api.patch(`/notifications/${id}/read`).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const markAllRead = async () => {
    await api.patch('/notifications/read-all').catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="notif-panel">
      <div className="notif-panel-header">
        <span className="notif-panel-title">Notifications</span>
        <button className="notif-read-all-btn" onClick={markAllRead}>Mark all read</button>
      </div>
      <div className="notif-list">
        {loading ? (
          <div className="loading-row">
            <span className="spinner-sm" style={{ borderTopColor: 'var(--accent)' }} />
            Loading...
          </div>
        ) : notifications.length === 0 ? (
          <div className="notif-empty">No notifications</div>
        ) : (
          notifications.map(n => (
            <div
              key={n.id}
              className={`notif-item${!n.isRead ? ' unread' : ''}`}
              onClick={() => markRead(n.id)}
            >
              <div className={`notif-item-dot${n.isRead ? ' read' : ''}`} />
              <div className="notif-item-body">
                <div className="notif-item-title">{n.title}</div>
                {n.body && <div className="notif-item-text">{n.body}</div>}
                <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  React.useEffect(() => {
    const fetchUnread = () => {
      api.get('/notifications')
        .then(r => setUnreadCount(r.data.data.unreadCount || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close notif panel on outside click
  React.useEffect(() => {
    if (!showNotifs) return;
    const handler = (e) => {
      if (!e.target.closest('.notif-wrapper')) setShowNotifs(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifs]);

  const roleChips = user?.roles?.map(r => (
    <span key={r} className={`role-chip-${r}`}>{r}</span>
  ));

  return (
    <div className="layout-wrapper">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span className="sidebar-brand">DecentraVault</span>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Main</div>
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" end />
          <SidebarItem to="/identities" icon={Users} label="Identities" />
          <SidebarItem to="/assets" icon={Database} label="Assets" />

          <div className="nav-section-label">Security</div>
          <SidebarItem to="/roles" icon={ShieldCheck} label="Access Control" />
          <SidebarItem to="/audit" icon={Activity} label="Audit Logs" />

          <div className="nav-section-label">System</div>
          <SidebarItem to="/settings" icon={Settings} label="Settings" />
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name || 'User'}</div>
              <div className="sidebar-user-email">{user?.email}</div>
            </div>
          </div>
          <button className="sidebar-logout" onClick={handleLogout}>
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="main-header">
          <div className="main-header-spacer" />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className="header-badge">
              <div className="header-badge-dot" />
              Offline Mode
            </div>

            {/* Notification Bell */}
            <div style={{ position: 'relative' }} className="notif-wrapper">
              <button
                className="notif-btn"
                onClick={() => setShowNotifs(v => !v)}
                aria-label="Notifications"
              >
                <Bell size={16} />
                {unreadCount > 0 && (
                  <span className="notif-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </button>
              {showNotifs && (
                <NotificationPanel onClose={() => setShowNotifs(false)} />
              )}
            </div>
          </div>
        </header>

        <div className="main-scroll">
          <div className="page-content animate-in">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};
