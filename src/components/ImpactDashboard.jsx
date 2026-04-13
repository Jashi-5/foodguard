import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Flame, Leaf, Truck, TrendingUp, Zap, Award } from 'lucide-react';

/* ── Animated counter hook ── */
const useAnimatedCounter = (target, duration = 1200) => {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;
    const startTime = performance.now();

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return display;
};

/* ── Increment popup ── */
const IncrementPopup = ({ value, label, color }) => {
  if (!value) return null;
  return (
    <div className="impact-popup" style={{ color }}>
      +{value} {label}
    </div>
  );
};

/* ── Stat card ── */
const StatCard = ({ icon: Icon, label, value, unit, color, increment, incrementLabel }) => {
  const animated = useAnimatedCounter(value);
  const [showPopup, setShowPopup] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const prevValRef = useRef(value);

  useEffect(() => {
    if (value > prevValRef.current) {
      setShowPopup(true);
      setGlowing(true);
      const t1 = setTimeout(() => setShowPopup(false), 1800);
      const t2 = setTimeout(() => setGlowing(false), 1200);
      prevValRef.current = value;
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
    prevValRef.current = value;
  }, [value]);

  return (
    <div className={`impact-stat ${glowing ? 'impact-stat-glow' : ''}`} style={{ '--stat-color': color }}>
      <div className="impact-stat-icon">
        <Icon size={18} />
      </div>
      <div className="impact-stat-body">
        <div className="impact-stat-value">
          {animated.toLocaleString()}
          {unit && <span className="impact-stat-unit">{unit}</span>}
        </div>
        <div className="impact-stat-label">{label}</div>
      </div>
      {showPopup && increment > 0 && (
        <IncrementPopup value={increment} label={incrementLabel} color={color} />
      )}
    </div>
  );
};

/* ── Main component ── */
const ImpactDashboard = ({ orders = [], donations = [], isOpen, onToggle }) => {
  const [stats, setStats] = useState({
    mealsSaved: 0,
    co2Reduced: 0,
    deliveriesCompleted: 0,
    streak: 0,
    dailyGoal: 50,
    dailyProgress: 0,
  });
  const [increments, setIncrements] = useState({ meals: 0, co2: 0, deliveries: 0 });
  const prevDeliveredRef = useRef(0);

  // Compute stats from delivered orders
  useEffect(() => {
    const delivered = orders.filter(o => o.status === 'delivered');
    const count = delivered.length;

    if (count > prevDeliveredRef.current) {
      const diff = count - prevDeliveredRef.current;
      const newMeals = delivered.reduce((sum, o) => sum + (o.foodQuantity || 10), 0);
      const newCo2 = +(newMeals * 2.5).toFixed(1); // ~2.5kg CO2 per meal saved
      const mealDiff = diff * 10; // approximate per-order increment

      setIncrements({ meals: mealDiff, co2: +(mealDiff * 2.5).toFixed(0), deliveries: diff });
      setStats(prev => ({
        ...prev,
        mealsSaved: newMeals,
        co2Reduced: newCo2,
        deliveriesCompleted: count,
        dailyProgress: Math.min(count, prev.dailyGoal),
        streak: prev.streak + diff,
      }));
    }
    prevDeliveredRef.current = count;
  }, [orders]);

  // Auto-seed some baseline stats so the dashboard looks alive on first load
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats(prev => ({
        ...prev,
        mealsSaved: prev.mealsSaved + 1247,
        co2Reduced: +(prev.co2Reduced + 3117.5).toFixed(1),
        deliveriesCompleted: prev.deliveriesCompleted + 89,
        streak: 12,
        dailyProgress: 34,
      }));
      setIncrements({ meals: 1247, co2: 3118, deliveries: 89 });
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const progressPct = Math.round((stats.dailyProgress / stats.dailyGoal) * 100);

  return (
    <>
      {/* Toggle tab */}
      <button className="impact-toggle" onClick={onToggle} title="Impact Dashboard">
        <TrendingUp size={16} />
        <span className="impact-toggle-label">Impact</span>
      </button>

      {/* Panel */}
      <div className={`impact-dashboard ${isOpen ? 'impact-open' : ''}`}>
        <div className="impact-header">
          <div className="impact-header-left">
            <Zap size={16} className="color-neon-yellow" />
            <span className="impact-header-title">Live Impact</span>
          </div>
          <div className="impact-streak">
            <Award size={13} />
            <span>{stats.streak} day streak</span>
          </div>
        </div>

        {/* Stat cards */}
        <div className="impact-grid">
          <StatCard
            icon={Flame} label="Meals Saved" value={stats.mealsSaved}
            color="var(--neon-green)" increment={increments.meals} incrementLabel="meals"
          />
          <StatCard
            icon={Leaf} label="CO₂ Reduced" value={stats.co2Reduced}
            unit="kg" color="var(--neon-blue)"
            increment={increments.co2} incrementLabel="kg"
          />
          <StatCard
            icon={Truck} label="Deliveries" value={stats.deliveriesCompleted}
            color="var(--neon-purple)" increment={increments.deliveries} incrementLabel="done"
          />
        </div>

        {/* Daily progress */}
        <div className="impact-daily">
          <div className="impact-daily-header">
            <span className="impact-daily-label">Daily Goal</span>
            <span className="impact-daily-count">{stats.dailyProgress}/{stats.dailyGoal} deliveries</span>
          </div>
          <div className="impact-daily-track">
            <div
              className="impact-daily-fill"
              style={{ width: `${Math.min(progressPct, 100)}%` }}
            />
          </div>
          <div className="impact-daily-pct">{progressPct}%</div>
        </div>
      </div>
    </>
  );
};

export default ImpactDashboard;
