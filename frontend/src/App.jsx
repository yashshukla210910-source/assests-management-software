import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Identities } from './pages/Identities';
import { Assets } from './pages/Assets';
import { Roles } from './pages/Roles';
import { AuditLogs } from './pages/Audit';
import { Dashboard } from './pages/Dashboard';
import { Settings } from './pages/Settings';
import { Verification } from './pages/Verification';
import { Transactions } from './pages/Transactions';
import { Notifications } from './pages/Notifications';
import { Administration } from './pages/Administration';
import { APP_CONFIG } from './config/constants';

// ─── Login Page ───────────────────────────────────────────────────────────────

const Login = () => {
  const { loginWithDid, isLoading } = useAuthStore();

  const [did, setDid] = React.useState('');
  const [privateKey, setPrivateKey] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleDidLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSubmitting(true);
    
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed. Please install it to continue.');
      }

      const { ethers } = await import('ethers');
      // Request account access
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      const address = accounts[0];
      
      const chainId = import.meta.env.VITE_CHAIN_ID || 11155111;
      const did = `did:ethr:${chainId}:${address}`;
      
      const api = (await import('./utils/api')).default;
      const challengeRes = await api.post('/auth/did-challenge', { did });
      const nonce = challengeRes.data.data.nonce;

      const signer = await provider.getSigner();
      const message = `Sign this message to authenticate with ${APP_CONFIG.BRAND_NAME}. Nonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      const result = await loginWithDid(did, signature, nonce);
      if (!result.success) throw new Error(result.error);
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message || 'MetaMask Authentication failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      {/* Left panel — branding and image */}
      <div className="login-left">
        <div className="login-brand">
          <div className="login-logo">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
          </div>
          <span className="login-brand-name">{APP_CONFIG.BRAND_NAME}</span>
        </div>

        <div className="login-hero">
          <h1 className="login-hero-title">
            Enterprise Identity<br/>& Asset Management
          </h1>
          <p className="login-hero-sub">
            Secure, role-based access to your organization's digital assets and decentralized identities — anchored on Ethereum.
          </p>
          <div className="login-features">
            {[
              { icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z', label: 'W3C Decentralized Identifiers' },
              { icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z', label: 'Enterprise Role-Based Access Control' },
              { icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', label: 'Immutable Blockchain Audit Trail' },
            ].map(f => (
              <div key={f.label} className="login-feature">
                <div className="login-feature-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d={f.icon} />
                  </svg>
                </div>
                <span>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="login-footer-left">
          {APP_CONFIG.BRAND_NAME} Platform v{APP_CONFIG.VERSION} · Enterprise Edition
        </div>
      </div>

      {/* Right panel — form */}
      <div className="login-right">
        <div className="login-form-container">
          <div className="login-form-header">
            <h2 className="login-form-title">Sign in</h2>
            <p className="login-form-sub">
              Authenticate using your decentralized identity.
            </p>
          </div>

          {error && (
            <div className="login-error">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDidLogin} className="login-form" noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', marginTop: '2rem' }}>
              <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                Connect your MetaMask wallet to authenticate securely without passwords.
              </p>
              
              <button 
                type="button" 
                onClick={handleDidLogin} 
                className="login-btn" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', padding: '1rem' }}
                disabled={submitting || isLoading}
              >
                {submitting ? <span className="spinner-sm" /> : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21.2 5.9L12.3 0.6C12.1 0.5 11.9 0.5 11.7 0.6L2.8 5.9C2.5 6.1 2.3 6.4 2.3 6.8V17.2C2.3 17.6 2.5 17.9 2.8 18.1L11.7 23.4C11.9 23.5 12.1 23.5 12.3 23.4L21.2 18.1C21.5 17.9 21.7 17.6 21.7 17.2V6.8C21.7 6.4 21.5 6.1 21.2 5.9ZM12 21.8L4.3 17.2V8.1L11.2 12.3C11.4 12.4 11.7 12.5 12 12.5C12.3 12.5 12.6 12.4 12.8 12.3L19.7 8.1V17.2L12 21.8ZM19.7 6.4L12 11L4.3 6.4L12 1.8L19.7 6.4Z" fill="currentColor"/>
                  </svg>
                )}
                {submitting ? 'Connecting to MetaMask…' : 'Sign in with MetaMask'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Protected Route ──────────────────────────────────────────────────────────

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)'
      }}>
        <div className="loading-spinner-large" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

// ─── App ──────────────────────────────────────────────────────────────────────

const App = () => {
  const { checkAuth, isAuthenticated } = useAuthStore();

  React.useEffect(() => { checkAuth(); }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="identities" element={<Identities />} />
          <Route path="verification" element={<Verification />} />
          <Route path="assets" element={<Assets />} />
          <Route path="roles" element={<Roles />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="transactions" element={<Transactions />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="administration" element={<Administration />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
