import { Product, Store, Order } from '../models/index.js';

export async function searchProductsTool({ query = '', category = '', maxPrice = null, minRating = null, inStockOnly = false, limit = 6 }) {
  try {
    const filter = { isActive: true };

    if (category) {
      filter.category = new RegExp(category, 'i');
    }

    if (maxPrice !== null && !isNaN(maxPrice)) {
      filter.price = { ...(filter.price || {}), $lte: Number(maxPrice) };
    }

    if (minRating !== null && !isNaN(minRating)) {
      filter.rating = { $gte: Number(minRating) };
    }

    if (inStockOnly) {
      filter.stock = { $gt: 0 };
    }

    if (query && query.trim()) {
      const q = query.trim();
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { category: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } }
      ];
    }

    const products = await Product.find(filter)
      .populate('store', 'name slug logo')
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    return products.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      stock: p.stock,
      category: p.category,
      rating: p.rating,
      numReviews: p.numReviews,
      image: p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
      storeName: p.store?.name || 'Verified Marketplace Vendor',
      storeSlug: p.store?.slug || '',
      description: p.description?.substring(0, 150) + '...',
    }));
  } catch (error) {
    console.error('[SearchProductsTool Error]:', error.message);
    return [];
  }
}

export async function getStoreInfoTool({ query = '', slug = '' }) {
  try {
    const filter = { isApproved: true };
    if (slug) {
      filter.slug = slug;
    } else if (query) {
      filter.$or = [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ];
    }

    const stores = await Store.find(filter).limit(4).lean();
    return stores.map((s) => ({
      id: s._id.toString(),
      name: s.name,
      slug: s.slug,
      description: s.description,
      logo: s.logo,
      banner: s.banner,
      commissionRate: `${(s.commissionRate * 100).toFixed(0)}%`,
    }));
  } catch (error) {
    console.error('[GetStoreInfoTool Error]:', error.message);
    return [];
  }
}

export async function getUserOrdersTool({ userId = null, userEmail = null }) {
  if (!userId && !userEmail) {
    return { error: 'Please log in to view your orders.' };
  }

  try {
    const filter = {};
    if (userId) filter.customer = userId;
    else if (userEmail) filter['customerInfo.email'] = userEmail;

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      createdAt: o.createdAt,
      totalAmount: o.totalAmount,
      paymentStatus: o.paymentStatus,
      itemsCount: o.items?.length || 0,
      items: o.items?.map(i => ({ title: i.title, quantity: i.quantity, price: i.price })),
      subOrders: o.vendorSubOrders?.map((so) => ({
        status: so.status,
        subTotal: so.subTotal,
        trackingNumber: so.trackingNumber || 'Pending dispatch',
        carrier: so.carrier || 'Standard Carrier',
      }))
    }));
  } catch (error) {
    console.error('[GetUserOrdersTool Error]:', error.message);
    return { error: 'Unable to retrieve orders at this time.' };
  }
}

export function getMarketplacePolicyFAQ(topic = 'all') {
  const policies = {
    escrow: 'MarketPulse operates a multi-vendor Double-Entry Ledger and Escrow engine. When buyers checkout, funds are held in platform escrow. Upon order fulfillment/delivery, automated sub-order ledger splits allocate vendor payouts minus standard 10% platform commission.',
    shipping: 'Shipping is fulfilled directly by individual verified vendors. Tracking numbers and status updates (PROCESSING, SHIPPED, DELIVERED) are updated in real-time in your Orders dashboard.',
    returns: 'MarketPulse supports buyer protection. If an item arrives damaged or not as described, dispute resolution triggers automated ledger reversals and refunds.',
    vendor_onboarding: 'Vendors can register via the Vendor Portal, setup custom brand storefronts, manage live stock with pessimistic lock concurrency, and withdraw escrow balances.',
    concurrency_engine: 'MarketPulse uses strict ACID transactions and pessimistic locking (or version-checked atomic operations) to prevent overselling during high-traffic flash drops.',
  };

  if (topic && policies[topic.toLowerCase()]) {
    return policies[topic.toLowerCase()];
  }
  return Object.entries(policies)
    .map(([key, val]) => `• **${key.toUpperCase()}**: ${val}`)
    .join('\n\n');
}
