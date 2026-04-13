// Delivery Vehicle Assignment Engine

export const VEHICLE_TYPES = {
  bike: {
    id: 'bike', name: 'Bike', emoji: '🏍️', label: 'Two-Wheeler',
    minServings: 1, maxServings: 15, speedKmh: 25,
    baseFare: 30, perKmRate: 8, color: '#00ff9f',
    description: 'Quick delivery for small orders'
  },
  auto: {
    id: 'auto', name: 'Auto', emoji: '🛺', label: 'Three-Wheeler',
    minServings: 16, maxServings: 50, speedKmh: 20,
    baseFare: 60, perKmRate: 12, color: '#ffd93d',
    description: 'Medium capacity for moderate orders'
  },
  van: {
    id: 'van', name: 'Van', emoji: '🚐', label: 'Mini Van',
    minServings: 51, maxServings: 150, speedKmh: 30,
    baseFare: 120, perKmRate: 18, color: '#3b82f6',
    description: 'Large capacity for bulk orders'
  },
  truck: {
    id: 'truck', name: 'Truck', emoji: '🚛', label: 'Heavy Vehicle',
    minServings: 151, maxServings: 99999, speedKmh: 25,
    baseFare: 300, perKmRate: 25, color: '#a855f7',
    description: 'Maximum capacity for catering-scale'
  }
};

const AGENT_NAMES = [
  'Rahul Kumar', 'Priya Sharma', 'Arjun Singh', 'Sneha Patel',
  'Vikram Reddy', 'Anjali Gupta', 'Karan Mehta', 'Deepa Nair'
];

export const assignVehicle = (servings) => {
  const qty = Number(servings) || 1;
  if (qty <= 15) return VEHICLE_TYPES.bike;
  if (qty <= 50) return VEHICLE_TYPES.auto;
  if (qty <= 150) return VEHICLE_TYPES.van;
  return VEHICLE_TYPES.truck;
};

export const calculateDeliveryFee = (vehicleType, distanceKm) => {
  const dist = Math.max(Number(distanceKm) || 0, 0.5);
  const deliveryFee = Math.round(vehicleType.baseFare + (vehicleType.perKmRate * dist));
  const platformFee = 5;
  const gst = Math.round((deliveryFee + platformFee) * 0.05);
  return {
    deliveryFee, platformFee, gst,
    total: deliveryFee + platformFee + gst,
    breakdown: [
      { label: 'Delivery Fee', amount: deliveryFee },
      { label: 'Platform Fee', amount: platformFee },
      { label: 'GST (5%)', amount: gst },
    ]
  };
};

export const estimateDeliveryTime = (vehicleType, distanceKm) => {
  const dist = Math.max(Number(distanceKm) || 0, 0.5);
  return Math.max(Math.ceil((dist / vehicleType.speedKmh) * 60 + 5), 8);
};

export const generateDeliveryAgent = (vehicleType) => {
  const idx = Math.floor(Math.random() * AGENT_NAMES.length);
  return {
    name: AGENT_NAMES[idx],
    phone: `9${Math.floor(Math.random() * 9000000000 + 1000000000)}`,
    vehicleNumber: `DL ${Math.floor(Math.random() * 90 + 10)} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(Math.random() * 9000 + 1000)}`,
    rating: (4 + Math.random()).toFixed(1)
  };
};

export const ORDER_STATUSES = [
  { key: 'confirmed', label: 'Order Confirmed', icon: '✅', desc: 'Order has been confirmed' },
  { key: 'vehicle_assigned', label: 'Vehicle Assigned', icon: '🚗', desc: 'Delivery partner on the way to pickup' },
  { key: 'picked_up', label: 'Picked Up', icon: '📦', desc: 'Food picked up from donor' },
  { key: 'in_transit', label: 'In Transit', icon: '🛣️', desc: 'On the way to receiver' },
  { key: 'delivered', label: 'Delivered', icon: '🎉', desc: 'Successfully delivered!' }
];

export const getStatusIndex = (status) => ORDER_STATUSES.findIndex(s => s.key === status);

// Haversine distance
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
