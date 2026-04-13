// ─── Firebase Configuration (Auth only) ────────────────────────────────────
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDGm3VvhsFDf3PGKFqKZ1kdmrgMyuqHHLk",
  authDomain: "foodguard-93907.firebaseapp.com",
  projectId: "foodguard-93907",
  storageBucket: "foodguard-93907.firebasestorage.app",
  messagingSenderId: "65787933809",
  appId: "1:65787933809:web:667c84acc8ee7910a697d0",
  measurementId: "G-6GDH8EXVM4",
};

const app = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// ─── localStorage Real-Time Database ─────────────────────────────────────────
// Simple, stable, zero-network demo DB.
// Syncs across tabs via 1-second polling of localStorage.

const STORAGE_KEY = 'fg-db';
const generateId = () => Math.random().toString(36).substring(2, 15);

/** Read the entire DB from localStorage */
const readDB = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {}
  return { donations: [], requests: [], orders: [] };
};

/** Write the entire DB to localStorage */
const writeDB = (data) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// Active listeners: { collectionName -> Set<callback> }
const listeners = {
  donations: new Set(),
  requests: new Set(),
  orders: new Set(),
};

// Last-known snapshot per collection (for change detection)
let lastSnapshot = { donations: '', requests: '', orders: '' };

/** Notify all listeners for a collection */
const notify = (collectionName) => {
  const data = readDB();
  const docs = data[collectionName] || [];
  listeners[collectionName].forEach(cb => cb([...docs]));
};

/** Notify ALL collections (used after write operations) */
const notifyAll = () => {
  notify('donations');
  notify('requests');
  notify('orders');
};

// ─── Polling: check localStorage every 1s for cross-tab changes ─────────────
let pollingStarted = false;
const startPolling = () => {
  if (pollingStarted) return;
  pollingStarted = true;

  setInterval(() => {
    const data = readDB();
    for (const col of ['donations', 'requests', 'orders']) {
      const current = JSON.stringify(data[col] || []);
      if (current !== lastSnapshot[col]) {
        lastSnapshot[col] = current;
        listeners[col].forEach(cb => cb([...(data[col] || [])]));
      }
    }
  }, 1000);
};

// Also listen for storage events (instant cross-tab sync in same browser)
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) {
      notifyAll();
    }
  });
}

// Current user ID — auto-attached to new documents
let _currentUserId = null;

// ─── Public API ──────────────────────────────────────────────────────────────
export const db = {
  setUserId(uid) { _currentUserId = uid; },

  async addDoc(collectionName, data) {
    const dbData = readDB();
    const doc = {
      id: generateId(),
      ...data,
      userId: data.userId || _currentUserId || null,
      createdAt: new Date().toISOString(),
    };
    dbData[collectionName].push(doc);
    writeDB(dbData);
    notify(collectionName);
    return { id: doc.id };
  },

  async updateDoc(collectionName, docId, updates) {
    const dbData = readDB();
    const idx = dbData[collectionName].findIndex(d => d.id === docId);
    if (idx !== -1) {
      dbData[collectionName][idx] = {
        ...dbData[collectionName][idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      writeDB(dbData);
      notify(collectionName);
      return true;
    }
    return false;
  },

  async removeDoc(collectionName, docId) {
    const dbData = readDB();
    dbData[collectionName] = dbData[collectionName].filter(d => d.id !== docId);
    writeDB(dbData);
    notify(collectionName);
  },

  async getDoc(collectionName, docId) {
    const dbData = readDB();
    return dbData[collectionName].find(d => d.id === docId) || null;
  },

  /**
   * Subscribe to real-time updates for a collection.
   * Uses polling + storage events for cross-tab sync.
   * Returns an unsubscribe function.
   */
  onSnapshot(collectionName, callback) {
    startPolling();
    listeners[collectionName].add(callback);

    // Immediately fire with current data
    const data = readDB();
    const docs = data[collectionName] || [];
    lastSnapshot[collectionName] = JSON.stringify(docs);
    callback([...docs]);

    // Return unsubscribe
    return () => { listeners[collectionName].delete(callback); };
  },

  async clearAll() {
    writeDB({ donations: [], requests: [], orders: [] });
    notifyAll();
  },

  async getCount(collectionName) {
    const data = readDB();
    return (data[collectionName] || []).length;
  },

  GeoPoint: class GeoPoint {
    constructor(lat, lng) {
      this.latitude = lat;
      this.longitude = lng;
    }
  },
};
