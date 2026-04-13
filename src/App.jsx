import { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { db } from './lib/firebase';
import { auth } from './lib/auth';
import { seedDemoData } from './lib/seed';
import LandingPage from './pages/LandingPage';
import DonatePage from './pages/DonatePage';
import RequestPage from './pages/RequestPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  const [donations, setDonations] = useState([]);
  const [requests, setRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('fg-theme') || 'dark');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newDataFlash, setNewDataFlash] = useState(false);

  const loadedRef = useRef({ donations: false, requests: false, orders: false });
  const isFirstLoad = useRef(true);
  const seeded = useRef(false);

  const checkAllLoaded = () => {
    if (loadedRef.current.donations && loadedRef.current.requests && loadedRef.current.orders) {
      setLoading(false);
    }
  };

  // Real-time Firestore listeners (with in-memory fallback)
  useEffect(() => {
    const handleSnapshot = (name) => (docs) => {
      if (name === 'donations') setDonations(docs);
      else if (name === 'requests') setRequests(docs);
      else if (name === 'orders') setOrders(docs);

      if (!loadedRef.current[name]) {
        loadedRef.current[name] = true;
        checkAllLoaded();
      } else if (!isFirstLoad.current) {
        setNewDataFlash(true);
        setTimeout(() => setNewDataFlash(false), 1500);
      }
    };

    const unsubs = [
      db.onSnapshot('donations', handleSnapshot('donations')),
      db.onSnapshot('requests', handleSnapshot('requests')),
      db.onSnapshot('orders', handleSnapshot('orders')),
    ];

    // Mark first-load done after 2s so future changes trigger flash
    const firstLoadTimer = setTimeout(() => { isFirstLoad.current = false; }, 2000);

    // Safety: don't hang on loading — 4s max for demo
    const safetyTimer = setTimeout(() => { setLoading(false); }, 4000);

    return () => {
      unsubs.forEach(u => u());
      clearTimeout(firstLoadTimer);
      clearTimeout(safetyTimer);
    };
  }, []);

  // Auth listener
  useEffect(() => {
    return auth.onAuthChange((u) => {
      setUser(u);
      db.setUserId(u?.id || null);
    });
  }, []);

  // Seed demo data once
  useEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      seedDemoData();
    }
  }, []);

  // Theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fg-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  const sharedProps = {
    donations, requests, orders,
    selectedMarker, setSelectedMarker,
    theme, toggleTheme, user, loading, newDataFlash,
  };

  return (
    <Router>
      {loading && (
        <div className="data-loading-overlay">
          <div className="loading-spinner" />
          <p className="loading-text">Connecting to FoodGuard...</p>
        </div>
      )}

      <div className={newDataFlash ? 'new-data-glow' : ''}>
        <Routes>
          <Route path="/" element={<LandingPage theme={theme} toggleTheme={toggleTheme} user={user} orders={orders} donations={donations} loading={loading} />} />
          <Route path="/donate" element={<DonatePage {...sharedProps} />} />
          <Route path="/request" element={<RequestPage {...sharedProps} />} />
          <Route path="/profile" element={<ProfilePage theme={theme} toggleTheme={toggleTheme} orders={orders} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
