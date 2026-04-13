import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, ArrowLeft, Trash2, Sun, Moon } from 'lucide-react';
import ImpactDashboard from '../components/ImpactDashboard';
import MapViewer from '../components/MapViewer';
import RequestForm from '../components/forms/RequestForm';
import NearbyList from '../components/NearbyList';
import ConfirmOrderModal from '../components/ConfirmOrderModal';
import InlineTracker from '../components/InlineTracker';
import PaymentModal from '../components/PaymentModal';
import { db } from '../lib/firebase';
import { createOrder, fetchRoute } from '../lib/matching';

const RequestPage = ({ donations, requests, orders, selectedMarker, setSelectedMarker, theme, toggleTheme, user, loading, newDataFlash }) => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState(null);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [showPayment, setShowPayment] = useState(null);
  const [impactOpen, setImpactOpen] = useState(false);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      });
    }
  }, []);

  // Auto-cleanup when an order gets delivered
  useEffect(() => {
    const justDelivered = orders.find(o =>
      o.status === 'delivered' && showPayment?.id === o.id && o.isPaid
    );
    if (justDelivered) {
      setTimeout(() => {
        setShowPayment(null);
        setSelectedDonor(null);
      }, 800);
    }
  }, [orders, showPayment]);

  // Show user's own data if they have any, otherwise show all (for demo with seed data)
  const userRequests = user?.id ? requests.filter(r => r.userId === user.id) : [];
  const myRequests = userRequests.length > 0
    ? userRequests.filter(r => !r.matched)
    : requests.filter(r => !r.matched);
  const matchedRequests = userRequests.length > 0
    ? userRequests.filter(r => r.matched)
    : requests.filter(r => r.matched);
  const activeOrders = orders.filter(o =>
    matchedRequests.some(r => r.orderId === o.id) && o.status !== 'delivered'
  );
  const allMyOrders = orders.filter(o => matchedRequests.some(r => r.orderId === o.id));
  const availableDonations = donations.filter(d => !d.matched);

  const handleSelectDonor = (donor) => setSelectedDonor(donor);

  const handleConfirmOrder = async (confirmedItem) => {
    const myRequest = myRequests[myRequests.length - 1];
    if (!myRequest) { alert('Please submit a food request first'); return; }
    const { routeCoordinates, distanceKm } = await fetchRoute(confirmedItem.location, myRequest.location);
    await createOrder({
      donation: confirmedItem, request: myRequest,
      billingSplit: confirmedItem.billingSplit, routeCoordinates, distanceKm
    });
    setSelectedDonor(null);
  };

  const handlePayNow = (order) => setShowPayment(order);
  const handlePaymentComplete = (orderId, paymentId) => {
    db.updateDoc('orders', orderId, { isPaid: true, paymentId });
  };
  const handleClear = async () => { if (window.confirm('Clear all data?')) await db.clearAll(); };

  return (
    <div className="app-wrapper">
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
            <span className="page-badge page-badge-red">Receiver</span>
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
        {allMyOrders.length > 0 && (
          <div className="panel-section">
            {allMyOrders.map(order => (
              <InlineTracker key={order.id} order={order} onPayNow={handlePayNow} viewSide="receiver" />
            ))}
          </div>
        )}

        {activeOrders.length === 0 && (
          <>
            <div className="panel-title-row">
              <h2 className="panel-title"><span className="panel-title-dot dot-red" />Request Food</h2>
            </div>
            <RequestForm user={user} />
          </>
        )}

        {myRequests.length > 0 && activeOrders.length === 0 && (
          <>
            <div className="form-separator" style={{ margin: '1rem 0' }} />
            <NearbyList items={availableDonations} userLocation={userLocation} type="donors" onSelect={handleSelectDonor} />
          </>
        )}
      </div>

      {selectedDonor && (
        <ConfirmOrderModal selectedItem={selectedDonor} type="donors" onConfirm={handleConfirmOrder} onClose={() => setSelectedDonor(null)} />
      )}
      {showPayment && (
        <PaymentModal order={showPayment} onClose={() => setShowPayment(null)} onPaymentComplete={handlePaymentComplete} />
      )}

      <ImpactDashboard orders={orders} donations={donations} isOpen={impactOpen} onToggle={() => setImpactOpen(o => !o)} />
    </div>
  );
};

export default RequestPage;
