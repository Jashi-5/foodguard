import React, { useState, useEffect } from 'react';
import { ORDER_STATUSES, getStatusIndex } from '../lib/delivery';
import { Phone, Star, Send, Heart } from 'lucide-react';

const InlineTracker = ({ order, onPayNow, viewSide }) => {
  // viewSide: 'donor' or 'receiver' — determines what UI to show
  const [elapsed, setElapsed] = useState(0);
  const [thankYouNote, setThankYouNote] = useState('');
  const [thankYouSent, setThankYouSent] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!order || order.status === 'delivered') return;
    const start = new Date(order.createdAt).getTime();
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [order]);

  // Auto-dismiss delivered+paid orders after 5 seconds
  useEffect(() => {
    if (order?.status === 'delivered' && order?.isPaid) {
      const timer = setTimeout(() => setDismissed(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, order?.isPaid]);

  // Auto-dismiss free deliveries (donor paid) after 8 seconds even without payment
  useEffect(() => {
    if (order?.status === 'delivered' && order?.billingSplit === 'donor' && viewSide === 'receiver') {
      const timer = setTimeout(() => setDismissed(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [order?.status, order?.billingSplit, viewSide]);

  if (!order || dismissed) return null;

  const currentIdx = getStatusIndex(order.status);
  const { agent, vehicle, etaMinutes } = order;
  const remainingMin = Math.max(0, Math.ceil(etaMinutes - elapsed / 60));
  const isDelivered = order.status === 'delivered';
  const isPaid = order.isPaid;
  const donorPays = order.billingSplit === 'donor';
  const receiverPays = order.billingSplit === 'receiver';

  // Determine if this side needs to pay
  const iNeedToPay = (viewSide === 'donor' && donorPays) || (viewSide === 'receiver' && receiverPays);
  const iGotFree = viewSide === 'receiver' && donorPays;

  const handleSendThankYou = () => {
    if (!thankYouNote.trim()) return;
    setThankYouSent(true);
    // In a real app, this would send to the backend
  };

  return (
    <div className="inline-tracker">
      {/* Tracker Header */}
      <div className="tracker-bar">
        <div className="tracker-bar-left">
          <span className="tracker-vehicle-emoji">{vehicle?.emoji}</span>
          <div>
            <div className="tracker-bar-title">
              {isDelivered ? '✅ Delivered!' : `${agent?.name} — ${order.status?.replace(/_/g, ' ')}`}
            </div>
            <div className="tracker-bar-sub">
              {vehicle?.name} • {order.distanceKm} km
              {!isDelivered && ` • ETA ${remainingMin} min`}
            </div>
          </div>
        </div>
        {!isDelivered && (
          <div className="tracker-eta-badge">
            {remainingMin}<span className="tracker-eta-unit">min</span>
          </div>
        )}
      </div>

      {/* Billing info strip */}
      <div className="tracker-billing-strip">
        {donorPays && viewSide === 'receiver' && (
          <div className="tracker-strip tracker-strip-free">
            🎁 <span>Free delivery — Donor is paying!</span>
          </div>
        )}
        {donorPays && viewSide === 'donor' && (
          <div className="tracker-strip tracker-strip-donor">
            🎁 <span>You're covering delivery (₹{order.billing.total})</span>
          </div>
        )}
        {receiverPays && viewSide === 'receiver' && (
          <div className="tracker-strip tracker-strip-pay">
            💳 <span>You pay ₹{order.billing.total} after delivery</span>
          </div>
        )}
        {receiverPays && viewSide === 'donor' && (
          <div className="tracker-strip tracker-strip-info">
            💳 <span>Receiver pays ₹{order.billing.total}</span>
          </div>
        )}
      </div>

      {/* Agent Card */}
      {agent && (
        <div className="tracker-agent">
          <div className="tracker-agent-avatar" style={{ background: vehicle.color + '18', color: vehicle.color }}>
            {vehicle.emoji}
          </div>
          <div className="tracker-agent-info">
            <div className="tracker-agent-name">{agent.name}</div>
            <div className="tracker-agent-meta">
              <span>{agent.vehicleNumber}</span>
              <span className="tracker-agent-rating">
                <Star size={9} fill="currentColor" /> {agent.rating}
              </span>
            </div>
          </div>
          <button className="tracker-call-btn" title="Call driver">
            <Phone size={13} />
          </button>
        </div>
      )}

      {/* Progress Steps — compact horizontal */}
      <div className="tracker-steps">
        {ORDER_STATUSES.map((step, idx) => {
          const done = idx <= currentIdx;
          const active = idx === currentIdx;
          return (
            <div key={step.key} className={`tracker-step ${done ? 'done' : ''} ${active ? 'active' : ''}`}>
              <div className={`tracker-step-dot ${done ? 'filled' : ''} ${active ? 'pulsing' : ''}`}>
                {done ? step.icon : ''}
              </div>
              <span className="tracker-step-label">{step.label}</span>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      {order.status === 'in_transit' && (
        <div className="tracker-progress">
          <div className="tracker-progress-track">
            <div className="tracker-progress-fill" style={{ width: `${(order.deliveryProgress || 0) * 100}%` }} />
          </div>
          <span className="tracker-progress-pct">{Math.round((order.deliveryProgress || 0) * 100)}%</span>
        </div>
      )}

      {/* Payment — only shown to the side that needs to pay */}
      {isDelivered && !isPaid && iNeedToPay && (
        <div className="tracker-payment">
          <div className="tracker-payment-info">
            <div className="tracker-payment-label">Payment Due</div>
            <div className="tracker-payment-split">
              {donorPays ? 'You chose to pay' : 'Delivery fee'}
            </div>
          </div>
          <button className="tracker-pay-btn" onClick={() => onPayNow && onPayNow(order)}>
            💳 Pay ₹{order.billing.total}
          </button>
        </div>
      )}

      {/* Completed payment badge */}
      {isDelivered && isPaid && (
        <div className="tracker-paid-badge">
          ✅ Payment Complete — ₹{order.billing.total}
        </div>
      )}

      {/* Thank You Note — shown to receiver when donor paid & delivery complete */}
      {isDelivered && iGotFree && !thankYouSent && (
        <div className="tracker-thankyou">
          <div className="tracker-thankyou-header">
            <Heart size={14} className="color-neon-red" />
            <span>Send a thank you to the donor</span>
          </div>
          <div className="tracker-thankyou-input-row">
            <input
              type="text"
              className="input-base tracker-thankyou-input"
              placeholder="Thank you for the food! 🙏"
              value={thankYouNote}
              onChange={e => setThankYouNote(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendThankYou()}
            />
            <button
              className="tracker-thankyou-send"
              onClick={handleSendThankYou}
              disabled={!thankYouNote.trim()}
            >
              <Send size={13} />
            </button>
          </div>
        </div>
      )}

      {isDelivered && iGotFree && thankYouSent && (
        <div className="tracker-thankyou-sent">
          <Heart size={13} className="color-neon-red" />
          <span>Thank you note sent! "{thankYouNote}"</span>
        </div>
      )}

      {/* Donor sees "received for free" confirmation */}
      {isDelivered && !iNeedToPay && viewSide === 'receiver' && !donorPays && isPaid && (
        <div className="tracker-paid-badge">
          ✅ Delivery complete
        </div>
      )}
    </div>
  );
};

export default InlineTracker;
