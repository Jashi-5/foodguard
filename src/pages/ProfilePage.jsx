import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, MapPin, Phone, Clock, Users, Star,
  CheckCircle, XCircle, Utensils, TrendingUp, Truck,
  Heart, Leaf, Award, MessageSquare, Calendar, Sun, Moon, LogOut
} from 'lucide-react';
import { auth } from '../lib/auth';

// Mock data for the profile
const THANK_YOU_MESSAGES = [
  { id: 1, from: 'Rahul Sharma', msg: 'Thank you for feeding 50 kids! 🙏', time: '2 hours ago', avatar: '🧑‍🍳' },
  { id: 2, from: 'Priya Patel', msg: 'Your team is amazing. Keep it up! ❤️', time: '1 day ago', avatar: '👩‍🍳' },
  { id: 3, from: 'Cloud Kitchen Co.', msg: 'Happy to help! Will send more tomorrow.', time: '3 days ago', avatar: '🍳' },
];

const ACTIVITY_TIMELINE = [
  { id: 1, event: 'Received 25 meals from Cloud Kitchen Co.', time: '2 hours ago', icon: '📦', color: 'var(--neon-green)' },
  { id: 2, event: 'Updated food preferences', time: '5 hours ago', icon: '⚙️', color: 'var(--neon-blue)' },
  { id: 3, event: 'Sent thank-you to Rahul Sharma', time: '1 day ago', icon: '💌', color: 'var(--neon-red)' },
  { id: 4, event: 'Completed delivery #47 — 100 servings', time: '2 days ago', icon: '✅', color: 'var(--neon-green)' },
  { id: 5, event: 'Joined FoodGuard platform', time: 'Aug 2025', icon: '🎉', color: 'var(--neon-purple)' },
];

const ProfilePage = ({ theme, toggleTheme, orders = [] }) => {
  const navigate = useNavigate();
  const user = auth.getUser();
  const [accepting, setAccepting] = useState(user?.accepting ?? true);

  if (!user) {
    navigate('/');
    return null;
  }

  const isReceiver = user.role === 'receiver';

  // Stats
  const deliveredOrders = orders.filter(o => o.status === 'delivered');
  const mealsReceived = deliveredOrders.reduce((sum, o) => sum + (o.foodQuantity || 10), 0) + 1247;
  const deliveriesCount = deliveredOrders.length + 89;
  const reliabilityScore = user.reliabilityScore || 94;

  const handleToggleAccepting = () => {
    const next = !accepting;
    setAccepting(next);
    auth.updateProfile({ accepting: next });
  };

  const handleLogout = () => {
    auth.logout();
    navigate('/');
  };

  return (
    <div className="profile-wrapper">
      {/* Header */}
      <div className="profile-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate(-1)}><ArrowLeft size={16} /></button>
            <h1 className="profile-page-title">Profile</h1>
          </div>
          <div className="header-right-group">
            <button onClick={toggleTheme} className="btn-theme" title="Toggle Theme">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={handleLogout} className="btn-clear" title="Logout">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="profile-content">
        {/* ── Hero Card ── */}
        <div className="profile-hero">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt={user.name}
              className="profile-avatar-img"
            />
          ) : (
            <div className="profile-avatar">{user.avatar || '👤'}</div>
          )}
          <div className="profile-hero-info">
            <div className="profile-name-row">
              <h2 className="profile-name">{user.org || user.name}</h2>
              {user.verified && (
                <span className="profile-verified"><Shield size={12} /> Verified</span>
              )}
            </div>
            <p className="profile-email">{user.email}</p>
            <div className="profile-meta-tags">
              <span className="profile-meta-tag"><MapPin size={11} /> New Delhi</span>
              <span className="profile-meta-tag"><Phone size={11} /> {user.phone}</span>
              <span className="profile-meta-tag"><Calendar size={11} /> Since {new Date(user.joinedDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
          {isReceiver && (
            <button
              className={`profile-status-toggle ${accepting ? 'accepting' : 'not-accepting'}`}
              onClick={handleToggleAccepting}
            >
              {accepting ? <CheckCircle size={14} /> : <XCircle size={14} />}
              {accepting ? 'Accepting' : 'Not Accepting'}
            </button>
          )}
        </div>

        {/* ── Stats Grid ── */}
        <div className="profile-stats-grid">
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ color: 'var(--neon-green)', background: 'rgba(0,255,159,0.06)' }}>
              <Utensils size={18} />
            </div>
            <div className="profile-stat-value">{mealsReceived.toLocaleString()}</div>
            <div className="profile-stat-label">Meals {isReceiver ? 'Received' : 'Donated'}</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ color: 'var(--neon-purple)', background: 'rgba(168,85,247,0.06)' }}>
              <Truck size={18} />
            </div>
            <div className="profile-stat-value">{deliveriesCount}</div>
            <div className="profile-stat-label">Deliveries</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ color: 'var(--neon-yellow)', background: 'rgba(255,194,51,0.06)' }}>
              <Star size={18} />
            </div>
            <div className="profile-stat-value">4.8</div>
            <div className="profile-stat-label">Rating</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-icon" style={{ color: 'var(--neon-blue)', background: 'rgba(59,130,246,0.06)' }}>
              <Leaf size={18} />
            </div>
            <div className="profile-stat-value">{(mealsReceived * 2.5).toLocaleString()}</div>
            <div className="profile-stat-label">CO₂ Saved (kg)</div>
          </div>
        </div>

        {/* ── Reliability Score (Receiver only) ── */}
        {isReceiver && (
          <div className="profile-section-card">
            <h3 className="profile-section-title"><Award size={16} /> Reliability Score</h3>
            <div className="reliability-display">
              <div className="reliability-circle">
                <svg viewBox="0 0 100 100" className="reliability-svg">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none"
                    stroke={reliabilityScore >= 90 ? 'var(--neon-green)' : reliabilityScore >= 70 ? 'var(--neon-yellow)' : 'var(--neon-red)'}
                    strokeWidth="8" strokeLinecap="round"
                    strokeDasharray={`${reliabilityScore * 2.64} ${264 - reliabilityScore * 2.64}`}
                    strokeDashoffset="66"
                    className="reliability-progress"
                  />
                </svg>
                <div className="reliability-value">{reliabilityScore}%</div>
              </div>
              <div className="reliability-details">
                <div className="reliability-bar-row">
                  <span>On-time pickups</span>
                  <div className="reliability-bar"><div className="reliability-bar-fill" style={{ width: '96%', background: 'var(--neon-green)' }} /></div>
                  <span>96%</span>
                </div>
                <div className="reliability-bar-row">
                  <span>Food utilization</span>
                  <div className="reliability-bar"><div className="reliability-bar-fill" style={{ width: '91%', background: 'var(--neon-blue)' }} /></div>
                  <span>91%</span>
                </div>
                <div className="reliability-bar-row">
                  <span>Response rate</span>
                  <div className="reliability-bar"><div className="reliability-bar-fill" style={{ width: '88%', background: 'var(--neon-purple)' }} /></div>
                  <span>88%</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Capacity & Preferences (Receiver only) ── */}
        {isReceiver && (
          <div className="profile-section-card">
            <h3 className="profile-section-title"><Users size={16} /> Capacity & Preferences</h3>
            <div className="profile-detail-grid">
              <div className="profile-detail-item">
                <span className="profile-detail-label">Max Capacity</span>
                <span className="profile-detail-value">{user.capacity || 200} servings/day</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Default Urgency</span>
                <span className="profile-detail-value profile-detail-urgency">{user.urgencyDefault || 'High'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">NGO Type</span>
                <span className="profile-detail-value">{user.ngoType || 'Shelter'}</span>
              </div>
              <div className="profile-detail-item">
                <span className="profile-detail-label">Food Preferences</span>
                <div className="profile-pref-tags">
                  {(user.preferences || ['All types']).map((p, i) => (
                    <span key={i} className="profile-pref-tag">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Thank You Messages ── */}
        <div className="profile-section-card">
          <h3 className="profile-section-title">
            <MessageSquare size={16} />
            {isReceiver ? 'Donor Messages' : 'Receiver Messages'}
          </h3>
          <div className="profile-messages">
            {THANK_YOU_MESSAGES.map(m => (
              <div key={m.id} className="profile-message-card">
                <div className="profile-message-avatar">{m.avatar}</div>
                <div className="profile-message-body">
                  <div className="profile-message-from">{m.from}</div>
                  <div className="profile-message-text">{m.msg}</div>
                </div>
                <div className="profile-message-time">{m.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Activity Timeline ── */}
        <div className="profile-section-card">
          <h3 className="profile-section-title"><TrendingUp size={16} /> Activity Timeline</h3>
          <div className="profile-timeline">
            {ACTIVITY_TIMELINE.map((item, idx) => (
              <div key={item.id} className="timeline-item">
                <div className="timeline-line-wrap">
                  <div className="timeline-dot" style={{ borderColor: item.color }}>{item.icon}</div>
                  {idx < ACTIVITY_TIMELINE.length - 1 && <div className="timeline-line" />}
                </div>
                <div className="timeline-content">
                  <div className="timeline-event">{item.event}</div>
                  <div className="timeline-time">{item.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
