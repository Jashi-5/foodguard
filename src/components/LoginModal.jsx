import React, { useState } from 'react';
import { HandHeart, Heart, Mail, ArrowRight, X, Zap, Shield } from 'lucide-react';
import { auth } from '../lib/auth';

// Google "G" logo SVG
const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" style={{ flexShrink: 0 }}>
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    <path fill="none" d="M0 0h48v48H0z"/>
  </svg>
);

// ─── Step: Pick role after Google sign-in ────────────────────────────────────
const RolePickerStep = ({ fbUser, onPick, onClose }) => (
  <>
    <div className="modal-header">
      <div>
        <h2 className="modal-title">Welcome, {fbUser.displayName?.split(' ')[0]}!</h2>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
          One quick thing — how will you use FoodGuard?
        </p>
      </div>
      <button className="modal-close" onClick={onClose}><X size={18} /></button>
    </div>

    <div className="login-role-cards" style={{ marginTop: '1.25rem' }}>
      <button className="login-role-card login-role-donor" onClick={() => onPick('donor')}>
        <div className="login-role-icon login-role-icon-green">
          <HandHeart size={28} />
        </div>
        <h3>I'm a Donor</h3>
        <p>Restaurants, caterers, households with surplus food</p>
        <div className="login-role-cta login-role-cta-green">
          Continue <ArrowRight size={14} />
        </div>
      </button>

      <button className="login-role-card login-role-receiver" onClick={() => onPick('receiver')}>
        <div className="login-role-icon login-role-icon-red">
          <Heart size={28} />
        </div>
        <h3>I'm a Receiver</h3>
        <p>NGOs, shelters, community kitchens</p>
        <div className="login-role-cta login-role-cta-red">
          Continue <ArrowRight size={14} />
        </div>
      </button>
    </div>
  </>
);

// ─── Main Login Modal ────────────────────────────────────────────────────────
const LoginModal = ({ onClose, onLogin }) => {
  const [step, setStep] = useState('role');   // role | form | picking-role | loading
  const [role, setRole] = useState(null);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleUser, setGoogleUser] = useState(null); // raw Firebase user, waiting for role
  const [googleError, setGoogleError] = useState('');

  const handleRoleSelect = (r) => {
    setRole(r);
    setStep('form');
  };

  const handleQuickLogin = (r) => {
    setLoading(true);
    setTimeout(() => {
      const user = auth.quickLogin(r);
      onLogin(user);
    }, 600);
  };

  const handleEmailLogin = () => {
    if (!email.includes('@')) return;
    setLoading(true);
    setTimeout(() => {
      const user = auth.login(email, role);
      onLogin(user);
    }, 800);
  };

  // ── Google Login ──
  const handleGoogleLogin = async () => {
    setGoogleError('');
    setLoading(true);
    try {
      const result = await auth.loginWithGoogle();

      if (result.cancelled) {
        setLoading(false);
        return;
      }

      if (result.needsRole) {
        // New user — show role picker
        setGoogleUser(result.fbUser);
        setLoading(false);
        setStep('picking-role');
        return;
      }

      if (result.user) {
        onLogin(result.user);
        return;
      }
    } catch (err) {
      console.error(err);
      setGoogleError('Google sign-in failed. Make sure popups are allowed.');
      setLoading(false);
    }
  };

  // ── Role chosen after Google login ──
  const handleGoogleRolePick = (pickedRole) => {
    setLoading(true);
    const user = auth.completeGoogleLogin(googleUser, pickedRole);
    onLogin(user);
  };

  // ── Loading screen ──
  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-container login-modal" onClick={e => e.stopPropagation()}>
          <div className="login-loading">
            <div className="payment-processing-spinner"><div className="processing-ring" /></div>
            <h2>Signing you in…</h2>
            <p>Setting up your dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container login-modal" onClick={e => e.stopPropagation()}>

        {/* ── Role selection after Google sign-in ── */}
        {step === 'picking-role' && googleUser ? (
          <RolePickerStep
            fbUser={googleUser}
            onPick={handleGoogleRolePick}
            onClose={onClose}
          />
        ) : step === 'role' ? (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Welcome to FoodGuard</h2>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>
            <p className="login-subtitle">Choose how you'd like to help</p>

            {/* Google Sign-In */}
            <button className="google-signin-btn" onClick={handleGoogleLogin}>
              <GoogleIcon />
              Continue with Google
            </button>

            {googleError && (
              <p style={{ fontSize: '0.6875rem', color: 'var(--neon-red)', textAlign: 'center', marginTop: '-0.5rem' }}>
                {googleError}
              </p>
            )}

            <div className="login-divider"><span>or choose your role</span></div>

            <div className="login-role-cards">
              <button className="login-role-card login-role-donor" onClick={() => handleRoleSelect('donor')}>
                <div className="login-role-icon login-role-icon-green">
                  <HandHeart size={28} />
                </div>
                <h3>I'm a Donor</h3>
                <p>Restaurants, caterers, households with surplus food</p>
                <div className="login-role-cta login-role-cta-green">
                  Continue <ArrowRight size={14} />
                </div>
              </button>

              <button className="login-role-card login-role-receiver" onClick={() => handleRoleSelect('receiver')}>
                <div className="login-role-icon login-role-icon-red">
                  <Heart size={28} />
                </div>
                <h3>I'm a Receiver</h3>
                <p>NGOs, shelters, community kitchens</p>
                <div className="login-role-cta login-role-cta-red">
                  Continue <ArrowRight size={14} />
                </div>
              </button>
            </div>

            <div className="login-divider"><span>or try instantly</span></div>

            <div className="login-quick-btns">
              <button className="login-quick-btn" onClick={() => handleQuickLogin('donor')}>
                <Zap size={14} /> Quick Demo as Donor
              </button>
              <button className="login-quick-btn" onClick={() => handleQuickLogin('receiver')}>
                <Zap size={14} /> Quick Demo as Receiver
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Sign in as {role === 'donor' ? 'Donor' : 'Receiver'}</h2>
              <button className="modal-close" onClick={() => setStep('role')}><X size={18} /></button>
            </div>

            {/* Google option on form step too */}
            <button className="google-signin-btn" onClick={handleGoogleLogin} style={{ marginBottom: '1rem' }}>
              <GoogleIcon />
              Continue with Google
            </button>

            <div className="login-divider"><span>or use email</span></div>

            <div className="login-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="stripe-input-wrap">
                  <Mail size={16} className="stripe-input-icon" />
                  <input
                    type="email" className="stripe-input"
                    placeholder={role === 'donor' ? 'rahul@foodguard.in' : 'info@hopefoundation.org'}
                    value={email} onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleEmailLogin()}
                    autoFocus
                  />
                </div>
              </div>

              <button className="modal-confirm-btn" onClick={handleEmailLogin} disabled={!email.includes('@')}>
                <Shield size={16} />
                Sign In
              </button>

              <div className="login-demo-hint">
                <Zap size={12} />
                <span>Demo mode — any email works, no password needed</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginModal;
