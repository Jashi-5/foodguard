// Order creation and delivery simulation — NO auto-matching
// Matching is done manually by the user selecting from NearbyList

import { db } from './firebase';
import { assignVehicle, calculateDeliveryFee, estimateDeliveryTime, generateDeliveryAgent } from './delivery';

/**
 * Create an order after user manually selects a donor/receiver
 * Called from ConfirmOrderModal
 */
export const createOrder = async ({ donation, request, billingSplit, routeCoordinates, distanceKm, initiatedBy = 'donor' }) => {
  try {
    const qty = Number(donation.quantity || request.peopleCount || 10) || 10;
    const vehicle = assignVehicle(qty);
    const dist = Math.max(parseFloat(distanceKm) || 1, 0.1);
    const billing = calculateDeliveryFee(vehicle, dist);
    const eta = estimateDeliveryTime(vehicle, dist);
    const agent = generateDeliveryAgent(vehicle);

    const safeDistKm = Number.isFinite(Number(distanceKm)) ? distanceKm : '1.00';
    const isReceiverInitiated = initiatedBy === 'receiver';

    const orderResult = await db.addDoc('orders', {
      donationId: donation.id,
      requestId: request.id,
      status: isReceiverInitiated ? 'pending_donor_approval' : 'confirmed',
      vehicle: {
        id: vehicle.id, name: vehicle.name, emoji: vehicle.emoji,
        label: vehicle.label, color: vehicle.color
      },
      agent,
      billing,
      billingSplit: isReceiverInitiated ? 'pending' : (billingSplit || 'donor'),
      etaMinutes: Number.isFinite(eta) ? eta : 15,
      distanceKm: safeDistKm,
      donorLocation: donation.location,
      receiverLocation: request.location,
      routeCoordinates: routeCoordinates || [],
      foodQuantity: Number.isFinite(qty) ? qty : 10,
      foodType: donation.foodType || 'Mixed',
      isPaid: false,
      statusHistory: [
        { status: isReceiverInitiated ? 'pending_donor_approval' : 'confirmed', timestamp: new Date().toISOString() }
      ],
      deliveryProgress: 0
    });

    // Mark donation and request as matched
    await db.updateDoc('donations', donation.id, { matched: true, orderId: orderResult.id });
    await db.updateDoc('requests', request.id, { matched: true, orderId: orderResult.id });

    // Only simulate delivery immediately if donor initiated it or we otherwise have immediate confirmation
    if (!isReceiverInitiated) {
      simulateDelivery(orderResult.id);
    }

    return orderResult.id;
  } catch (error) {
    console.error('Order creation failed:', error);
    alert('Order creation failed: ' + error.message);
    throw error;
  }
};

export const approveOrder = async (orderId, chosenBillingSplit) => {
  const order = await db.getDoc('orders', orderId);
  if (!order) return;
  
  const history = [...(order.statusHistory || []), { status: 'confirmed', timestamp: new Date().toISOString() }];
  await db.updateDoc('orders', orderId, { 
    status: 'confirmed', 
    billingSplit: chosenBillingSplit,
    statusHistory: history 
  });
  
  simulateDelivery(orderId);
};

/**
 * Fetch OSRM route between two points
 */
export const fetchRoute = async (fromLoc, toLoc) => {
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${fromLoc.longitude},${fromLoc.latitude};${toLoc.longitude},${toLoc.latitude}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.routes && data.routes.length > 0) {
      const coords = data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
      const distKm = (data.routes[0].distance / 1000).toFixed(2);
      return { routeCoordinates: coords, distanceKm: distKm };
    }
  } catch (e) {
    console.error('OSRM routing failed:', e);
  }

  // Fallback straight line
  const dist = Math.sqrt(
    (fromLoc.latitude - toLoc.latitude) ** 2 +
    (fromLoc.longitude - toLoc.longitude) ** 2
  ) * 111; // rough km
  return {
    routeCoordinates: [
      [fromLoc.latitude, fromLoc.longitude],
      [toLoc.latitude, toLoc.longitude]
    ],
    distanceKm: Number.isFinite(dist) ? dist.toFixed(2) : '1.00'
  };
};

const simulateDelivery = (orderId) => {
  setTimeout(() => advanceStatus(orderId, 'vehicle_assigned'), 3000);
  setTimeout(() => advanceStatus(orderId, 'picked_up'), 7000);
  setTimeout(() => {
    advanceStatus(orderId, 'in_transit');
    startMovement(orderId);
  }, 10000);
};

const advanceStatus = async (orderId, newStatus) => {
  // db.getDoc is now async — await it
  const order = await db.getDoc('orders', orderId);
  if (!order) return;
  const history = [...(order.statusHistory || []), { status: newStatus, timestamp: new Date().toISOString() }];
  await db.updateDoc('orders', orderId, { status: newStatus, statusHistory: history });
};

const startMovement = (orderId) => {
  let progress = 0;
  const interval = setInterval(async () => {
    progress += 0.025;
    if (progress >= 1) {
      progress = 1;
      clearInterval(interval);
      await db.updateDoc('orders', orderId, { deliveryProgress: 1 });
      setTimeout(async () => {
        await advanceStatus(orderId, 'delivered');
      }, 800);
      return;
    }
    await db.updateDoc('orders', orderId, { deliveryProgress: progress });
  }, 400);
};
