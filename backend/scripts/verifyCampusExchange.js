import http from 'http';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: './.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let server;
let BASE_URL;

async function setup() {
  const { connectDB } = await import('../src/config/db.js');
  await connectDB();

  const { seedDatabase } = await import('../src/scripts/seedData.js');
  await seedDatabase();

  const express = (await import('express')).default;
  const cookieParser = (await import('cookie-parser')).default;
  const cors = (await import('cors')).default;

  const authRoutes = (await import('../src/routes/authRoutes.js')).default;
  const productRoutes = (await import('../src/routes/productRoutes.js')).default;
  const requestRoutes = (await import('../src/routes/requestRoutes.js')).default;
  const adminRoutes = (await import('../src/routes/adminRoutes.js')).default;
  const uploadRoutes = (await import('../src/routes/uploadRoutes.js')).default;
  const { errorHandler } = await import('../src/middleware/errorHandler.js');

  const app = express();
  app.use(cors());
  app.use(cookieParser());
  app.use(express.json());

  app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));
  app.use('/api/auth', authRoutes);
  app.use('/api/products', productRoutes);
  app.use('/api/requests', requestRoutes);
  app.use('/api/admin', adminRoutes);
  app.use('/api/upload', uploadRoutes);
  app.use(errorHandler);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  BASE_URL = `http://127.0.0.1:${port}/api`;
}

async function teardown() {
  if (server) await new Promise((resolve) => server.close(resolve));
  if (mongoose.connection) await mongoose.disconnect();
}

async function runTests() {
  console.log('🧪 Starting CampusExchange Requirement Verification Suite...\n');
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

    // ─────────────────────────────────────────────────────────────
    // 1. Unified Student Experience & Demo Login
    // ─────────────────────────────────────────────────────────────
    console.log('1️⃣ Testing Student Demo Login & Registration:');

    // 1.1 Single Student Demo Login
    const demoRes = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'STUDENT' }),
    });
    const demoData = await demoRes.json();
    assert(
      demoRes.status === 200 && demoData.success && demoData.user.email === 'rahul@mnit.ac.in',
      'Student Demo Login succeeds and returns student account (Rahul)'
    );
    const rahulToken = demoData.token;
    const rahulId = demoData.user.id;

    // 1.2 Student Registration without Buyer/Seller distinction
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tanvi Agarwal',
        email: 'tanvi@mnit.ac.in',
        password: 'Password123!',
        college: 'MNIT Jaipur',
        branch: 'Mechanical Engineering',
        year: '2nd Year',
        hostel: 'Gargi Hostel (Room 102)',
        phone: '+91 98888 77777',
      }),
    });
    const regData = await regRes.json();
    assert(
      regRes.status === 201 && regData.success && regData.user.role === 'STUDENT',
      'Unified student registers without role choice and receives STUDENT role'
    );
    const tanviToken = regData.token;
    const tanviId = regData.user.id;

    // ─────────────────────────────────────────────────────────────
    // 2. Selling Capability (Any Student Can Create & Edit Listings)
    // ─────────────────────────────────────────────────────────────
    console.log('\n2️⃣ Testing Listing Creation & Image Handling:');

    // 2.1 Tanvi creates a listing (selling capability)
    const createListingRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tanviToken}`,
      },
      body: JSON.stringify({
        title: 'Engineering Mechanics by Timoshenko (5th Ed)',
        description: 'Complete textbook with solved questions, neat condition.',
        category: 'Books',
        price: 350,
        condition: 'Good',
        pickupLocation: 'Gargi Hostel Gate',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      }),
    });
    const createListingData = await createListingRes.json();
    assert(
      createListingRes.status === 201 && createListingData.success,
      'Newly registered student can publish a marketplace listing directly'
    );
    const tanviBookId = createListingData.product._id;

    // 2.2 Tanvi edits her listing
    const editRes = await fetch(`${BASE_URL}/products/${tanviBookId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tanviToken}`,
      },
      body: JSON.stringify({
        price: 300,
        description: 'Updated price: 300 INR for quick sale before semester exams.',
      }),
    });
    const editData = await editRes.json();
    assert(
      editRes.status === 200 && editData.product.price === 300,
      'Student can edit their existing listing and update price/details'
    );

    // 2.3 Other student cannot edit Tanvi's listing
    const unauthorizedEditRes = await fetch(`${BASE_URL}/products/${tanviBookId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({ price: 10 }),
    });
    assert(
      unauthorizedEditRes.status === 403,
      'Non-owner student is forbidden (403) from editing another student listing'
    );

    // ─────────────────────────────────────────────────────────────
    // 3. Privacy Rule: Phone Number Hidden in Public Product Browsing
    // ─────────────────────────────────────────────────────────────
    console.log('\n3️⃣ Testing Public Listing Privacy (Seller Phone Hidden):');

    // 3.1 Browse marketplace
    const browseRes = await fetch(`${BASE_URL}/products`);
    const browseData = await browseRes.json();
    const hasPhoneInPublicList = browseData.products.some(
      (p) => p.seller && p.seller.phone && p.seller.phone.length > 0
    );
    assert(
      !hasPhoneInPublicList,
      'Public product browsing does NOT expose any seller phone numbers'
    );

    // 3.2 Product Detail by ID
    const detailRes = await fetch(`${BASE_URL}/products/${tanviBookId}`);
    const detailData = await detailRes.json();
    assert(
      detailData.success && (!detailData.product.seller.phone || detailData.product.seller.phone === ''),
      'Product details endpoint does NOT expose the seller phone number'
    );

    // ─────────────────────────────────────────────────────────────
    // 4. Reservation Flow & Contact Privacy
    // ─────────────────────────────────────────────────────────────
    console.log('\n4️⃣ Testing Reservation Flow, Phone Privacy & Reasons:');

    // 4.1 Rahul (student) reserves Tanvi's book (buying capability)
    const reserveRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        productId: tanviBookId,
        pickupLocation: 'Gargi Hostel Gate',
        notes: 'Can collect today at 6 PM',
      }),
    });
    const reserveData = await reserveRes.json();
    assert(
      reserveRes.status === 201 && reserveData.success && reserveData.request.status === 'PENDING',
      'Student can reserve another student product listing'
    );
    const requestId = reserveData.request._id;

    // 4.2 MANDATORY PRIVACY: Phone number hidden while reservation is PENDING
    assert(
      !reserveData.request.seller.phone || reserveData.request.seller.phone === '',
      'Pending reservation response hides seller phone number from buyer'
    );

    // 4.3 Check My Purchases as buyer: Phone number must still be hidden
    const buyerPurchasesRes = await fetch(`${BASE_URL}/requests/buyer`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    const buyerPurchasesData = await buyerPurchasesRes.json();
    const rahulPurchase = buyerPurchasesData.requests.find((r) => r._id === requestId);
    assert(
      rahulPurchase && (!rahulPurchase.seller.phone || rahulPurchase.seller.phone === ''),
      'Buyer "My Purchases" query hides seller phone number while status is PENDING'
    );

    // 4.4 Check Tanvi's Incoming Requests (as seller without any mode switching!)
    const sellerRequestsRes = await fetch(`${BASE_URL}/requests/seller`, {
      headers: { Authorization: `Bearer ${tanviToken}` },
    });
    const sellerRequestsData = await sellerRequestsRes.json();
    const incomingReq = sellerRequestsData.requests.find((r) => r._id === requestId);
    assert(
      incomingReq && incomingReq.buyer.name === 'Rahul Sharma',
      'Seller can view incoming reservation requests without switching modes'
    );

    // 4.5 Seller accepts reservation
    const acceptRes = await fetch(`${BASE_URL}/requests/${requestId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tanviToken}` },
    });
    const acceptData = await acceptRes.json();
    assert(
      acceptRes.status === 200 && acceptData.success && acceptData.request.status === 'ACCEPTED',
      'Seller accepts reservation; product is now RESERVED'
    );

    // 4.6 Check product status: Must be RESERVED
    const checkProductRes = await fetch(`${BASE_URL}/products/${tanviBookId}`);
    const checkProductData = await checkProductRes.json();
    assert(
      checkProductData.product.status === 'RESERVED',
      'Product status is atomically changed to RESERVED'
    );

    // 4.7 MANDATORY PRIVACY: After acceptance, buyer CAN now see seller phone number!
    const buyerPurchasesAfterAcceptRes = await fetch(`${BASE_URL}/requests/buyer`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    const buyerPurchasesAfterAcceptData = await buyerPurchasesAfterAcceptRes.json();
    const acceptedPurchase = buyerPurchasesAfterAcceptData.requests.find((r) => r._id === requestId);
    assert(
      acceptedPurchase && acceptedPurchase.seller.phone === '+91 98888 77777',
      'Authorized buyer can view seller phone number AFTER reservation is ACCEPTED'
    );

    // ─────────────────────────────────────────────────────────────
    // 5. Seller Cancellation Reason & Product Restoration
    // ─────────────────────────────────────────────────────────────
    console.log('\n5️⃣ Testing Rejection/Cancellation Reason & Availability Restoration:');

    // 5.1 Seller attempts to cancel WITHOUT reason -> Must fail
    const noReasonCancelRes = await fetch(`${BASE_URL}/requests/${requestId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tanviToken}`,
      },
      body: JSON.stringify({ reason: '   ' }),
    });
    assert(
      noReasonCancelRes.status === 400,
      'Seller cancellation without explanation is rejected with 400'
    );

    // 5.2 Seller cancels accepted reservation WITH valid reason
    const validCancelRes = await fetch(`${BASE_URL}/requests/${requestId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tanviToken}`,
      },
      body: JSON.stringify({
        reason: 'Book was borrowed by my roommate and is no longer with me.',
      }),
    });
    const validCancelData = await validCancelRes.json();
    assert(
      validCancelRes.status === 200 &&
        validCancelData.request.status === 'CANCELLED' &&
        validCancelData.request.cancellationReason.includes('roommate'),
      'Seller cancels with reason; reason and CANCELLED status are saved'
    );

    // 5.3 Product status restored to AVAILABLE after cancellation
    const productAfterCancelRes = await fetch(`${BASE_URL}/products/${tanviBookId}`);
    const productAfterCancelData = await productAfterCancelRes.json();
    assert(
      productAfterCancelData.product.status === 'AVAILABLE',
      'Product status is restored to AVAILABLE after reservation cancellation'
    );

    // 5.4 Buyer can see cancellation reason in My Purchases
    const buyerPurchasesAfterCancelRes = await fetch(`${BASE_URL}/requests/buyer`, {
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    const buyerPurchasesAfterCancelData = await buyerPurchasesAfterCancelRes.json();
    const cancelledReq = buyerPurchasesAfterCancelData.requests.find((r) => r._id === requestId);
    assert(
      cancelledReq &&
        cancelledReq.cancellationReason &&
        cancelledReq.cancellationReason.includes('roommate'),
      'Buyer can see seller explanation reason in My Purchases'
    );

    // ─────────────────────────────────────────────────────────────
    // 6. Security & Authorization Checks
    // ─────────────────────────────────────────────────────────────
    console.log('\n6️⃣ Testing Security & Privilege Boundaries:');

    // 6.1 Unauthenticated cannot create listing
    const unauthListingRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Hacker item', price: 10 }),
    });
    assert(unauthListingRes.status === 401, 'Unauthenticated user cannot create listing (401)');

    // 6.2 Student cannot access Admin routes
    const studentAdminRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${tanviToken}` },
    });
    assert(studentAdminRes.status === 403, 'Regular student is forbidden (403) from admin endpoints');

    // 6.3 Student cannot buy their own item
    const selfBuyRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tanviToken}`,
      },
      body: JSON.stringify({ productId: tanviBookId }),
    });
    assert(selfBuyRes.status === 400, 'Student cannot purchase their own product listing (400)');

    // 6.4 Non-seller student cannot accept reservation
    const thirdPartyAcceptRes = await fetch(`${BASE_URL}/requests/${requestId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${rahulToken}` },
    });
    assert(thirdPartyAcceptRes.status === 403, 'Non-seller cannot accept someone else reservation (403)');

    // ─────────────────────────────────────────────────────────────
    // 7. Multi-Quantity Listing & Inventory Operations
    // ─────────────────────────────────────────────────────────────
    console.log('\n7️⃣ Testing Multi-Quantity Listings & Inventory Lifecycle:');

    // 7.1 Seller lists item with quantity = 5
    const multiListingRes = await fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tanviToken}`,
      },
      body: JSON.stringify({
        title: 'Classmate Spiral Lab Notebooks (Pack)',
        description: 'Brand new unruled spiral notebooks for engineering labs',
        category: 'Books',
        price: 120,
        quantity: 5,
        condition: 'New',
        pickupLocation: 'Hostel 2 Gate',
      }),
    });
    const multiListingData = await multiListingRes.json();
    assert(
      multiListingRes.status === 201 && multiListingData.product.quantity === 5,
      'Seller can create a listing specifying quantity (5 units)'
    );
    const multiProductId = multiListingData.product._id;

    // 7.2 Requesting more than available stock is rejected
    const overStockReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        productId: multiProductId,
        quantity: 6,
      }),
    });
    assert(
      overStockReqRes.status === 400,
      'Requesting quantity exceeding available stock (6 > 5) is rejected (400)'
    );

    // 7.3 Buyer requests partial quantity (2 units)
    const partialReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({
        productId: multiProductId,
        quantity: 2,
        notes: 'Need 2 notebooks for Chemistry and Physics labs',
      }),
    });
    const partialReqData = await partialReqRes.json();
    assert(
      partialReqRes.status === 201 &&
        partialReqData.request.quantity === 2 &&
        partialReqData.request.totalAmount === 240,
      'Buyer can reserve specific quantity (2 units @ ₹120 = ₹240 total)'
    );
    const partialReqId = partialReqData.request._id;

    // 7.4 Seller accepts partial request -> stock decrements (5 - 2 = 3), status remains AVAILABLE
    const acceptPartialRes = await fetch(`${BASE_URL}/requests/${partialReqId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tanviToken}` },
    });
    const acceptPartialData = await acceptPartialRes.json();
    assert(
      acceptPartialRes.status === 200 &&
        acceptPartialData.request.product.quantity === 3 &&
        acceptPartialData.request.product.status === 'AVAILABLE',
      'Accepting partial reservation decrements quantity to 3 and keeps status AVAILABLE'
    );

    // 7.5 Second buyer (Priya) reserves remaining 3 units
    const priyaLoginRes = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@mnit.ac.in' }),
    });
    const priyaLoginData = await priyaLoginRes.json();
    const priyaToken = priyaLoginData.token;

    const secondReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${priyaToken}`,
      },
      body: JSON.stringify({
        productId: multiProductId,
        quantity: 3,
      }),
    });
    const secondReqData = await secondReqRes.json();
    assert(
      secondReqRes.status === 201 && secondReqData.request.quantity === 3,
      'Second student can request remaining 3 units'
    );
    const secondReqId = secondReqData.request._id;

    // 7.6 Seller accepts second request -> stock decrements to 0, status transitions to RESERVED
    const acceptSecondRes = await fetch(`${BASE_URL}/requests/${secondReqId}/accept`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tanviToken}` },
    });
    const acceptSecondData = await acceptSecondRes.json();
    assert(
      acceptSecondRes.status === 200 &&
        acceptSecondData.request.product.quantity === 0 &&
        acceptSecondData.request.product.status === 'RESERVED',
      'Accepting remaining stock depletes quantity to 0 and transitions status to RESERVED'
    );

    // 7.7 Further requests are blocked when stock is 0 / RESERVED
    const amitLoginRes = await fetch(`${BASE_URL}/auth/demo-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'amit@mnit.ac.in' }),
    });
    const amitLoginData = await amitLoginRes.json();
    const amitToken = amitLoginData.token;

    const thirdReqRes = await fetch(`${BASE_URL}/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${amitToken}`,
      },
      body: JSON.stringify({
        productId: multiProductId,
        quantity: 1,
      }),
    });
    assert(
      thirdReqRes.status === 400,
      'New requests are rejected when stock is depleted / RESERVED (400)'
    );

    // 7.8 If a buyer cancels an accepted reservation, reserved quantity is restored to stock and status reverts to AVAILABLE
    const cancelFirstRes = await fetch(`${BASE_URL}/requests/${partialReqId}/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${rahulToken}`,
      },
      body: JSON.stringify({ reason: 'Bought lab manual instead' }),
    });
    const cancelFirstData = await cancelFirstRes.json();
    assert(
      cancelFirstRes.status === 200 &&
        cancelFirstData.request.product.quantity === 2 &&
        cancelFirstData.request.product.status === 'AVAILABLE',
      'Cancelling an accepted reservation restores inventory (+2 units) and reverts status to AVAILABLE'
    );

    console.log('\n═════════════════════════════════════════════════════════════════');
    console.log(`Verification Complete: ${passed} Passed, ${failed} Failed`);
    console.log('═════════════════════════════════════════════════════════════════\n');

    await teardown();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal Test Suite Error:', err);
    await teardown();
    process.exit(1);
  }
}

runTests();
