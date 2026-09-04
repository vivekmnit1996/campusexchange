# MarketPulse — Multi-Vendor E-Commerce & Creator Marketplace

> **A modern, high-performance Multi-Vendor Marketplace platform built with the MERN Stack, featuring Neo-Brutalism & Cyber-Brutalism UI design, atomic inventory concurrency locking, multi-vendor order partitioning, visual carrier tracking, instant payment methods, and an intelligent LangGraph AI Agent Assistant powered by Groq with strict marketplace domain guardrails.**

[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933.svg?logo=node.js&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express.js-v4-000000.svg?logo=express&logoColor=white)](https://expressjs.com)
[![LangGraph](https://img.shields.io/badge/LangGraph-StateGraph%20Engine-FF6F00.svg)](https://langchain-ai.github.io/langgraphjs/)
[![Groq](https://img.shields.io/badge/Groq-Llama%203.3%20%2F%20OSS--120B-F55036.svg)](https://groq.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20Ready-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com)
[![React](https://img.shields.io/badge/React-v18-61DAFB.svg?logo=react&logoColor=black)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-v5-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v3-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [LangGraph AI Assistant Microservice](#-langgraph-ai-assistant-microservice)
- [Design System: Neo-Brutalism & Cyber-Brutalism](#-design-system-neo-brutalism--cyber-brutalism)
- [System Architecture](#-system-architecture)
- [API Reference](#-api-reference)
- [Seeded Accounts](#-seeded-accounts)
- [Local Setup & Installation](#-local-setup--installation)
- [Deployment Guide](#-deployment-guide)

---

## 🌟 Overview

**MarketPulse** connects independent creators, studios, and hardware brands with shoppers in a unified e-commerce experience. 

Customers can add products from multiple distinct vendor stores into a single cart and check out in one transaction. The platform automatically partitions the order into independent vendor sub-orders, assigns tracking numbers, routes payouts according to platform take-rate commissions, and maintains an immutable double-entry financial ledger.

---

## 🚀 Key Features

### 🤖 1. LangGraph AI Shopping Agent
* **Strict Domain Guardrail Engine**: Sandboxed exclusively to MarketPulse marketplace content. Out-of-domain queries (general trivia, homework, unrelated coding) are strictly refused with a polite redirection.
* **Live Catalog & Inventory Tooling**: Directly queries MongoDB to search products by keywords, categories, pricing, stock levels, and vendor store ratings.
* **Order Tracking & Policy Assistant**: Authenticated users can query their live order shipping statuses, carrier updates, escrow payouts, and dispute policies.
* **Interactive UI Product Cards**: Embedded cards within the chat drawer allowing 1-click product modal viewing and quick addition to cart.

### 🛍️ 2. Customer Storefront & Catalog
* **Multi-Faceted Search & Filters**: Search by keywords, categories (*Electronics, Audio, Workspace, Peripherals*), price sliders, and in-stock status.
* **Dedicated Vendor Storefront Pages**: Click any creator or merchant badge to visit their dedicated store profile (`/stores/:slug`), view store ratings, bio, direct warranty guarantees, and store-specific catalog.
* **Product Reviews & Star Ratings**: Verified customer reviews with 1–5 star ratings, feedback comments, and real-time average star calculation.
* **Wishlist & Saved Items**: 1-click heart toggle on product cards to save items, view dedicated wishlist drawer, and move saved items directly to the cart.

### 💳 3. Multi-Method Checkout & Instant Free UPI
* **Unified Multi-Vendor Cart**: Combines items from multiple merchants with grouped sub-totals.
* **Instant Free UPI Gateway**: Dynamic UPI intent link (`upi://pay?...`) with real-time rendered QR code and VPA address verification.
* **Credit / Debit Cards**: Secure formatted card inputs (Card Number, Expiry, CVV).
* **Cash on Delivery (COD)**: Complete checkout with payment collected upon delivery.

### 📦 4. Visual Order Tracking & Self-Service Cancellation
* **4-Stage Visual Progress Stepper**: Live tracking states (`Order Placed` ➔ `Processing` ➔ `In Transit` ➔ `Delivered`).
* **Live Carrier Tracking Sync**: Integrated courier tracking numbers (*FedEx, DHL, Courier Express*) and estimated delivery date calculations.
* **Atomic Order Cancellation**: 1-click customer cancellation for eligible unshipped orders with automated inventory restoration and double-entry ledger refund reversal.

### 🏪 5. Vendor Management Portal
* **Store Performance KPIs**: Lifetime gross merchandise value (GMV), settled balances, pending dispatches, and active catalog listings.
* **Fulfillment Pipeline**: State machine transition buttons (*Start Packing ➔ Dispatch Carrier ➔ Mark Delivered*).
* **Product Publishing**: Modal to create new SKUs with custom pricing, compare-at discounts, stock counts, and tags.

### 📊 6. Platform Admin Console & Concurrency Lab
* **Financial Analytics**: MongoDB aggregation pipelines calculating platform commission take, vendor settlement payouts, and average order value (AOV).
* **Vendor Sales Leaderboard**: Real-time ranking of merchant stores by sales volume and fulfillment rate.
* **Concurrency Flash-Sale Sandbox**: Developer testing playground to execute 50 parallel checkout bursts against a shared SKU and verify atomic lock guards.
* **HMAC-SHA256 Webhook Ingress**: Timing-safe cryptographic signature verifier with tamper rejection testing.

---

## 🧠 LangGraph AI Assistant Microservice

MarketPulse incorporates a dedicated LangGraph-powered stateful agent workflow connected to Groq's high-speed inference engine (`openai/gpt-oss-120b` & `openai/gpt-oss-20b`).

```mermaid
graph TD
    User([Shopper in Frontend]) -->|Query + Thread ID| FAB[AI Pulse Assistant Drawer]
    FAB -->|POST /api/v1/ai/chat| Backend[Express Backend / AI Microservice]

    subgraph LangGraphWorkflow [LangGraph StateGraph Workflow]
        GuardrailNode[1. Domain Guardrail Node]
        RouterNode{Is On-Topic?}
        ToolNode[2. Live MongoDB Tools]
        RefusalNode[3. Guardrail Refusal Node]
        ResponseNode[4. Response Synthesizer Node]
        Memory[(MemorySaver Checkpointer)]

        GuardrailNode --> RouterNode
        RouterNode -->|Yes| ToolNode
        RouterNode -->|No| RefusalNode
        ToolNode --> ResponseNode
        RefusalNode --> ENDNode([End State])
        ResponseNode --> ENDNode
        ResponseNode <--> Memory
    end

    Backend --> LangGraphWorkflow
    ToolNode -->|Live Catalog Queries| MongoDB[(MongoDB Atlas)]
    ResponseNode -->|Groq High-Speed LLM| GroqAPI[Groq API Cloud]
    ResponseNode -->|Markdown + Product Cards| FAB
```

### Agent Features
1. **Domain Guardrails**: Strict classification prompt rejecting queries outside of MarketPulse products, stores, orders, and policies.
2. **Catalog Search Tools**: Real-time regex and category queries against live MongoDB collections.
3. **Session Checkpointing**: Retains multi-turn conversation memory keyed by `threadId`.
4. **Resilient Dual-Mode**: Can run as an independent microservice on port `5002` or directly embedded within the backend server for cloud deployments.

---

## 🎨 Design System: Neo-Brutalism & Cyber-Brutalism

MarketPulse features a bespoke design system with support for both **Light Neubrutalism** and **Dark Cyber-Brutalism**:

* **Thick Black Outlines**: Solid `2.5px` and `3px` pure black borders across all interactive cards, modals, and inputs.
* **Hard Zero-Blur Drop Shadows**: Solid black box shadows (`shadow-brutal-sm`, `shadow-brutal`, `shadow-brutal-xl`) with tactile hover/press elevation transitions.
* **Light Palette (Neubrutalism)**: Electric Periwinkle canvas (`#5B85FA`), Canary Yellow (`#FEF08A`), Bubblegum Pink (`#FF6B97`), and Cyber Mint (`#6EE7B7`).
* **Dark Palette (Cyber-Brutalism)**: Deep Obsidian canvas (`#090A10`), Midnight Slate surfaces (`#121522`), Neon Toxic Lime (`#00FF87`), Cyber Neon Yellow (`#FFE600`), and Hot Pink (`#FF2A85`).
* **1-Click Theme Switcher**: Prominently placed on the navigation bar and login screen with automatic `localStorage` persistence.

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    Client["React 18 SPA (Vite + Tailwind)"] -->|JWT Bearer + Idempotency-Key| Gateway["Express.js API Gateway (/api/v1)"]

    subgraph "Backend & AI Services"
        Gateway --> Auth["RBAC Auth (Customer / Vendor / Admin)"]
        Gateway --> RateLimit["Sliding-Window Rate Limiter"]
        Gateway --> Idemp["Idempotency Cache Middleware"]
        Gateway --> OrderSvc["Order Orchestration & Partitioning"]
        Gateway --> LedgerSvc["Double-Entry Financial Ledger"]
        Gateway --> AnalyticsSvc["MongoDB Aggregation Engine"]
        Gateway --> WebhookSvc["HMAC-SHA256 Webhook Ingress"]
        Gateway --> AISvc["LangGraph AI Agent (/api/v1/ai)"]
    end

    subgraph "MongoDB Atlas Cluster"
        OrderSvc -->|Atomic $inc Lock| ProductsColl[("Products")]
        OrderSvc -->|ACID Multi-Doc Transaction| OrdersColl[("Master & Sub-Orders")]
        LedgerSvc -->|Double-Entry Journal| LedgerColl[("Financial Ledger")]
        Auth --> UsersColl[("Users & Wishlists")]
        AISvc --> ProductsColl
    end

    AISvc -->|Groq API Key| Groq[Groq Llama / OSS Engine]
```

---

## 📮 API Reference

All backend routes are prefixed with `/api/v1`:

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/ai/chat` | Chat with LangGraph AI shopping agent (with domain guardrails) | Public / User |
| `GET` | `/api/v1/ai/quick-prompts` | Suggested prompt queries for quick shopping actions | Public |
| `GET` | `/api/v1/ai/health` | Health and connectivity check for AI inference service | Public |
| `POST` | `/api/v1/auth/register` | Register customer or vendor store | Public |
| `POST` | `/api/v1/auth/login` | Sign in with email and password | Public |
| `GET` | `/api/v1/auth/me` | Fetch active user profile & store | Bearer JWT |
| `POST` | `/api/v1/auth/wishlist/:id` | Toggle product in customer wishlist | Customer |
| `GET` | `/api/v1/products` | Search catalog with filters, sorting, and pagination | Public |
| `POST` | `/api/v1/products` | Create a new product listing | Vendor / Admin |
| `POST` | `/api/v1/products/:id/reviews` | Submit a verified 1–5 star review | Customer |
| `GET` | `/api/v1/stores/:slug` | Retrieve vendor storefront details and catalog | Public |
| `POST` | `/api/v1/orders` | Checkout cart with atomic stock reservation | Customer |
| `GET` | `/api/v1/orders/mine` | List customer orders and visual tracking state | Customer |
| `PATCH`| `/api/v1/orders/:id/cancel` | Cancel order, refund ledger, and restore stock | Customer |
| `GET` | `/api/v1/vendor/dashboard` | Vendor earnings and fulfillment pipeline | Vendor |
| `PATCH`| `/api/v1/vendor/orders/:orderId/suborders/:subOrderId/status` | Update fulfillment state & tracking | Vendor |
| `GET` | `/api/v1/analytics/platform` | Aggregate GMV, revenue, and store leaderboard | Admin |
| `POST` | `/api/v1/webhooks/payment` | HMAC-SHA256 verified payment event ingress | Signature Header |

---

## 👥 Seeded Accounts

The database comes pre-seeded with test accounts:

| Role | Email | Password | Access Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@marketpulse.io` | `Password123!` | Full Platform Hub, Aggregation Analytics & Concurrency Lab |
| **Tech Vendor** | `vendor.tech@marketpulse.io` | `Password123!` | Apex Robotics & Gear (10% Take-Rate) |
| **Artisan Vendor** | `vendor.artisan@marketpulse.io` | `Password123!` | Kuro Studio Crafted (12% Take-Rate) |
| **Customer** | `customer@marketpulse.io` | `Password123!` | Shopper Profile, Wishlist & Order History |

---

## 💻 Local Setup & Installation

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* **MongoDB**: Local instance or free MongoDB Atlas URI
* **Groq API Key**: (Included in `.env.example`)

### 2. Clone Repository & Install Dependencies
```bash
git clone https://github.com/Pranav-by/MarketPulse.git
cd MarketPulse

# Install root, backend, frontend, and ai-service dependencies
npm run install:all
```

### 3. Environment Variables
Create a `.env` file in `backend/.env` and `ai-service/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.lkee1f1.mongodb.net/marketpulse?retryWrites=true&w=majority
JWT_SECRET=marketpulse_jwt_super_secret_key_2026_production_grade
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=marketpulse_refresh_super_secret_key_2026_secure
JWT_REFRESH_EXPIRES_IN=30d
WEBHOOK_SECRET=whsec_marketpulse_hmac_sha256_mock_key_2026
CLIENT_URL=http://localhost:5173
GROQ_API_KEY=your_groq_api_key_here
```

### 4. Seed Database & Run Locally
```bash
# Seed initial categories, sample stores, and products
npm run seed

# Run backend (:5000), frontend (:5173), and AI service (:5002) concurrently
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🌐 Deployment Guide

### Frontend Deployment (Vercel)
1. Import repository on **[Vercel](https://vercel.com)**.
2. Set **Root Directory** to `frontend`.
3. Set **Framework Preset** to `Vite`.
4. Add Environment Variable:
   * `VITE_API_URL` = `https://your-backend-service.onrender.com/api/v1`
5. Click **Deploy**.

### Backend Deployment (Render)
1. Create a new **Web Service** on **[Render](https://render.com)**.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install`.
4. Set **Start Command** to `npm start`.
5. Add the environment variables from `backend/.env` (including `GROQ_API_KEY` and `MONGODB_URI`).
6. Deploy and copy your production backend URL into Vercel's `VITE_API_URL`.

*(Render Blueprint [`render.yaml`](render.yaml) is also provided for automatic multi-service deployment).*

---

## 📄 License
This project is open-source and licensed under the [MIT License](LICENSE).
