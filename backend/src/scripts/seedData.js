import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { LedgerEntry } from '../models/LedgerEntry.js';
import { WebhookEvent } from '../models/WebhookEvent.js';
import { IdempotencyRecord } from '../models/IdempotencyRecord.js';

export const seedDatabase = async () => {
  try {
    console.log('🧹 Purging existing marketplace data...');
    await Promise.all([
      User.deleteMany({}),
      Store.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      LedgerEntry.deleteMany({}),
      WebhookEvent.deleteMany({}),
      IdempotencyRecord.deleteMany({}),
    ]);

    console.log('👥 Seeding RBAC Users & Stores...');
    // 1. Admin
    const admin = await User.create({
      name: 'Elena Rostova (Admin)',
      email: 'admin@marketpulse.io',
      password: 'Password123!',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    });

    // 2. Tech Vendor User & Store
    const techUser = await User.create({
      name: 'Marcus Vance (Tech Lead)',
      email: 'vendor.tech@marketpulse.io',
      password: 'Password123!',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    });

    const techStore = await Store.create({
      name: 'Apex Robotics & Gear',
      slug: 'apex-robotics',
      owner: techUser._id,
      description: 'Cutting-edge developer hardware, audiophile monitoring, and precision mechanical peripherals.',
      logo: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=256&q=80',
      banner: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=1200&q=80',
      commissionRate: 0.10, // 10%
      balance: 1420.50,
      totalRevenue: 5240.00,
      isApproved: true,
      payoutEmail: 'payouts@apexgear.io',
    });
    techUser.store = techStore._id;
    await techUser.save();

    // 3. Artisan / Fashion Vendor User & Store
    const artisanUser = await User.create({
      name: 'Sora Tanaka (Design Lead)',
      email: 'vendor.artisan@marketpulse.io',
      password: 'Password123!',
      role: 'vendor',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    });

    const artisanStore = await Store.create({
      name: 'Kuro Studio Crafted',
      slug: 'kuro-studio',
      owner: artisanUser._id,
      description: 'Hand-stitched full-grain Italian leather, minimalist workspace accessories, and ergonomic desk mats.',
      logo: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=256&q=80',
      banner: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80',
      commissionRate: 0.12, // 12%
      balance: 890.00,
      totalRevenue: 3410.00,
      isApproved: true,
      payoutEmail: 'billing@kurostudio.jp',
    });
    artisanUser.store = artisanStore._id;
    await artisanUser.save();

    // 4. Customer
    const customer = await User.create({
      name: 'Alex Rivera (Shopper)',
      email: 'customer@marketpulse.io',
      password: 'Password123!',
      role: 'customer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
      walletBalance: 850.00,
    });

    console.log('📦 Seeding Products with Inventory...');
    const productsData = [
      {
        title: 'Neural ANC Studio Pro Headphones',
        slug: 'neural-anc-studio-pro-headphones',
        description: 'Planar magnetic active noise-cancelling studio reference monitors with lossless spatial audio decoding and 40-hour battery life.',
        price: 349.99,
        compareAtPrice: 429.99,
        stock: 24,
        category: 'Audio',
        tags: ['Audio', 'Noise-Cancelling', 'Wireless', 'Studio'],
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'],
        store: techStore._id,
        rating: 4.9,
        numReviews: 38,
        isFeatured: true,
        attributes: { Driver: '45mm Planar', Battery: '40 Hours', Connectivity: 'Bluetooth 5.4 / USB-C DAC' },
      },
      {
        title: 'Matrix 75% Custom Mechanical Keyboard',
        slug: 'matrix-75-mechanical-keyboard',
        description: 'Gasket-mounted aluminum chassis, hot-swappable tactile lubricated switches, screw-in stabilizers, and per-key RGB backlighting.',
        price: 189.50,
        compareAtPrice: 220.00,
        stock: 15,
        category: 'Electronics',
        tags: ['Keyboards', 'Peripherals', 'Custom', 'Mechanical'],
        images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80'],
        store: techStore._id,
        rating: 4.8,
        numReviews: 29,
        isFeatured: true,
        attributes: { Layout: '75% Compact', Switches: 'Gateron Oil King', Keycaps: 'PBT Double-shot' },
      },
      {
        title: '⚡ Flash Sale Exclusive - Ultra Soundbar',
        slug: 'flash-sale-ultra-soundbar',
        description: 'Limited edition Dolby Atmos desktop soundbar with dedicated wireless sub-bass transducer. Built for concurrency stress-testing.',
        price: 99.00,
        compareAtPrice: 199.00,
        stock: 3, // Low stock specifically to demo concurrency locking!
        category: 'Audio',
        tags: ['Flash Sale', 'Audio', 'Limited'],
        images: ['https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80'],
        store: techStore._id,
        rating: 5.0,
        numReviews: 4,
        isFeatured: true,
        attributes: { Output: '120W Peak', Audio: 'Dolby Atmos 5.1' },
      },
      {
        title: 'Full-Grain Tuscan Leather Desk Pad',
        slug: 'full-grain-tuscan-leather-desk-pad',
        description: 'Vegetable-tanned artisanal Italian leather mat with burnished edges and non-slip natural wool felt backing.',
        price: 89.00,
        compareAtPrice: 110.00,
        stock: 40,
        category: 'Workspace',
        tags: ['Leather', 'Desk Setup', 'Handmade', 'Luxury'],
        images: ['https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=800&q=80'],
        store: artisanStore._id,
        rating: 4.9,
        numReviews: 52,
        isFeatured: true,
        attributes: { Dimensions: '90cm x 40cm', Leather: 'Tuscan Veg-Tanned', Thickness: '3.5mm' },
      },
      {
        title: 'Minimalist Walnut Laptop Riser Stand',
        slug: 'minimalist-walnut-laptop-stand',
        description: 'Solid American walnut curved laptop stand with aerospace-grade anodized aluminum support brackets and passive heat dissipation.',
        price: 74.50,
        compareAtPrice: 95.00,
        stock: 18,
        category: 'Workspace',
        tags: ['Woodwork', 'Ergonomics', 'Walnut'],
        images: ['https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80'],
        store: artisanStore._id,
        rating: 4.7,
        numReviews: 19,
        isFeatured: false,
        attributes: { Material: 'Solid Walnut', Compatibility: 'Up to 16-inch Laptops' },
      },
      {
        title: 'Precision 4K UHD Ultra-Wide 34" Monitor',
        slug: 'precision-4k-ultra-wide-monitor',
        description: 'Color-calibrated 10-bit IPS panel, 100% DCI-P3 gamut coverage, 90W USB-C Power Delivery hub, and 144Hz refresh rate.',
        price: 649.00,
        compareAtPrice: 799.00,
        stock: 8,
        category: 'Electronics',
        tags: ['Monitors', 'Display', '4K', 'Ultrawide'],
        images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'],
        store: techStore._id,
        rating: 4.8,
        numReviews: 14,
        isFeatured: false,
        attributes: { Resolution: '3440 x 1440', RefreshRate: '144Hz', ColorGamut: '100% DCI-P3' },
      },
    ];

    const products = await Product.insertMany(productsData);

    console.log('🛒 Seeding Multi-Vendor Orders & Financial Ledgers...');
    // Seed an initial multi-vendor order spanning both stores
    const subOrder1Total = products[0].price * 1;
    const fee1 = Number((subOrder1Total * 0.10).toFixed(2));
    const payout1 = Number((subOrder1Total - fee1).toFixed(2));

    const subOrder2Total = products[3].price * 2;
    const fee2 = Number((subOrder2Total * 0.12).toFixed(2));
    const payout2 = Number((subOrder2Total - fee2).toFixed(2));

    const grandTotal = subOrder1Total + subOrder2Total;
    const totalFee = fee1 + fee2;
    const totalPayout = payout1 + payout2;

    const sampleOrder = await Order.create({
      orderNumber: 'MP-DEMO-2026-8812',
      customer: customer._id,
      customerInfo: {
        name: customer.name,
        email: customer.email,
        address: '742 Evergreen Terrace',
        city: 'Seattle',
        postalCode: '98101',
        country: 'USA',
      },
      items: [
        { product: products[0]._id, title: products[0].title, price: products[0].price, quantity: 1, store: techStore._id, image: products[0].images[0] },
        { product: products[3]._id, title: products[3].title, price: products[3].price, quantity: 2, store: artisanStore._id, image: products[3].images[0] },
      ],
      vendorSubOrders: [
        {
          store: techStore._id,
          vendor: techUser._id,
          subTotal: subOrder1Total,
          platformFee: fee1,
          vendorPayout: payout1,
          status: 'SHIPPED',
          items: [{ product: products[0]._id, title: products[0].title, price: products[0].price, quantity: 1, store: techStore._id, image: products[0].images[0] }],
          trackingNumber: 'UPS-9482910482',
          carrier: 'UPS 2nd Day Air',
        },
        {
          store: artisanStore._id,
          vendor: artisanUser._id,
          subTotal: subOrder2Total,
          platformFee: fee2,
          vendorPayout: payout2,
          status: 'PROCESSING',
          items: [{ product: products[3]._id, title: products[3].title, price: products[3].price, quantity: 2, store: artisanStore._id, image: products[3].images[0] }],
          trackingNumber: '',
          carrier: 'USPS Priority',
        },
      ],
      totalAmount: grandTotal,
      totalPlatformFee: totalFee,
      totalVendorPayout: totalPayout,
      paymentStatus: 'PAID',
      paymentMethod: 'credit_card',
      paymentIntentId: 'pi_demo_seed_849204',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    });

    // Seed Ledger Entries
    await LedgerEntry.insertMany([
      {
        transactionId: 'TX-SEED-001',
        order: sampleOrder._id,
        user: customer._id,
        type: 'CUSTOMER_DEBIT',
        amount: -grandTotal,
        balanceAfter: customer.walletBalance,
        description: `Payment for Order #${sampleOrder.orderNumber}`,
      },
      {
        transactionId: 'TX-SEED-001',
        order: sampleOrder._id,
        store: techStore._id,
        user: techUser._id,
        type: 'VENDOR_CREDIT',
        amount: payout1,
        balanceAfter: techStore.balance,
        description: `Vendor proceeds for Sub-Order #${sampleOrder.orderNumber}-apex-robotics`,
      },
      {
        transactionId: 'TX-SEED-001',
        order: sampleOrder._id,
        store: techStore._id,
        type: 'PLATFORM_COMMISSION',
        amount: fee1,
        balanceAfter: fee1,
        description: `Platform fee (10%) for Sub-Order #${sampleOrder.orderNumber}`,
      },
      {
        transactionId: 'TX-SEED-001',
        order: sampleOrder._id,
        store: artisanStore._id,
        user: artisanUser._id,
        type: 'VENDOR_CREDIT',
        amount: payout2,
        balanceAfter: artisanStore.balance,
        description: `Vendor proceeds for Sub-Order #${sampleOrder.orderNumber}-kuro-studio`,
      },
      {
        transactionId: 'TX-SEED-001',
        order: sampleOrder._id,
        store: artisanStore._id,
        type: 'PLATFORM_COMMISSION',
        amount: fee2,
        balanceAfter: fee2,
        description: `Platform fee (12%) for Sub-Order #${sampleOrder.orderNumber}`,
      },
    ]);

    console.log('✅ Seed Complete! Multi-vendor marketplace initialized with RBAC users, stores, products, orders, and ledger.');
    return {
      users: 4,
      stores: 2,
      products: products.length,
      orders: 1,
    };
  } catch (error) {
    console.error('Seed Database Error:', error);
    throw error;
  }
};
