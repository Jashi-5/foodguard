import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Banknote, CheckCircle, Shield, X, Smartphone, Lock } from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Visa, Mastercard, Amex', recommended: true },
  { id: 'upi', label: 'UPI', icon: Smartphone, desc: 'GPay, PhonePe, Paytm' },
  { id: 'cod', label: 'Cash on Delivery', icon: Banknote, desc: 'Pay when food arrives' },
];

const PaymentModal = ({ order, onClose, onPaymentComplete }) => {
  const [method, setMethod] = useState('card');
  const [step, setStep] = useState('choose'); // choose | card_form | processing | success
  const [upiId, setUpiId] = useState('');
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [cardErrors, setCardErrors] = useState({});
  const stripeMountRef = useRef(null);

  if (!order) return null;

  const amount = order.billingSplit === 'split'
    ? Math.ceil(order.billing.total / 2)
    : order.billing.total;

  // Format card number with spaces
  const formatCardNumber = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format expiry as MM/YY
  const formatExpiry = (val) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    return cleaned;
  };

  const handleCardChange = (field, value) => {
    let formatted = value;
    if (field === 'number') formatted = formatCardNumber(value);
    if (field === 'expiry') formatted = formatExpiry(value);
    if (field === 'cvc') formatted = value.replace(/\D/g, '').slice(0, 4);
    setCardData(prev => ({ ...prev, [field]: formatted }));
    setCardErrors(prev => ({ ...prev, [field]: null }));
  };

  const validateCard = () => {
    const errors = {};
    if (cardData.number.replace(/\s/g, '').length < 15) errors.number = 'Enter a valid card number';
    if (cardData.expiry.length < 5) errors.expiry = 'MM/YY';
    if (cardData.cvc.length < 3) errors.cvc = 'Invalid';
    if (cardData.name.trim().length < 2) errors.name = 'Enter cardholder name';
    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePay = async () => {
    if (method === 'card') {
      if (!validateCard()) return;
    }

    // Demo payment simulation
    setStep('processing');
    setTimeout(() => {
      setStep('success');
      onPaymentComplete(order.id, `pay_${method}_${Date.now()}`);
    }, 2400);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container modal-payment" onClick={e => e.stopPropagation()}>
        {step === 'choose' && (
          <>
            <div className="modal-header">
              <h2 className="modal-title">Complete Payment</h2>
              <button className="modal-close" onClick={onClose}><X size={18} /></button>
            </div>

            <div className="payment-amount-display">
              <span className="payment-amount-label">Amount Due</span>
              <span className="payment-amount-value">₹{amount}</span>
              {order.billingSplit === 'split' && (
                <span className="payment-amount-note">Your share (50/50 split)</span>
              )}
            </div>

            <div className="modal-section">
              <label className="form-label">Payment Method</label>
              <div className="payment-method-list">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  return (
                    <button key={m.id}
                      className={`payment-method-option ${method === m.id ? 'active' : ''}`}
                      onClick={() => setMethod(m.id)}>
                      <Icon size={18} />
                      <div className="payment-method-text">
                        <span className="payment-method-name">{m.label}</span>
                        <span className="payment-method-desc">{m.desc}</span>
                      </div>
                      {m.recommended && <span className="payment-recommended">Recommended</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* UPI ID input */}
            {method === 'upi' && (
              <div className="modal-section">
                <label className="form-label">UPI ID</label>
                <input type="text" className="input-base" placeholder="yourname@upi"
                  value={upiId} onChange={e => setUpiId(e.target.value)} />
              </div>
            )}

            {/* Card form — Stripe-style inline */}
            {method === 'card' && (
              <div className="modal-section stripe-card-form">
                <div className="stripe-form-group">
                  <label className="form-label">Card Number</label>
                  <div className={`stripe-input-wrap ${cardErrors.number ? 'stripe-error' : ''}`}>
                    <CreditCard size={16} className="stripe-input-icon" />
                    <input type="text" className="stripe-input" placeholder="4242 4242 4242 4242"
                      value={cardData.number} onChange={e => handleCardChange('number', e.target.value)} />
                  </div>
                  {cardErrors.number && <span className="stripe-error-text">{cardErrors.number}</span>}
                </div>

                <div className="stripe-form-row">
                  <div className="stripe-form-group stripe-form-half">
                    <label className="form-label">Expiry</label>
                    <div className={`stripe-input-wrap ${cardErrors.expiry ? 'stripe-error' : ''}`}>
                      <input type="text" className="stripe-input" placeholder="MM/YY"
                        value={cardData.expiry} onChange={e => handleCardChange('expiry', e.target.value)} />
                    </div>
                    {cardErrors.expiry && <span className="stripe-error-text">{cardErrors.expiry}</span>}
                  </div>
                  <div className="stripe-form-group stripe-form-half">
                    <label className="form-label">CVC</label>
                    <div className={`stripe-input-wrap ${cardErrors.cvc ? 'stripe-error' : ''}`}>
                      <Lock size={14} className="stripe-input-icon" />
                      <input type="text" className="stripe-input" placeholder="123"
                        value={cardData.cvc} onChange={e => handleCardChange('cvc', e.target.value)} />
                    </div>
                    {cardErrors.cvc && <span className="stripe-error-text">{cardErrors.cvc}</span>}
                  </div>
                </div>

                <div className="stripe-form-group">
                  <label className="form-label">Cardholder Name</label>
                  <div className={`stripe-input-wrap ${cardErrors.name ? 'stripe-error' : ''}`}>
                    <input type="text" className="stripe-input" placeholder="Full name on card"
                      value={cardData.name} onChange={e => handleCardChange('name', e.target.value)} />
                  </div>
                  {cardErrors.name && <span className="stripe-error-text">{cardErrors.name}</span>}
                </div>
              </div>
            )}

            <button className="modal-pay-btn" onClick={handlePay}>
              <Shield size={16} />
              {method === 'cod' ? 'Confirm Cash Payment' : `Pay ₹${amount}`}
            </button>

            <div className="payment-secure-note">
              <Lock size={11} />
              <span>Secure payment • 256-bit TLS encryption</span>
            </div>
          </>
        )}

        {step === 'processing' && (
          <div className="payment-processing-view">
            <div className="payment-processing-spinner">
              <div className="processing-ring" />
            </div>
            <h2>Processing Payment...</h2>
            <p>₹{amount} via {method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Cash'}</p>
            <p className="payment-processing-sub">Please do not close this window</p>
          </div>
        )}

        {step === 'success' && (
          <div className="payment-success-view">
            <div className="payment-success-icon">
              <CheckCircle size={56} />
            </div>
            <h2>Payment Successful!</h2>
            <p className="payment-success-amount">₹{amount}</p>
            <p className="payment-success-method">
              Paid via {method === 'upi' ? 'UPI' : method === 'card' ? 'Card' : 'Cash on Delivery'}
            </p>
            <button className="modal-confirm-btn" onClick={onClose}>Done</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
