import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Leaf, ArrowLeft, Trash2, Sun, Moon } from 'lucide-react';
import ImpactDashboard from '../components/ImpactDashboard';
import MapViewer from '../components/MapViewer';
import DonationForm from '../components/forms/DonationForm';
import NearbyList from '../components/NearbyList';
import ConfirmOrderModal from '../components/ConfirmOrderModal';
import InlineTracker from '../components/InlineTracker';
import PaymentModal from '../components/PaymentModal';
import { db } from '../lib/firebase';
import { createOrder, fetchRoute } from '../lib/matching';

const DonatePage = ({ donations, requests, orders, selectedMarker, setSelectedMarker, theme, toggleTheme, user, loading, newDataFlash }) => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [selectedReceiver, setSelectedReceiver] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [impactOpen, setImpactOpen] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      });
    }
  }, []);

  // Remove auto-cleanup to allow user to manually dismiss success payment modal

  // Show user's own data if they have any, otherwise show all (for demo with seed data)
  const userDonations = user?.id ? donations.filter(d => d.userId === user.id) : [];
  const myDonations = userDonations.length > 0
    ? userDonations.filter(d => !d.matched)
    : donations.filter(d => !d.matched);
  const matchedDonations = userDonations.length > 0
    ? userDonations.filter(d => d.matched)
    : donations.filter(d => d.matched);
  const activeOrders = orders.filter(o =>
    matchedDonations.some(d => d.orderId === o.id) && o.status !== 'delivered'
  );
  const allMyOrders = orders.filter(o => matchedDonations.some(d => d.orderId === o.id));
  const availableRequests = requests.filter(r => !r.matched);

  const handleSelectReceiver = (receiver) => setSelectedReceiver(receiver);

  const handleConfirmOrder = async (confirmedItem) => {
    const myDonation = myDonations[myDonations.length - 1];
    if (!myDonation) { alert('Please submit a donation first'); return; }
    const { routeCoordinates, distanceKm } = await fetchRoute(myDonation.location, confirmedItem.location);
    await createOrder({
      donation: myDonation, request: confirmedItem,
      billingSplit: confirmedItem.billingSplit, routeCoordinates, distanceKm,
      initiatedBy: 'donor'
    });
    setSelectedReceiver(null);
  };

  const handlePayNow = (order) => setShowPayment(order);
  const handlePaymentComplete = (orderId, paymentId) => {
    db.updateDoc('orders', orderId, { isPaid: true, paymentId });
  };
  const handleClear = async () => { if (window.confirm('Clear all data?')) await db.clearAll(); };

  return (
    <motion.div
      className="app-wrapper"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className="map-layer">
        <MapViewer donations={donations} requests={requests} orders={orders}
          selectedMarker={selectedMarker} setSelectedMarker={setSelectedMarker} theme={theme} />
      </div>

      <div className="overlay-header">
        <div className="header-content">
          <div className="header-left">
            <button className="btn-back" onClick={() => navigate('/')}><ArrowLeft size={16} /></button>
            <div className="panel-container brand-title">
              <Leaf className="color-neon-green" size={22} />
              <span>FOOD<span className="brand-highlight">GUARD</span></span>
            </div>
            <span className="page-badge page-badge-blue">Donor</span>
          </div>
          <div className="header-right-group">
            <button onClick={toggleTheme} className="btn-theme" title="Toggle Theme">
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
            <button onClick={handleClear} className="btn-clear" title="Clear All Data"><Trash2 size={14} /></button>
          </div>
        </div>
      </div>

      <div className="panel-container action-panel">
        <div className="panel-toggle-group">
          <button className={`panel-toggle-btn ${!impactOpen ? 'active' : ''}`} onClick={() => setImpactOpen(false)}>My Food</button>
          <button className={`panel-toggle-btn ${impactOpen ? 'active' : ''}`} onClick={() => setImpactOpen(true)}>Impact</button>
        </div>
        <div className="form-separator" />

        {impactOpen ? (
          <ImpactDashboard orders={orders} isDonor={true} inline={true} />
        ) : (
          <div className="panel-scroll-area">
            {allMyOrders.length > 0 && (
              <div className="panel-section">
                <div className="panel-title-row">
                  <h2 className="panel-title"><span className="panel-title-dot dot-yellow" />Active Deliveries</h2>
                </div>
                {allMyOrders.map(order => (
                  <InlineTracker key={order.id} order={order}
                    onPay={() => handlePayNow(order)}
                    isDonorSide={true} />
                ))}
              </div>
            )}

            {activeOrders.length === 0 && (
              <>
                <div className="panel-title-row">
                  <h2 className="panel-title"><span className="panel-title-dot dot-green" />List Surplus Food</h2>
                </div>
                <DonationForm user={user} />
              </>
            )}

            {myDonations.length > 0 && activeOrders.length === 0 && (
              <>
                <div className="form-separator" style={{ margin: '1rem 0' }} />
                <NearbyList items={availableRequests} userLocation={userLocation} type="receivers" onSelect={handleSelectReceiver} targetQuantity={myDonations[myDonations.length - 1]?.quantity} loading={loading} />
              </>
            )}
          </div>
        )}
      </div>

      {selectedReceiver && (
        <ConfirmOrderModal selectedItem={selectedReceiver} type="receivers" onConfirm={handleConfirmOrder} onClose={() => setSelectedReceiver(null)} />
      )}
      {showPayment && <PaymentModal order={showPayment} onClose={() => setShowPayment(null)} onPaymentComplete={handlePaymentComplete} />}
    </motion.div>
  );
};

export default DonatePage;
