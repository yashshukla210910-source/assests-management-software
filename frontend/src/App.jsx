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
    e.preventDefault();
    if (!did || !privateKey) {
      setError('Please enter your DID and Private Key.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const api = (await import('./utils/api')).default;
      const challengeRes = await api.post('/auth/did-challenge', { did });
      const nonce = challengeRes.data.data.nonce;

      const { ethers } = await import('ethers');
      const wallet = new ethers.Wallet(privateKey);
      const message = `Sign this message to authenticate with ${APP_CONFIG.BRAND_NAME}. Nonce: ${nonce}`;
      const signature = await wallet.signMessage(message);

      const result = await loginWithDid(did, signature, nonce);
      if (!result.success) throw new Error(result.error);
    } catch (err) {
      const message = err.response?.data?.error?.message || err.message || 'DID Authentication failed.';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#131b2e] flex flex-col antialiased">
      <header className="w-full bg-[#ffffff] border-b border-[#bfc7d2] flex justify-between items-center px-6 h-14 z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#006194" strokeWidth="2.5">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <span className="font-semibold text-lg text-[#006194] tracking-tight">{APP_CONFIG.BRAND_NAME} Infrastructure</span>
        </div>
        <div className="flex items-center">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-[#F0FDFA] text-[#0D9488] border border-[#CCFBF1]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#0D9488] animate-pulse"></span>
            System Operational
          </span>
        </div>
      </header>

      <main className="flex-1 flex flex-col md:flex-row w-full">
        {/* Left Side: Architectural Image */}
        <div className="relative w-full md:w-1/2 h-48 md:h-auto bg-[#dae2fd] overflow-hidden flex-shrink-0">
          <img 
            alt="Corporate Tower" 
            className="w-full h-full object-cover object-center absolute inset-0" 
            src="/login-hero.jpg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#ffffff]/50 via-transparent to-[#ffffff]/20"></div>
          
          <div className="absolute bottom-6 left-6 right-6 hidden md:block">
            <div className="bg-[#ffffff]/90 backdrop-blur-md border border-[#bfc7d2] rounded-lg p-4 shadow-lg inline-block">
              <h3 className="font-bold text-[#006194] mb-1">Institutional Gateway</h3>
              <p className="text-sm text-[#3f4850]">Secure, zero-knowledge KMS for decentralized asset management.</p>
            </div>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-[#faf8ff] relative z-10">
          <div className="w-full max-w-md bg-[#ffffff] rounded-xl border border-[#bfc7d2] p-8 shadow-md">
            
            <div className="pb-6 border-b border-[#eaedff]">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-2xl font-bold text-[#131b2e]">Enterprise Sign In</h1>
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-[#eef0ff] text-[#006398] border border-[#cce5ff] flex items-center gap-1">
                  FIPS 140-2
                </span>
              </div>
              <p className="text-sm text-[#3f4850]">
                Authenticate institutional access via decentralized credential.
              </p>
            </div>

            {error && (
              <div className="mt-6 p-3 rounded-lg bg-[#ffdad6] border border-[#93000a] text-[#ba1a1a] text-sm flex items-start gap-2">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mt-0.5 shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleDidLogin} className="space-y-5 mt-6" noValidate>
              
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="did" className="text-sm font-semibold text-[#131b2e]">Decentralized Identifier (DID)</label>
                </div>
                <div className="relative flex items-center rounded-lg border border-[#707881] bg-[#ffffff] focus-within:border-[#006194] focus-within:ring-1 focus-within:ring-[#006194] transition-all">
                  <div className="pl-3 flex items-center pointer-events-none text-[#707881]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                  </div>
                  <input
                    id="did" type="text"
                    className="w-full border-0 bg-transparent py-2.5 pl-2 pr-3 text-[#131b2e] placeholder:text-[#bfc7d2] focus:ring-0 focus:outline-none text-sm font-mono"
                    value={did} onChange={e => setDid(e.target.value)}
                    placeholder="did:ethr:11155111:0x..."
                    required disabled={submitting}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label htmlFor="privateKey" className="text-sm font-semibold text-[#131b2e]">Private Key</label>
                </div>
                <div className="relative flex items-center rounded-lg border border-[#707881] bg-[#ffffff] focus-within:border-[#006194] focus-within:ring-1 focus-within:ring-[#006194] transition-all">
                  <div className="pl-3 flex items-center pointer-events-none text-[#707881]">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </div>
                  <input
                    id="privateKey"
                    type={showPassword ? 'text' : 'password'}
                    className="w-full border-0 bg-transparent py-2.5 pl-2 pr-10 text-[#131b2e] placeholder:text-[#bfc7d2] focus:ring-0 focus:outline-none text-sm font-mono"
                    value={privateKey} onChange={e => setPrivateKey(e.target.value)}
                    placeholder="0x..."
                    required disabled={submitting}
                    autoComplete="current-password"
                  />
                  <button type="button" className="absolute right-2 p-1 text-[#707881] hover:text-[#131b2e] transition-colors" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 flex items-center text-xs text-[#707881]">
                  <span className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#006194]"></span>
                    Key is used locally to sign challenge. Never transmitted.
                  </span>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting || isLoading}
                className="w-full mt-4 bg-[#006194] hover:bg-[#004b73] text-[#ffffff] font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors duration-200 flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {submitting && <span className="animate-spin h-4 w-4 border-2 border-[#ffffff] border-t-transparent rounded-full" />}
                {submitting ? 'Authenticating...' : 'Authenticate & Access Vault'}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-[#eaedff] flex justify-center gap-4 text-xs text-[#707881] font-medium">
              <span>SOC2 Type II</span>
              <span>•</span>
              <span>ISO 27001</span>
              <span>•</span>
              <span>End-to-End ZK</span>
            </div>
          </div>
        </div>
      </main>
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
