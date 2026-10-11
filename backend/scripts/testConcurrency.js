import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

let server;
let mongod;
let BASE_URL;

async function setup() {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'test_jwt_secret_key_2026';
  process.env.AI_SERVICE_URL = '';

  await mongoose.connect(uri, { family: 4, serverSelectionTimeoutMS: 10000 });

  const { seedDatabase } = await import('../src/scripts/seedData.js');
  await seedDatabase();

  const express = (await import('express')).default;
  const cookieParser = (await import('cookie-parser')).default;
  const cors = (await import('cors')).default;

  const authRoutes = (await import('../src/routes/authRoutes.js')).default;
  const productRoutes = (await import('../src/routes/productRoutes.js')).default;
  const requestRoutes = (await import('../src/routes/requestRoutes.js')).default;
  const adminRoutes = (await import('../src/routes/adminRoutes.js')).default;
  const aiRoutes = (await import('../src/routes/aiRoutes.js')).default;
  const { errorHandler } = await import('../src/middleware/errorHandler.js');

  const app = express();
  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());

  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/ai', aiRoutes);
  app.use(errorHandler);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  BASE_URL = `http://127.0.0.1:${port}/api`;
}

async function teardown() {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection) await mongoose.disconnect();
  if (mongod) await mongod.stop();
}

async function runTests() {
  console.log("🚀 Running CampusExchange Comprehensive Verification Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    await setup();

    // ── 1. AUTHENTICATION & ROLES ──
    console.log("1️⃣ Testing Authentication & Role-Based Access Control:");

    // 1.1 Register Buyer
    const regBuyerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Joshi',
        email: 'kavita@mnit.ac.in',
        password: 'Password123!',
        role: 'BUYER',
        college: 'MNIT Jaipur',
        branch: 'Civil Engineering',
        year: '1st Year',
        hostel: 'Gargi Hostel',
      }),
    });
    const regBuyerData = await regBuyerRes.json();
    assert(regBuyerRes.status === 201 && regBuyerData.success, 'Buyer registration returns 201 and token');
    const buyerToken = regBuyerData.token;
    const buyerId = regBuyerData.user.id;

    // 1.2 Prevent Duplicate Email
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Kavita Joshi Copy',
        email: 'kavita@mnit.ac.in',
        password: 'Password123!',
      }),
    });
    assert(dupRes.status === 409, 'Duplicate email registration returns 409 Conflict');

    // 1.3 Login Valid & Invalid
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kavita@mnit.ac.in', password: 'WrongPassword' }),
    });
    assert(badLoginRes.status === 401, 'Invalid password rejected with 401 Unauthorized');

    const goodLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'kavita@mnit.ac.in', password: 'Password123!' }),
    });
    const goodLoginData = await goodLoginRes.json();
    assert(goodLoginRes.status === 200 && goodLoginData.token, 'Valid login returns 200 and token');

    // 1.4 Demo Login for Seller and Admin
    const demoSellerRes = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'SELLER' }),
    });
    const demoSellerData = await demoSellerRes.json();
    assert(demoSellerData.success && demoSellerData.user.role === 'SELLER', 'Demo login returns active SELLER account');
    const sellerToken = demoSellerData.token;
    const sellerId = demoSellerData.user.id;

    const demoAdminRes = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'ADMIN' }),
    });
    const demoAdminData = await demoAdminRes.json();
    assert(demoAdminData.success && demoAdminData.user.role === 'ADMIN', 'Demo login returns active ADMIN account');
    const adminToken = demoAdminData.token;

    // 1.5 Role Restrictions: Buyer CANNOT create listing
    const buyerCreateRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({
        title: 'Unauthorized Listing',
        description: 'Should fail',
        category: 'Books',
        price: 100,
      }),
    });
    assert(buyerCreateRes.status === 403, 'Buyer is forbidden (403) from creating a product listing');

    // ── 2. SELLER PRODUCT CRUD & OWNERSHIP ──
    console.log("\n2️⃣ Testing Product Listing Lifecycle & Ownership:");

    // 2.1 Seller creates product
    const createProdRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({
        title: 'Logitech Wireless Mouse M235',
        description: 'Smooth optical tracking, includes USB nano receiver and AA battery.',
        category: 'Electronics',
        price: 450,
        condition: 'Like New',
        pickupLocation: 'Hostel 5 Room 304',
      }),
    });
    const createProdData = await createProdRes.json();
    assert(createProdRes.status === 201 && createProdData.product.status === 'AVAILABLE', 'Seller creates listing in AVAILABLE status');
    const newProductId = createProdData.product._id;

    // 2.2 Unrelated seller cannot modify another seller listing (Rule 3)
    const secondSellerRes = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@mnit.ac.in' }),
    });
    const secondSellerData = await secondSellerRes.json();
    const secondSellerToken = secondSellerData.token;

    const unauthorizedEditRes = await fetch(`${BASE_URL}/products/${newProductId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secondSellerToken}` },
      body: JSON.stringify({ price: 100 }),
    });
    assert(unauthorizedEditRes.status === 403, 'Rule 3: Non-owner seller cannot edit another seller listing (403)');

    // 2.3 Product Owner CAN update
    const ownerEditRes = await fetch(`${BASE_URL}/products/${newProductId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ price: 400 }),
    });
    const ownerEditData = await ownerEditRes.json();
    assert(ownerEditData.success && ownerEditData.product.price === 400, 'Product owner successfully updates price to ₹400');

    // ── 3. SEARCH & FILTERING ──
    console.log("\n3️⃣ Testing Product Catalog Search & Filtering:");
    const searchRes = await fetch(`${BASE_URL}/products?search=calculator`);
    const searchData = await searchRes.json();
    assert(searchData.success && searchData.products.some(p => p.title.toLowerCase().includes('calculator')), 'Search query returns relevant matching items');

    const filterRes = await fetch(`${BASE_URL}/products?category=Books`);
    const filterData = await filterRes.json();
    assert(filterData.products.every(p => p.category === 'Books'), 'Category filter strictly isolates Books');

    // ── 4. BUSINESS RULES & PURCHASE REQUESTS ──
    console.log("\n4️⃣ Testing Business Rules & Purchase Request Flow:");

    // Rule 2: Seller cannot purchase own listing
    const ownReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sellerToken}` },
      body: JSON.stringify({ productId: newProductId }),
    });
    assert(ownReqRes.status === 400, 'Rule 2: Seller cannot create purchase request for own listing (400)');

    // Buyer creates valid request
    const buyReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ productId: newProductId, notes: 'Can we meet outside Hostel 5?' }),
    });
    const buyReqData = await buyReqRes.json();
    assert(buyReqRes.status === 201 && buyReqData.request.status === 'PENDING', 'Buyer creates request in PENDING status');
    const requestId = buyReqData.request._id;

    // Rule 6: Duplicate request prevention
    const dupReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyerToken}` },
      body: JSON.stringify({ productId: newProductId }),
    });
    assert(dupReqRes.status === 409, 'Rule 6: Duplicate active request rejected with 409 Conflict');

    // ── 5. CONCURRENCY & ATOMIC RESERVATION ──
    console.log("\n5️⃣ Testing Concurrency & Atomic Product Reservation:");

    // Register second buyer
    const regBuyer2Res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vikas Meena',
        email: 'vikas@mnit.ac.in',
        password: 'Password123!',
        role: 'BUYER',
      }),
    });
    const buyer2Token = (await regBuyer2Res.json()).token;

    // Second buyer sends request for same item
    const buyReq2Res = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer2Token}` },
      body: JSON.stringify({ productId: newProductId }),
    });
    const req2Id = (await buyReq2Res.json()).request._id;

    // Seller accepts Buyer 1 request -> listing becomes RESERVED
    const acceptRes = await fetch(`${BASE_URL}/requests/${requestId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    const acceptData = await acceptRes.json();
    assert(acceptRes.status === 200 && acceptData.request.status === 'ACCEPTED', 'Seller accepts Buyer 1 request -> status ACCEPTED');

    // Verify product is now RESERVED in database
    const checkProdRes = await fetch(`${BASE_URL}/products/${newProductId}`);
    const checkProdData = await checkProdRes.json();
    assert(checkProdData.product.status === 'RESERVED', 'Product atomically transitions to RESERVED');

    // Now seller tries to accept Buyer 2 request for the same single unit
    const accept2Res = await fetch(`${BASE_URL}/requests/${req2Id}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(accept2Res.status === 409, 'Race condition prevented: Accepting second reservation on reserved item returns 409 Conflict');

    // ── 6. HAND-OFF COMPLETION & SOLD PROTECTION ──
    console.log("\n6️⃣ Testing Hand-Off Completion & SOLD Product Protection:");

    // Seller marks physical hand-off complete -> listing becomes SOLD
    const completeRes = await fetch(`${BASE_URL}/requests/${requestId}/complete`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${sellerToken}` },
    });
    assert(completeRes.status === 200, 'Physical hand-off marked COMPLETED');

    const soldProdRes = await fetch(`${BASE_URL}/products/${newProductId}`);
    const soldProdData = await soldProdRes.json();
    assert(soldProdData.product.status === 'SOLD', 'Listing status successfully updated to SOLD');

    // Rule 1: Cannot request a SOLD product
    const requestSoldRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${buyer2Token}` },
      body: JSON.stringify({ productId: newProductId }),
    });
    assert(requestSoldRes.status === 400, 'Rule 1: New purchase request on SOLD product rejected (400)');

    // ── 7. ADMIN MODERATION & STATS ──
    console.log("\n7️⃣ Testing Admin Console Permissions & Statistics:");

    const adminStatsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminStatsData = await adminStatsRes.json();
    assert(adminStatsData.success && adminStatsData.stats.totalListings > 0, 'Admin can view marketplace statistics');

    const adminUsersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminUsersData = await adminUsersRes.json();
    assert(adminUsersData.success && adminUsersData.users.length >= 4, 'Admin can view paginated list of registered students');

    // Non-admin cannot access admin routes
    const forbiddenAdminRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(forbiddenAdminRes.status === 403, 'Regular buyer is forbidden (403) from admin endpoints');

    // ── 8. AI PRODUCT DISCOVERY ENDPOINT & RESILIENCE ──
    console.log("\n8️⃣ Testing AI Discovery Endpoint & Resilient Fallback:");

    const aiRes = await fetch(`${BASE_URL}/ai/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'I need a scientific calculator under 800' }),
    });
    const aiData = await aiRes.json();

    assert(aiRes.status === 200 && aiData.success && aiData.products.length > 0, 'AI natural-language search returns matching listings');

    console.log("\n========================================");
    console.log(`🎉 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log("========================================\n");

    if (failed > 0) process.exit(1);
  } catch (err) {
    console.error('Fatal Test Execution Error:', err);
    process.exit(1);
  } finally {
    await teardown();
  }
}

runTests();
