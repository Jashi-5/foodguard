// ─── Demo Data Seeder ────────────────────────────────────────────────────────
// Seeds localStorage with sample data so the demo looks alive on first load.

import { db } from './firebase';

const DELHI = { lat: 28.6139, lng: 77.2090 };

const SAMPLE_DONATIONS = [
  {
    foodType: 'Cooked Meals', quantity: 25,
    expiryTime: new Date(Date.now() + 3 * 3600000).toISOString(),
    matched: false,
    location: { latitude: DELHI.lat + 0.008, longitude: DELHI.lng - 0.005 },
    userId: 'seed_donor_1', userName: 'Rahul Sharma',
  },
  {
    foodType: 'Fresh Produce', quantity: 50,
    expiryTime: new Date(Date.now() + 5 * 3600000).toISOString(),
    matched: false,
    location: { latitude: DELHI.lat - 0.006, longitude: DELHI.lng + 0.01 },
    userId: 'seed_donor_2', userName: 'Priya Patel',
  },
  {
    foodType: 'Packaged Goods', quantity: 100,
    expiryTime: new Date(Date.now() + 8 * 3600000).toISOString(),
    matched: false,
    location: { latitude: DELHI.lat + 0.012, longitude: DELHI.lng + 0.008 },
    userId: 'seed_donor_3', userName: 'Cloud Kitchen Co.',
  },
];

const SAMPLE_REQUESTS = [
  {
    peopleCount: 30, urgencyLevel: 'High', notes: 'Vegetarian preferred',
    matched: false,
    location: { latitude: DELHI.lat - 0.01, longitude: DELHI.lng - 0.008 },
    userId: 'seed_receiver_1', userName: 'Hope Foundation',
  },
  {
    peopleCount: 80, urgencyLevel: 'Critical', notes: 'Any food welcome — 80 kids',
    matched: false,
    location: { latitude: DELHI.lat + 0.004, longitude: DELHI.lng + 0.015 },
    userId: 'seed_receiver_2', userName: 'Annapurna Trust',
  },
];

// Pre-built route as objects (no nested arrays — Firestore safe too)
const SEED_ROUTE = [
  { lat: DELHI.lat + 0.005, lng: DELHI.lng - 0.003 },
  { lat: DELHI.lat + 0.003, lng: DELHI.lng - 0.001 },
  { lat: DELHI.lat + 0.001, lng: DELHI.lng + 0.002 },
  { lat: DELHI.lat - 0.002, lng: DELHI.lng + 0.004 },
  { lat: DELHI.lat - 0.005, lng: DELHI.lng + 0.006 },
  { lat: DELHI.lat - 0.008, lng: DELHI.lng + 0.007 },
];

// Convert to the [lat, lng] format the map expects
const routeForMap = SEED_ROUTE.map(p => [p.lat, p.lng]);

const SAMPLE_ORDER = {
  donationId: '__seed_don__',
  requestId: '__seed_req__',
  status: 'in_transit',
  vehicle: { id: 'auto', name: 'Auto', emoji: '🛺', label: 'Three-Wheeler', color: '#ffd93d' },
  agent: { name: 'Vikram Reddy', phone: '9876543210', vehicleNumber: 'DL 42 AB 7890', rating: '4.7' },
  billing: {
    deliveryFee: 84, platformFee: 5, gst: 4, total: 93,
    breakdown: [
      { label: 'Delivery Fee', amount: 84 },
      { label: 'Platform Fee', amount: 5 },
      { label: 'GST (5%)', amount: 4 },
    ],
  },
  billingSplit: 'donor',
  etaMinutes: 12,
  distanceKm: '3.40',
  donorLocation: { latitude: DELHI.lat + 0.005, longitude: DELHI.lng - 0.003 },
  receiverLocation: { latitude: DELHI.lat - 0.008, longitude: DELHI.lng + 0.007 },
  routeCoordinates: routeForMap,
  foodQuantity: 25,
  foodType: 'Cooked Meals',
  isPaid: false,
  statusHistory: [
    { status: 'confirmed', timestamp: new Date(Date.now() - 5 * 60000).toISOString() },
    { status: 'vehicle_assigned', timestamp: new Date(Date.now() - 4 * 60000).toISOString() },
    { status: 'picked_up', timestamp: new Date(Date.now() - 2 * 60000).toISOString() },
    { status: 'in_transit', timestamp: new Date(Date.now() - 1 * 60000).toISOString() },
  ],
  deliveryProgress: 0.35,
  userId: 'seed_donor_1',
};

export const seedDemoData = async () => {
  try {
    const count = await db.getCount('donations');
    if (count > 0) {
      console.log('📦 Demo data already exists — skipping seed');
      return false;
    }

    console.log('🌱 Seeding demo data...');

    for (const d of SAMPLE_DONATIONS) await db.addDoc('donations', d);
    for (const r of SAMPLE_REQUESTS) await db.addDoc('requests', r);
    await db.addDoc('orders', SAMPLE_ORDER);

    console.log('✅ Demo data seeded');
    return true;
  } catch (err) {
    console.error('❌ Seed failed:', err);
    return false;
  }
};
