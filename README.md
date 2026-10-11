# Campus Exchange — College Second-Hand Marketplace

> A clean, reliable, production-quality, college-exclusive second-hand marketplace where students can buy and sell items within their campus. Built with React, Node.js/Express, MongoDB, and a dedicated AI discovery service powered by Groq Llama 3.3.

---

## 1. Problem Statement

On university campuses, students frequently have valuable items they no longer need—such as engineering textbooks, scientific calculators, bicycles, coding monitors, lab coats, and hostel furniture. At the same time, other students across all years need these exact items at student-friendly prices.

Existing commercial platforms (e.g., OLX, eBay, Craigslist) fail in this setting because:
1. **Lack of Campus Trust:** Anyone on the internet can list items, leading to scams and safety concerns.
2. **Shipping & Packaging Friction:** Second-hand bulky hostel items (bicycles, chairs, coolers) are impractical and expensive to ship.
3. **Unnecessary Payment Gateways:** Online transactions attract 3–15% platform fees, payment disputes, and gateway charges that students want to avoid.

---

## 2. Solution

**Campus Exchange** solves this by providing a dedicated, trusted intra-campus peer-to-peer marketplace:
- **Verified Campus Profiles:** Every student belongs to the college community with verified hostel and department details.
- **Physical Campus Hand-Offs:** Students meet at convenient campus landmarks (hostel gates, central lawn, library).
- **Direct Settlement:** Zero payment gateway fees or escrow delays.
- **Atomic Concurrency Protection:** Single-unit items cannot be double-reserved by multiple buyers simultaneously.
- **AI-Assisted Natural Language Discovery:** A small, fast AI service helps students find relevant items (e.g. *"I need a used laptop under ₹30,000"*).

---

## 3. Working Features

### Student Buyer
- **Browse & Search:** Instant keyword search and filtering by category, condition, price range, and campus pickup location.
- **Product Details:** High-resolution images, seller hostel location, condition rating, and reason for selling.
- **Single-Unit Purchase Requests:** Send a reservation request with an optional note (e.g. preferred meetup time).
- **Duplicate Prevention:** Prevents multiple duplicate pending requests for the same listing.
- **Request Tracking:** View all sent requests and their live statuses (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`, `COMPLETED`).
- **Seller Contact Upon Acceptance:** Once accepted by the seller, the buyer can see the seller's phone number and hostel for hand-off coordination.

### Student Seller
- **Create Listings:** Publish listings across categories (Calculators, Books, Electronics, Furniture, Sports, Notes, Essentials) with photos, price, condition, and campus pickup spot.
- **Listing Management:** Edit price/details or delete listings.
- **Incoming Requests Pipeline:** Review buyer requests and accept or decline.
- **Atomic Reservation Lock:** Accepting a request atomically transitions the product to `RESERVED`, preventing conflicting claims.
- **Mark Sold:** Complete the in-person hand-off and mark the product `SOLD`.

### Campus Administrator
- **Platform Analytics:** Real-time metrics on total students, active listings, reserved items, completed hand-offs, and category breakdown.
- **User Moderation:** View paginated registered students and suspend/remove accounts when necessary.
- **Catalog Moderation:** Remove inappropriate or prohibited listings.

### AI Campus Assistant
- **Natural Language Product Discovery:** Formulate conversational queries like *"Find me a bicycle under ₹4000"* or *"Scientific calculator under ₹800"*.
- **Parameter Extraction:** Extracts category, price ceiling, and keywords, searching the catalog.
- **Resilient Fallback:** If the AI service is unavailable, the backend gracefully executes a direct catalog fallback without crashing.

---

## 4. Payment Policy

> **"Campus Exchange does not process online payments. Payment is settled directly between the buyer and seller during the physical campus hand-off."**

The platform intentionally contains **no payment gateways**, no Stripe/Razorpay integrations, no digital wallets, and no online transaction tracking. This keeps the architecture simple, safe, zero-cost, and completely free from escrow disputes.

---

## 5. System Architecture

```text
               React Frontend (Vite)
                         │
                         │ REST API (JSON / JWT)
                         ▼
             Node.js / Express Backend (Port 5000)
                         │
        ┌────────────────┴────────────────┐
        ▼                                 ▼
 MongoDB Database            AI Discovery Service (Port 5002)
(In-Memory / Atlas)                       │
                                          ▼
                                      Groq LLM
                                 (Llama 3.3 70B)
```

The system consists of:
1. **Frontend:** React 18 single-page application built with Vite and Tailwind CSS.
2. **Backend:** Express REST API managing authentication, products, purchase requests, and admin moderation.
3. **Database:** MongoDB storing `Users`, `Products`, and `PurchaseRequests`.
4. **AI Service:** A dedicated Node.js service running on port 5002 that uses Groq Llama 3.3 for natural-language product discovery.

---

## 6. Database Collections & Schema

### 1. `Users`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique student ID |
| `name` | String | Full student name |
| `email` | String | Unique campus email address |
| `password` | String | bcryptjs hashed password (`select: false`) |
| `role` | String | Exactly one of: `'BUYER'`, `'SELLER'`, `'ADMIN'` |
| `college` | String | e.g. `'MNIT Jaipur'` |
| `branch` | String | e.g. `'Computer Science & Engineering'` |
| `year` | String | e.g. `'4th Year'` |
| `hostel` | String | Campus residence e.g. `'Hostel 5'` |
| `phone` | String | Contact number for hand-off meetup coordination |
| `isSuspended` | Boolean | Account status for moderation |

### 2. `Products`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique product ID |
| `seller` | ObjectId | Reference to `Users` collection |
| `title` | String | Listing headline (indexed) |
| `description` | String | Detailed item description (indexed) |
| `category` | String | Category (e.g. `'Calculators'`, `'Books'`, `'Electronics'`) |
| `price` | Number | Listing price in INR (₹) |
| `condition` | String | `'New'`, `'Like New'`, `'Good'`, `'Fair'` |
| `image` / `images` | String / [String] | Product photos |
| `pickupLocation` | String | Meeting point (e.g. `'Hostel 5 Gate'`) |
| `status` | String | `'AVAILABLE'`, `'RESERVED'`, `'SOLD'` (indexed) |
| `reasonForSelling` | String | e.g. `'Graduating'`, `'Cleared Semester'` |

*Indexes:*
- `{ status: 1, category: 1, price: 1 }`
- `{ seller: 1, status: 1 }`
- `{ title: 'text', description: 'text' }`

### 3. `PurchaseRequests`
| Field | Type | Description |
|---|---|---|
| `_id` | ObjectId | Unique request ID |
| `product` | ObjectId | Reference to `Products` collection |
| `buyer` | ObjectId | Reference to requesting `Users` account |
| `seller` | ObjectId | Reference to listing owner `Users` account |
| `status` | String | `'PENDING'`, `'ACCEPTED'`, `'REJECTED'`, `'CANCELLED'`, `'COMPLETED'` |
| `notes` | String | Buyer availability or meetup note |
| `pickupLocation` | String | Agreed meeting spot |

*Indexes:*
- `{ buyer: 1, createdAt: -1 }`
- `{ seller: 1, createdAt: -1 }`
- `{ product: 1, status: 1 }`

---

## 7. Product Lifecycle & Concurrency Control

```text
          [ AVAILABLE ]
                │
    Buyer sends purchase request (PENDING)
                │
    Seller ACCEPTS request
    (Atomic conditional update: status == 'AVAILABLE')
                │
                ▼
          [ RESERVED ] ─── Seller Rejects / Buyer Cancels ───► [ AVAILABLE ]
                │
    Physical campus hand-off completed
                │
                ▼
            [ SOLD ]
```

### Atomic Database Concurrency Lock
Because a second-hand item has only a single available unit, two buyers might request the same item. To prevent race conditions, reservation uses MongoDB's atomic conditional update:

```javascript
// Atomically reserve only if current status is strictly 'AVAILABLE'
const reservedProduct = await Product.findOneAndUpdate(
  { _id: request.product, status: 'AVAILABLE' },
  { $set: { status: 'RESERVED' } },
  { new: true }
);

if (!reservedProduct) {
  return res.status(409).json({
    success: false,
    message: "This item is no longer available or has already been reserved."
  });
}
```

If two buyers submit requests and the seller accepts one, any subsequent accept operation fails atomically with `409 Conflict`. No distributed locks or external services are needed.

---

## 8. Business Rules

1. **SOLD Protection:** A buyer cannot create a purchase request for a `SOLD` item (returns `400 Bad Request`).
2. **Self-Purchase Prevention:** A seller cannot purchase their own listing (returns `400 Bad Request`).
3. **Ownership Guard:** Only the product owner or an administrator can edit, update, or delete a listing (returns `403 Forbidden`).
4. **Seller Decision Authority:** Only the seller can accept, decline, or complete an incoming purchase request.
5. **Admin Permissions:** Only users with role `ADMIN` can access `/api/admin/*` endpoints.
6. **Duplicate Request Prevention:** A buyer cannot submit multiple active (`PENDING` or `ACCEPTED`) requests for the same product (returns `409 Conflict`).
7. **Reversion on Cancellation:** If an accepted request is rejected or cancelled, the product reverts to `AVAILABLE`.

---

## 9. REST API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new student account (`BUYER` or `SELLER`) | Public |
| `POST` | `/api/auth/login` | Sign in with email and password | Public |
| `POST` | `/api/auth/demo-login` | 1-Click demo sign-in for Buyer, Seller, or Admin | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile | Bearer JWT |
| `PUT` | `/api/auth/profile` | Update hostel, phone, branch, or year | Bearer JWT |

### Products (`/api/products`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/products` | Browse & search listings (`search`, `category`, `minPrice`, `maxPrice`, `page`, `limit`) | Public |
| `GET` | `/api/products/:id` | Get product details with seller info | Public |
| `POST` | `/api/products` | Create a new listing | `SELLER`, `ADMIN` |
| `PATCH` | `/api/products/:id` | Update listing price or details | Owner / `ADMIN` |
| `DELETE` | `/api/products/:id` | Delete a listing | Owner / `ADMIN` |
| `GET` | `/api/products/seller/me`| View listings owned by current seller | `SELLER`, `ADMIN` |

### Purchase Requests (`/api/requests`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/requests` | Send purchase request for an available item | `BUYER`, `ADMIN` |
| `GET` | `/api/requests/buyer` | View requests sent by the authenticated buyer | Bearer JWT |
| `GET` | `/api/requests/seller` | View requests received by the seller | `SELLER`, `ADMIN` |
| `GET` | `/api/requests/:id` | Get details of a single request | Parties / `ADMIN`|
| `PATCH` | `/api/requests/:id/accept` | Accept request (atomic conditional lock) | Owner / `ADMIN` |
| `PATCH` | `/api/requests/:id/reject` | Reject request (restores availability) | Owner / `ADMIN` |
| `PATCH` | `/api/requests/:id/cancel` | Cancel purchase request | Parties / `ADMIN`|
| `PATCH` | `/api/requests/:id/complete`| Mark in-person hand-off complete (`SOLD`) | Owner / `ADMIN` |

### Administration (`/api/admin`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/admin/stats` | View marketplace overview & metrics | `ADMIN` only |
| `GET` | `/api/admin/users` | List registered campus students (paginated) | `ADMIN` only |
| `DELETE` | `/api/admin/users/:id` | Remove/suspend a student account | `ADMIN` only |
| `GET` | `/api/admin/products` | List all listings across campus | `ADMIN` only |
| `DELETE` | `/api/admin/products/:id`| Delete an inappropriate listing | `ADMIN` only |

### AI Discovery (`/api/ai`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/ai/search` | Natural language product search | Public |
| `GET` | `/api/ai/quick-prompts`| Get popular campus search prompts | Public |
| `GET` | `/api/ai/health` | Health check for AI service | Public |

---

## 10. AI Service Architecture & Failure Handling

The AI Service is a lightweight microservice running on port 5002:

```text
User Input: "I need a scientific calculator under ₹800"
                       │
                       ▼
             1. Parameter Extraction
     { keyword: "scientific calculator",
       category: "Calculators",
       maxPrice: 800 }
                       │
                       ▼
              2. Catalog Query
   Product.find({ status: 'AVAILABLE', price: { $lte: 800 } })
                       │
                       ▼
             3. Response Synthesis
   "Found 1 available Casio fx-991EX for ₹650 at Hostel 5 Gate."
```

### Resilient Failure Handling
The main Express backend never crashes if the AI service is offline:
- The backend calls the AI service with a **3.5-second abort timeout**.
- If the AI service is unreachable, times out, or throws an error, the backend executes an in-process regex/token catalog search fallback directly against MongoDB.
- Normal marketplace browsing and reservations are completely unaffected.

---

## 11. Getting Started & Setup

### Prerequisites
- Node.js 18+ (tested on Node 20 & 24)
- npm 9+
- Python 3 (for scripting utilities)
- *Note: Zero external database setup is required! If no remote MongoDB is configured, the backend automatically launches an in-memory MongoDB instance.*

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/CampusExchange.git
cd CampusExchange

# Install dependencies across all packages
npm install
npm install --prefix backend
npm install --prefix frontend
npm install --prefix ai-service
```

### Environment Configuration

1. **Backend (`backend/.env`):**
```env
PORT=5000
NODE_ENV=development
# Leave blank for zero-config automatic in-memory MongoDB
MONGODB_URI=
JWT_SECRET=campusexchange_jwt_super_secret_key_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
AI_SERVICE_URL=http://localhost:5002/api/ai
```

2. **AI Service (`ai-service/.env`):**
```env
PORT=5002
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here
BACKEND_URL=http://localhost:5000
```

### Running the Application

```bash
# Option 1: Start all services concurrently (Frontend, Backend, AI Service)
npm run dev

# Option 2: Start services individually in separate terminals
# Terminal 1 - Backend:
npm run dev --prefix backend

# Terminal 2 - Frontend:
npm run dev --prefix frontend

# Terminal 3 - AI Service:
npm run dev --prefix ai-service
```

Access the application in your browser at: `http://localhost:5173`

### Pre-Configured Demo Accounts (1-Click Login)
- **Student Buyer:** `amit@mnit.ac.in` | `Password123!` (2nd Year Mechanical, Hostel 3)
- **Student Seller:** `rahul@mnit.ac.in` | `Password123!` (4th Year CSE, Hostel 5)
- **Campus Admin:** `admin@campusexchange.ac.in` | `Password123!` (Faculty Coordinator)

---

## 12. Automated Testing

The repository contains an automated test suite verifying all critical business rules:

```bash
# Run the automated verification test suite
npm test
```

### What the Test Suite Verifies (25 Automated Checks):
1. **Authentication:** Buyer registration, email uniqueness, password verification, JWT generation.
2. **Role Authorization:** Verifies buyers cannot post listings; non-admins cannot access admin stats.
3. **Product Ownership:** Verifies only the listing owner can update price or delete the listing.
4. **Self-Purchase Prevention:** Asserts sellers cannot request their own item (Rule 2).
5. **Duplicate Prevention:** Asserts duplicate active requests return `409 Conflict` (Rule 6).
6. **Atomic Concurrency:** Simulates two buyers requesting the same item; verifies only one reservation succeeds.
7. **Physical Hand-Off Completion:** Verifies marking an exchange complete updates status to `SOLD`.
8. **SOLD Protection:** Asserts new requests on `SOLD` items are rejected with `400 Bad Request` (Rule 1).
9. **Admin Moderation:** Verifies admin user/product retrieval and moderation.
10. **AI Discovery:** Verifies natural-language search and catalog fallback resilience.

---

## 13. Placement Interview Q&A (18 Realistic Questions)

### Q1: What is the high-level architecture of Campus Exchange?
**Answer:** Campus Exchange uses a three-tier architecture:
- React (Vite) frontend for user interaction.
- Express REST API for business logic, validation, authentication, and database access.
- MongoDB database storing Users, Products, and PurchaseRequests.
- A small, decoupled AI microservice that translates natural-language queries into catalog searches using Groq Llama 3.3.

### Q2: Why did you eliminate online payment processing?
**Answer:** University second-hand transactions happen in person between students living in the same hostels or campus areas. Introducing payment gateways (Stripe/Razorpay) adds merchant fees (2–3%), payout delays, refund disputes, and compliance complexity. Students prefer inspecting the item in person and settling payment directly (via cash or peer-to-peer UPI) upon hand-off.

### Q3: How do you prevent two buyers from reserving the same product at the same time?
**Answer:** Each listing represents a unique physical item with a single available unit. When a seller accepts a reservation request, we execute a database-level atomic conditional update:
```javascript
Product.findOneAndUpdate({ _id: productId, status: 'AVAILABLE' }, { $set: { status: 'RESERVED' } });
```
Because MongoDB documents are updated atomically, only the first request matches `{ status: 'AVAILABLE' }`. The second request returns `null`, and our backend returns `409 Conflict`. No distributed locks or Redis are needed.

### Q4: How is authentication and role-based access control (RBAC) implemented?
**Answer:** Authentication uses JWT (JSON Web Tokens) signed with HMAC-SHA256 and passwords hashed using bcryptjs (salt rounds = 10). The `protect` middleware verifies the token and attaches `req.user`. The `authorize(...roles)` middleware checks `req.user.role` against allowed roles (`BUYER`, `SELLER`, `ADMIN`) and returns `403 Forbidden` if unauthorized.

### Q5: How do you prevent a buyer from spamming purchase requests for the same listing?
**Answer:** Before creating a `PurchaseRequest`, we query the database for existing active requests:
```javascript
const existing = await PurchaseRequest.findOne({
  product: productId,
  buyer: req.user._id,
  status: { $in: ['PENDING', 'ACCEPTED'] }
});
```
If an active request exists, the server returns `409 Conflict: "You already have an active request for this item."`

### Q6: What happens to a product listing if an accepted purchase request is cancelled?
**Answer:** If an accepted request is rejected or cancelled by either student, the backend atomically reverts the product status back to `AVAILABLE`:
```javascript
await Product.findOneAndUpdate({ _id: productId, status: 'RESERVED' }, { $set: { status: 'AVAILABLE' } });
```
This restores the item so other campus students can discover and request it.

### Q7: Why did you separate the AI service instead of embedding it into the main backend?
**Answer:** Separating the AI service decouples core marketplace reliability from external LLM API availability and latency. LLM inferences can take 500ms to 2s or fail if the API quota is exceeded. Isolating it ensures that an AI outage or slow response never blocks normal marketplace operations or crashes the main backend.

### Q8: How does the backend handle failures or timeouts from the AI service?
**Answer:** The Express backend calls the AI service with an `AbortController` set to a 3.5-second timeout. If the AI service fails or times out, the `try/catch` block catches the error and executes an in-process catalog search using token extraction and price filtering directly against MongoDB. The user receives matching listings without noticing an outage.

### Q9: What database indexes did you create in MongoDB and why?
**Answer:** We created indexes strictly based on actual query patterns:
1. `Products`: `{ status: 1, category: 1, price: 1 }` for filtered catalog browsing; `{ seller: 1, status: 1 }` for seller listing views; text index `{ title: 'text', description: 'text' }` for keyword searches.
2. `PurchaseRequests`: `{ buyer: 1, createdAt: -1 }` and `{ seller: 1, createdAt: -1 }` for order histories; `{ product: 1, status: 1 }` for concurrency checks and duplicate prevention.
3. `Users`: `{ email: 1 }` unique index for quick credential lookups during login.

### Q10: How do you prevent N+1 query problems when fetching listings and requests?
**Answer:** In Mongoose, we use `.populate()` on relational fields (`seller`, `buyer`, `product`) with explicit field projections (e.g. `populate('seller', 'name email hostel phone')`). Mongoose batches these lookups into a single `$in` query across IDs rather than executing individual queries per record.

### Q11: How do you handle pagination in product and user listings?
**Answer:** We implement query-parameter pagination using `page` and `limit`:
```javascript
const pageNum = Math.max(1, parseInt(req.query.page) || 1);
const limitNum = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
const skip = (pageNum - 1) * limitNum;
const [products, total] = await Promise.all([
  Product.find(query).skip(skip).limit(limitNum).lean(),
  Product.countDocuments(query)
]);
```
We also cap `limit` at 50 to prevent denial-of-service attempts by requesting huge datasets.

### Q12: Why do you use `.lean()` on MongoDB find queries?
**Answer:** `.lean()` tells Mongoose to return plain JavaScript objects instead of heavy Mongoose Document instances with change tracking, virtuals, and internal state. For read-only operations like catalog browsing, this reduces memory overhead and improves response times by approximately 3–5x.

### Q13: How does input validation work in the backend?
**Answer:** We use Zod schemas in a reusable `validate(schema)` middleware. User input is validated before reaching the controller. For example, if a price is negative or an email is malformed, Zod throws a validation error and returns `400 Bad Request` with clear field errors.

### Q14: What is centralized error handling and how is it implemented?
**Answer:** Instead of having repetitive try/catch blocks that construct custom error responses, Express routes forward errors to `next(err)`. A single `errorHandler` middleware intercepts all errors, maps Mongoose `CastError` to 400, duplicate keys (`11000`) to 409, and JWT errors to 401, returning a consistent `{ success: false, message: ... }` response while hiding stack traces in production.

### Q15: Can a buyer purchase a product that is already marked SOLD?
**Answer:** No. Rule 1 checks:
```javascript
if (product.status === 'SOLD') {
  return res.status(400).json({ success: false, message: "Cannot request item: This listing has already been SOLD." });
}
```
This is validated before creating any database record.

### Q16: How does the frontend handle empty, loading, and error states?
**Answer:** Every view component uses reactive states (`loading`, `error`, data array). If `loading` is true, a spinner or skeleton is displayed. If `error` is populated, a friendly error banner with a retry button appears. If the response array is empty, a helpful empty-state screen appears (e.g., *"No items found in this category"*).

### Q17: Why did you choose React + Vite instead of Next.js for this project?
**Answer:** For an intra-campus marketplace with authenticated student dashboards, interactive modals, and local state management, a Client-Side Rendered (CSR) Single Page Application using Vite is lightweight, fast to bundle, has sub-second Hot Module Replacement (HMR), and avoids server-side rendering (SSR) hydration complexities.

### Q18: What would you improve if this project scaled to 50,000 students across 10 campuses?
**Answer:**
1. **Multi-Campus Isolation:** Add a `campusId` index to partition listings and searches per college.
2. **Image Storage:** Migrate local image links to Cloudinary or AWS S3 with signed direct uploads.
3. **WebSockets:** Add Socket.io for instant notifications when a seller accepts a buyer's request.
4. **Read Replicas:** Route read-heavy product searches to MongoDB secondary replicas.
