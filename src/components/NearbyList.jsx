import React from 'react';
import { calculateDistance, assignVehicle, calculateDeliveryFee, estimateDeliveryTime } from '../lib/delivery';
import { MapPin, Clock, Users, Utensils, ChevronRight } from 'lucide-react';

const NearbyList = ({ items, userLocation, type, onSelect }) => {
  if (!userLocation) return null;

  // Calculate distances and sort by nearest
  const itemsWithDistance = items
    .map(item => {
      const dist = calculateDistance(
        userLocation.latitude, userLocation.longitude,
        item.location.latitude, item.location.longitude
      );
      const qty = type === 'donors' ? (item.quantity || 10) : (item.peopleCount || 10);
      const vehicle = assignVehicle(qty);
      const billing = calculateDeliveryFee(vehicle, dist);
      const eta = estimateDeliveryTime(vehicle, dist);
      return { ...item, distance: dist, vehicle, billing, eta };
    })
    .filter(item => item.distance < 25) // 25km radius
    .sort((a, b) => a.distance - b.distance);

  if (itemsWithDistance.length === 0) {
    return (
      <div className="nearby-empty">
        <MapPin size={24} strokeWidth={1.5} />
        <p>No {type} found nearby</p>
        <span>New {type} will appear here automatically</span>
      </div>
    );
  }

  return (
    <div className="nearby-list">
      <div className="nearby-header">
        <h3 className="nearby-title">
          <span className={`panel-title-dot ${type === 'donors' ? 'dot-green' : 'dot-red'}`} />
          Nearby {type === 'donors' ? 'Donors' : 'Receivers'}
        </h3>
        <span className="nearby-count">{itemsWithDistance.length} found</span>
      </div>

      <div className="nearby-items">
        {itemsWithDistance.map(item => (
          <button
            key={item.id}
            className={`nearby-card ${type === 'donors' ? 'nearby-card-green' : 'nearby-card-red'}`}
            onClick={() => onSelect(item)}
          >
            <div className="nearby-card-top">
              <div className="nearby-card-info">
                {type === 'donors' ? (
                  <>
                    <div className="nearby-card-name">
                      <Utensils size={13} />
                      <span>{item.foodType}</span>
                    </div>
                    <div className="nearby-card-meta">
                      {item.quantity} servings • Expires {new Date(item.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="nearby-card-name">
                      <Users size={13} />
                      <span>{item.peopleCount} people</span>
                    </div>
                    <div className="nearby-card-meta">
                      Urgency: {item.urgencyLevel}
                      {item.notes && ` • ${item.notes}`}
                    </div>
                  </>
                )}
              </div>
              <ChevronRight size={16} className="nearby-card-arrow" />
            </div>

            <div className="nearby-card-bottom">
              <div className="nearby-tag">
                <MapPin size={11} />
                {item.distance.toFixed(1)} km
              </div>
              <div className="nearby-tag">
                <Clock size={11} />
                ~{item.eta} min
              </div>
              <div className="nearby-tag nearby-tag-vehicle" style={{ borderColor: item.vehicle.color + '40', color: item.vehicle.color }}>
                {item.vehicle.emoji} {item.vehicle.label}
              </div>
              <div className="nearby-tag nearby-tag-price">
                ₹{item.billing.total}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default NearbyList;
