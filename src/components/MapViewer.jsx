import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, CircleMarker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const defaultCenter = [28.6139, 77.2090];

const MapController = ({ center }) => {
  const map = useMap();
  const lastCenter = useRef(null);
  useEffect(() => {
    const key = center.join(',');
    if (lastCenter.current !== key) {
      map.setView(center, 14, { animate: true });
      lastCenter.current = key;
    }
    map.invalidateSize();
  }, [center, map]);
  return null;
};

const MapEvents = ({ setSelectedMarker }) => {
  useMapEvents({ click() { setSelectedMarker(null); } });
  return null;
};

const createDot = (color, size = 14) => L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:2.5px solid white;box-shadow:0 0 12px ${color}80;"></div>`,
  iconSize: [size + 6, size + 6], iconAnchor: [(size + 6) / 2, (size + 6) / 2], popupAnchor: [0, -(size / 2 + 3)]
});

const createVehicleIcon = (emoji, color) => L.divIcon({
  className: 'custom-map-marker',
  html: `<div style="
    background:rgba(10,10,15,0.92);
    border:2.5px solid ${color};
    border-radius:14px;
    padding:5px 10px;
    font-size:22px;
    line-height:1;
    box-shadow:0 0 24px ${color}70, 0 0 8px ${color}40, 0 6px 16px rgba(0,0,0,0.5);
    display:flex;align-items:center;justify-content:center;
    position:relative;
  ">${emoji}<div style="
    position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);
    width:0;height:0;
    border-left:6px solid transparent;border-right:6px solid transparent;
    border-top:8px solid ${color};
  "></div></div>`,
  iconSize: [48, 52], iconAnchor: [24, 44], popupAnchor: [0, -44]
});

const iconGreen = createDot('#00ff9f');
const iconYellow = createDot('#ffd93d');
const iconRed = createDot('#ff4d6a');
const iconGreenMatched = createDot('#00994d', 10);
const iconRedMatched = createDot('#993344', 10);

const MapViewer = ({ donations, requests, orders = [], selectedMarker, setSelectedMarker, theme }) => {
  const [center, setCenter] = useState(defaultCenter);
  const [userLocation, setUserLocation] = useState(null);
  const isLight = theme === 'light';

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const loc = [pos.coords.latitude, pos.coords.longitude];
          setCenter(loc);
          setUserLocation(loc);
        },
        (err) => {
          console.warn('Geolocation failed:', err.message, '— using default center (Delhi)');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
      );
    }
  }, []);

  const getIcon = (type, item) => {
    if (item.matched) return type === 'donation' ? iconGreenMatched : iconRedMatched;
    if (type === 'donation') {
      const diff = new Date(item.expiryTime) - new Date();
      return diff > 0 && diff < 3600000 ? iconYellow : iconGreen;
    }
    return iconRed;
  };

  const getVehiclePos = (route, progress) => {
    if (!route || route.length < 2) return null;
    const total = route.length;
    const idx = Math.min(Math.floor(progress * (total - 1)), total - 2);
    const sub = (progress * (total - 1)) - idx;
    return [
      route[idx][0] + (route[idx + 1][0] - route[idx][0]) * sub,
      route[idx][1] + (route[idx + 1][1] - route[idx][1]) * sub
    ];
  };

  // Get trail points — the portion of route already traveled
  const getTrailPositions = (route, progress) => {
    if (!route || route.length < 2 || progress <= 0) return [];
    const total = route.length;
    const endIdx = Math.min(Math.ceil(progress * (total - 1)), total - 1);
    return route.slice(0, endIdx + 1);
  };

  const tileUrl = isLight
    ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 0 }}>
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: '100%', height: '100%', backgroundColor: isLight ? '#f5f5f5' : '#121214' }}
        zoomControl={false}
      >
        <MapController center={center} />
        <MapEvents setSelectedMarker={setSelectedMarker} />
        <TileLayer
          url={tileUrl}
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
        />

        {/* You are here */}
        {userLocation && (
          <>
            <CircleMarker center={userLocation} radius={24}
              pathOptions={{ color: '#3b82f6', weight: 1.5, fillColor: '#3b82f6', fillOpacity: 0.08, opacity: 0.3, className: 'vehicle-pulse-ring' }} />
            <CircleMarker center={userLocation} radius={7}
              pathOptions={{ color: '#fff', weight: 2.5, fillColor: '#3b82f6', fillOpacity: 1 }}>
              <Tooltip direction="top" offset={[0, -10]} className="custom-tooltip" permanent>
                <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>📍 You</span>
              </Tooltip>
            </CircleMarker>
          </>
        )}

        {/* IDs of delivered orders — hide their linked markers */}
        {(() => {
          const deliveredOrderIds = new Set(
            orders.filter(o => o.status === 'delivered').map(o => o.id)
          );
          return (
            <>
              {/* Donation markers — hide if linked to delivered order */}
              {donations
                .filter(doc => !(doc.matched && doc.orderId && deliveredOrderIds.has(doc.orderId)))
                .map(doc => (
                <Marker key={doc.id} position={[doc.location.latitude, doc.location.longitude]}
                  icon={getIcon('donation', doc)}
                  eventHandlers={{ click: () => setSelectedMarker({ ...doc, markerType: 'donation' }) }}>
                  <Popup className="custom-popup">
                    <div style={{ color: '#222', padding: '2px' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{doc.foodType}</h3>
                      <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>{doc.quantity} servings{doc.matched ? ' • Matched' : ''}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Request markers — hide if linked to delivered order */}
              {requests
                .filter(doc => !(doc.matched && doc.orderId && deliveredOrderIds.has(doc.orderId)))
                .map(doc => (
                <Marker key={doc.id} position={[doc.location.latitude, doc.location.longitude]}
                  icon={getIcon('request', doc)}
                  eventHandlers={{ click: () => setSelectedMarker({ ...doc, markerType: 'request' }) }}>
                  <Popup className="custom-popup">
                    <div style={{ color: '#222', padding: '2px' }}>
                      <h3 style={{ fontWeight: 700, fontSize: '0.9rem' }}>{doc.peopleCount} people</h3>
                      <p style={{ margin: '2px 0', fontSize: '0.8rem' }}>{doc.urgencyLevel}{doc.matched ? ' • Matched' : ''}</p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </>
          );
        })()}

        {/* Route lines — only for active orders */}
        {orders.map(order => {
          if (!order.routeCoordinates) return null;
          const isActive = ['in_transit', 'picked_up', 'vehicle_assigned', 'confirmed'].includes(order.status);
          // Hide route once delivered
          if (order.status === 'delivered') return null;

          return (
            <React.Fragment key={`route-${order.id}`}>
              {/* Full route — dim dashed */}
              <Polyline positions={order.routeCoordinates}
                pathOptions={{
                  color: '#888',
                  weight: 3,
                  opacity: 0.25,
                  dashArray: '8, 12',
                }}>
                <Tooltip sticky direction="top" className="custom-tooltip">
                  <div style={{ textAlign: 'center' }}>
                    <span style={{ fontWeight: 700 }}>{order.distanceKm} km</span>
                    <br />
                    <span style={{ fontSize: '0.75em', opacity: 0.8 }}>
                      {`${order.vehicle?.emoji} ${order.status?.replace(/_/g, ' ')}`}
                    </span>
                  </div>
                </Tooltip>
              </Polyline>

              {/* Traveled trail — bright solid */}
              {order.status === 'in_transit' && order.deliveryProgress > 0 && (
                <Polyline
                  positions={getTrailPositions(order.routeCoordinates, order.deliveryProgress)}
                  pathOptions={{
                    color: order.vehicle?.color || '#00ff9f',
                    weight: 5,
                    opacity: 0.9,
                    lineCap: 'round',
                    lineJoin: 'round',
                  }}
                />
              )}

              {/* Glow trail behind vehicle */}
              {order.status === 'in_transit' && order.deliveryProgress > 0 && (
                <Polyline
                  positions={getTrailPositions(order.routeCoordinates, order.deliveryProgress)}
                  pathOptions={{
                    color: order.vehicle?.color || '#00ff9f',
                    weight: 12,
                    opacity: 0.15,
                    lineCap: 'round',
                  }}
                />
              )}
            </React.Fragment>
          );
        })}

        {/* Vehicle markers — show during all active states */}
        {orders.map(order => {
          if (!order.routeCoordinates) return null;
          const isMoving = ['vehicle_assigned', 'picked_up', 'in_transit'].includes(order.status);
          if (!isMoving) return null;

          // Vehicle starts at pickup point, moves during in_transit
          let progress;
          if (order.status === 'vehicle_assigned' || order.status === 'picked_up') {
            progress = 0; // At pickup (start of route)
          } else {
            progress = order.deliveryProgress || 0;
          }

          const pos = getVehiclePos(order.routeCoordinates, progress);
          if (!pos) return null;

          return (
            <React.Fragment key={`v-${order.id}`}>
              {/* Pulsing circle under vehicle */}
              <CircleMarker
                center={pos}
                radius={18}
                pathOptions={{
                  color: order.vehicle?.color || '#00ff9f',
                  weight: 2,
                  fillColor: order.vehicle?.color || '#00ff9f',
                  fillOpacity: 0.08,
                  opacity: 0.3,
                  className: 'vehicle-pulse-ring'
                }}
              />
              {/* Vehicle icon */}
              <Marker
                position={pos}
                icon={createVehicleIcon(order.vehicle?.emoji || '🚗', order.vehicle?.color || '#00ff9f')}
                zIndexOffset={1000}
              >
                <Tooltip direction="top" offset={[0, -48]} className="custom-tooltip" permanent>
                  <div style={{ textAlign: 'center', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700 }}>{order.agent?.name}</div>
                    <div style={{ fontSize: '0.75em', opacity: 0.7 }}>
                      {order.vehicle?.name} • {Math.round((order.deliveryProgress || 0) * 100)}%
                    </div>
                  </div>
                </Tooltip>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapContainer>

      <style>{`
        .leaflet-container { background: ${isLight ? '#f5f5f5' : '#121214'} !important; font-family: inherit; }
        .leaflet-popup-content-wrapper { background: rgba(255,255,255,0.95); border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.25); }
        .leaflet-popup-tip { background: rgba(255,255,255,0.95); }
        .custom-map-marker { background: transparent !important; border: none !important; }
        .vehicle-pulse-ring { animation: pulse-ring 2s ease-in-out infinite; }
        @keyframes pulse-ring {
          0%, 100% { stroke-opacity: 0.3; r: 18; }
          50% { stroke-opacity: 0.6; r: 24; }
        }
      `}</style>
    </div>
  );
};

export default React.memo(MapViewer);
