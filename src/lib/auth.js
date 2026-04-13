// FoodGuard Authentication — Firebase Auth + Google Sign-In
// Falls back gracefully to mock mode if Firebase is not configured yet.

import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { firebaseAuth, googleProvider } from './firebase';

// ─── Mock users for demo mode (email quick-login) ──────────────────────────
const MOCK_USERS = {
  donor: [
    { id: 'u_d1', name: 'Rahul Sharma', email: 'rahul@foodguard.in', role: 'donor', avatar: '🧑‍🍳', org: 'Cloud Kitchen Co.', phone: '+91 98765 43210', verified: true, joinedDate: '2025-08-15' },
    { id: 'u_d2', name: 'Priya Patel', email: 'priya@meals.org', role: 'donor', avatar: '👩‍🍳', org: 'Homemade Heroes', phone: '+91 87654 32109', verified: true, joinedDate: '2025-11-02' },
  ],
  receiver: [
    { id: 'u_r1', name: 'Hope Foundation', email: 'info@hopefoundation.org', role: 'receiver', avatar: '🏛️', org: 'Hope Foundation NGO', phone: '+91 76543 21098', verified: true, joinedDate: '2025-06-10', ngoType: 'Shelter', reliabilityScore: 94, capacity: 200, preferences: ['Vegetarian', 'No pork'], urgencyDefault: 'High', accepting: true },
    { id: 'u_r2', name: 'Annapurna Trust', email: 'help@annapurna.org', role: 'receiver', avatar: '🙏', org: 'Annapurna Trust', phone: '+91 65432 10987', verified: true, joinedDate: '2025-09-22', ngoType: 'Community Kitchen', reliabilityScore: 87, capacity: 500, preferences: ['All types'], urgencyDefault: 'Critical', accepting: true },
  ]
};

let currentUser = null;
const authListeners = new Set();
const notifyAuth = () => authListeners.forEach(cb => cb(currentUser));

// ─── Role defaults for Google sign-in users ─────────────────────────────────
// When a brand-new Google user signs in, they need to pick a role.
// This is stored in localStorage keyed by their UID so it persists.
const ROLE_STORAGE_KEY = 'fg-google-roles';

const getSavedRoles = () => {
  try { return JSON.parse(localStorage.getItem(ROLE_STORAGE_KEY) || '{}'); }
  catch (_) { return {}; }
};

export const saveUserRole = (uid, role) => {
  const roles = getSavedRoles();
  roles[uid] = role;
  localStorage.setItem(ROLE_STORAGE_KEY, JSON.stringify(roles));
};

export const getSavedRole = (uid) => getSavedRoles()[uid] || null;

// ─── Map a Firebase user to our user shape ──────────────────────────────────
const mapFirebaseUser = (fbUser, role) => ({
  id: fbUser.uid,
  name: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
  email: fbUser.email || '',
  avatar: fbUser.photoURL || '🙂',       // Google profile pic URL or emoji fallback
  photoURL: fbUser.photoURL || null,
  role: role || 'donor',
  org: '',
  phone: fbUser.phoneNumber || '',
  verified: fbUser.emailVerified,
  joinedDate: new Date().toISOString().split('T')[0],
  isGoogleUser: true,
});

// ─── Auth API ────────────────────────────────────────────────────────────────
export const auth = {

  // ── Google Sign-In (popup) ──
  async loginWithGoogle() {
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const fbUser = result.user;
      // Check if we already know this user's role
      const savedRole = getSavedRole(fbUser.uid);
      if (savedRole) {
        currentUser = mapFirebaseUser(fbUser, savedRole);
        localStorage.setItem('fg-user', JSON.stringify(currentUser));
        notifyAuth();
        return { user: currentUser, needsRole: false };
      }
      // New Google user — needs role selection
      return { user: mapFirebaseUser(fbUser, null), needsRole: true, fbUser };
    } catch (err) {
      // popup dismissed or blocked
      console.warn('Google sign-in cancelled:', err.code);
      return { user: null, needsRole: false, cancelled: true };
    }
  },

  // ── Complete Google sign-in after role is chosen ──
  completeGoogleLogin(fbUser, role) {
    saveUserRole(fbUser.uid, role);
    currentUser = mapFirebaseUser(fbUser, role);
    localStorage.setItem('fg-user', JSON.stringify(currentUser));
    notifyAuth();
    return currentUser;
  },

  // ── Email / mock login ──
  login(email, role) {
    const users = MOCK_USERS[role] || [];
    let user = users.find(u => u.email === email);
    if (!user) {
      user = { ...users[0], email, name: email.split('@')[0] };
    }
    currentUser = { ...user, role };
    localStorage.setItem('fg-user', JSON.stringify(currentUser));
    notifyAuth();
    return currentUser;
  },

  // ── Quick demo login ──
  quickLogin(role) {
    const users = MOCK_USERS[role];
    currentUser = { ...users[0] };
    localStorage.setItem('fg-user', JSON.stringify(currentUser));
    notifyAuth();
    return currentUser;
  },

  // ── Logout ──
  async logout() {
    try { await signOut(firebaseAuth); } catch (_) {}
    currentUser = null;
    localStorage.removeItem('fg-user');
    notifyAuth();
  },

  // ── Get current user ──
  getUser() {
    if (!currentUser) {
      try {
        const saved = localStorage.getItem('fg-user');
        if (saved) currentUser = JSON.parse(saved);
      } catch (_) {}
    }
    return currentUser;
  },

  // ── Subscribe to auth changes ──
  onAuthChange(callback) {
    authListeners.add(callback);
    callback(auth.getUser());

    // Also sync with Firebase Auth state (handles tab refresh)
    const unsub = onAuthStateChanged(firebaseAuth, (fbUser) => {
      if (fbUser) {
        const savedRole = getSavedRole(fbUser.uid);
        if (savedRole && (!currentUser || currentUser.id !== fbUser.uid)) {
          currentUser = mapFirebaseUser(fbUser, savedRole);
          localStorage.setItem('fg-user', JSON.stringify(currentUser));
          notifyAuth();
        }
      } else {
        // Firebase says logged out — clear if it was a Google user
        const saved = auth.getUser();
        if (saved?.isGoogleUser) {
          currentUser = null;
          localStorage.removeItem('fg-user');
          notifyAuth();
        }
      }
    });

    return () => {
      authListeners.delete(callback);
      unsub();
    };
  },

  // ── Update profile ──
  updateProfile(updates) {
    if (currentUser) {
      currentUser = { ...currentUser, ...updates };
      localStorage.setItem('fg-user', JSON.stringify(currentUser));
      // If role changed and it's a Google user, persist the new role for future sign-ins
      if (updates.role && currentUser.isGoogleUser) {
        saveUserRole(currentUser.id, updates.role);
      }
      notifyAuth();
    }
  }
};
