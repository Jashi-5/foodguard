import React, { useState } from 'react';
import { X, MapPin, Clock, Truck, Users, Utensils, Heart, Gift } from 'lucide-react';

const BILLING_OPTIONS = [
  { id: 'donor', label: 'I\'ll pay', desc: 'Receiver gets food for free', icon: '🎁' },
  { id: 'receiver', label: 'Receiver pays', desc: 'Delivery cost charged to receiver', icon: '💳' },
];

const ConfirmOrderModal = ({ selectedItem, type, onConfirm, onClose }) => {
  // type === 'receivers' means a DONOR is selecting a receiver
  // type === 'donors' means a RECEIVER is selecting a donor
  const isDonorSide = type === 'receivers';

  const [billingSplit, setBillingSplit] = useState('donor');
  const [submitting, setSubmitting] = useState(false);

  if (!selectedItem) return null;

  const { vehicle, billing, eta, distance } = selectedItem;

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await onConfirm({ ...selectedItem, billingSplit: isDonorSide ? billingSplit : 'donor' });
    } catch (e) {
      console.error(e);
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Confirm Delivery</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Match Details */}
        <div className="modal-section">
          <div className="modal-match-card">
            <div className="modal-match-icon" style={{ background: vehicle.color + '15', color: vehicle.color }}>
              {type === 'donors' ? <Utensils size={20} /> : <Users size={20} />}
            </div>
            <div className="modal-match-info">
              {type === 'donors' ? (
                <>
                  <div className="modal-match-name">{selectedItem.foodType}</div>
                  <div className="modal-match-meta">{selectedItem.quantity} servings</div>
                </>
              ) : (
                <>
                  <div className="modal-match-name">{selectedItem.peopleCount} people</div>
                  <div className="modal-match-meta">Urgency: {selectedItem.urgencyLevel}</div>
                </>
              )}
            </div>
          </div>

          <div className="modal-stats-row">
            <div className="modal-stat">
              <MapPin size={14} />
              <span>{distance.toFixed(1)} km</span>
            </div>
            <div className="modal-stat">
              <Clock size={14} />
              <span>~{eta} min ETA</span>
            </div>
            <div className="modal-stat" style={{ color: vehicle.color }}>
              <Truck size={14} />
              <span>{vehicle.emoji} {vehicle.name}</span>
            </div>
          </div>
        </div>

        {/* Billing Breakdown */}
        <div className="modal-section">
          <label className="form-label">Delivery Cost</label>
          <div className="modal-billing">
            {billing.breakdown.map((item, i) => (
              <div className="modal-billing-row" key={i}>
                <span>{item.label}</span>
                <span>₹{item.amount}</span>
              </div>
            ))}
            <div className="modal-billing-divider" />
            <div className="modal-billing-row modal-billing-total">
              <span>Total</span>
              <span>₹{billing.total}</span>
            </div>
          </div>
        </div>

        {/* Who Pays — ONLY shown to donor */}
        {isDonorSide ? (
          <div className="modal-section">
            <label className="form-label">Who pays for delivery?</label>
            <div className="modal-split-options">
              {BILLING_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  className={`modal-split-btn ${billingSplit === opt.id ? 'active' : ''}`}
                  onClick={() => setBillingSplit(opt.id)}
                >
                  <div className="modal-split-row">
                    <span className="modal-split-icon">{opt.icon}</span>
                    <div>
                      <span className="modal-split-label">{opt.label}</span>
                      <span className="modal-split-desc">{opt.desc}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {billingSplit === 'donor' && (
              <div className="modal-gift-note">
                <Gift size={13} />
                <span>You're gifting free food delivery! The receiver will be able to send you a thank you note.</span>
              </div>
            )}
          </div>
        ) : (
          /* Receiver side — read-only note */
          <div className="modal-section">
            <div className="modal-info-note">
              <span>💡</span>
              <span>The donor will decide who pays for delivery. If they cover it, you'll receive this for free!</span>
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <button className="modal-confirm-btn" onClick={handleConfirm} disabled={submitting}>
          <span>{submitting ? 'Creating order...' : 'Confirm Order'}</span>
          {isDonorSide && billingSplit === 'donor' && (
            <span className="modal-confirm-price">You pay ₹{billing.total}</span>
          )}
          {isDonorSide && billingSplit === 'receiver' && (
            <span className="modal-confirm-price">Receiver pays ₹{billing.total}</span>
          )}
        </button>

        <p className="modal-footer-note">
          💡 Payment will be collected after successful delivery
        </p>
      </div>
    </div>
  );
};

export default ConfirmOrderModal;
