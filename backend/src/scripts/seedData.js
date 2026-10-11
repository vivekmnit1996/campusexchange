import mongoose from 'mongoose';
import { User } from '../models/User.js';
import { Product } from '../models/Product.js';
import { PurchaseRequest } from '../models/PurchaseRequest.js';

export const seedDatabase = async () => {
  try {
    console.log('🧹 Purging existing marketplace data...');
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      PurchaseRequest.deleteMany({}),
    ]);

    console.log('👥 Seeding CampusExchange Users (Admin, Sellers, Buyers)...');

    // 1. Campus Admin
    const admin = await User.create({
      name: 'Prof. Aruna Sharma (Campus Admin)',
      email: 'admin@campusexchange.ac.in',
      password: 'Password123!',
      role: 'ADMIN',
      college: 'MNIT Jaipur',
      branch: 'Faculty Coordinator',
      year: 'Faculty',
      hostel: 'Faculty Quarters B-12',
      phone: '+91 94140 12345',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=256&q=80',
    });

    // 2. Verified Students (can both buy and sell)
    const rahul = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@mnit.ac.in',
      password: 'Password123!',
      role: 'STUDENT',
      college: 'MNIT Jaipur',
      branch: 'Computer Science & Engineering',
      year: '4th Year',
      hostel: 'Hostel 5 (Room 304)',
      phone: '+91 98765 43210',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=256&q=80',
    });

    const priya = await User.create({
      name: 'Priya Verma',
      email: 'priya@mnit.ac.in',
      password: 'Password123!',
      role: 'STUDENT',
      college: 'MNIT Jaipur',
      branch: 'Artificial Intelligence & Data Eng',
      year: '3rd Year',
      hostel: 'Gargi Hostel (Room 118)',
      phone: '+91 98123 45678',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=256&q=80',
    });

    const amit = await User.create({
      name: 'Amit Patel',
      email: 'amit@mnit.ac.in',
      password: 'Password123!',
      role: 'STUDENT',
      college: 'MNIT Jaipur',
      branch: 'Mechanical Engineering',
      year: '2nd Year',
      hostel: 'Hostel 3 (Room 214)',
      phone: '+91 98989 87654',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=256&q=80',
    });

    const sneha = await User.create({
      name: 'Sneha Gupta',
      email: 'sneha@mnit.ac.in',
      password: 'Password123!',
      role: 'STUDENT',
      college: 'MNIT Jaipur',
      branch: 'Electrical Engineering',
      year: '1st Year',
      hostel: 'Gargi Hostel (Room 205)',
      phone: '+91 97777 11223',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=256&q=80',
    });

    console.log('📦 Seeding Campus Second-Hand Listings...');

    const p1 = await Product.create({
      seller: rahul._id,
      title: 'Casio fx-991EX ClassWiz Scientific Calculator',
      description: 'Essential calculator for engineering maths and physics exams. Crisp high-resolution LCD display, solar backup, QR code function. Used gently for 2 semesters, all buttons crisp.',
      category: 'Calculators',
      price: 650,
      quantity: 1,
      stock: 1,
      condition: 'Like New',
      image: 'https://images.unsplash.com/photo-1611125832047-1d7ad1e8e485?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1611125832047-1d7ad1e8e485?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Hostel 5 Gate / Central Lawn',
      status: 'AVAILABLE',
      reasonForSelling: 'Graduating',
    });

    const p2 = await Product.create({
      seller: rahul._id,
      title: 'Dell 24" IPS Coding Monitor (1080p, 75Hz)',
      description: 'Ultra-thin bezel monitor with eye-care flicker-free mode. Perfect for dual-screen programming and web development. Includes original HDMI cable and power adapter.',
      category: 'Electronics',
      price: 5200,
      quantity: 1,
      stock: 1,
      condition: 'Like New',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Hostel 5 Room 304',
      status: 'AVAILABLE',
      reasonForSelling: 'Graduating',
    });

    const p3 = await Product.create({
      seller: priya._id,
      title: 'Hero Sprint 26T Campus Bicycle with Front Basket',
      description: 'Single-speed campus commuter bicycle. Recently serviced with new brake pads and lubricated chain. Very sturdy for riding between hostel and lecture theaters. Number lock included.',
      category: 'Sports equipment',
      price: 2400,
      quantity: 1,
      stock: 1,
      condition: 'Good',
      image: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Gargi Hostel Cycle Stand',
      status: 'AVAILABLE',
      reasonForSelling: 'Graduating',
    });

    const p4 = await Product.create({
      seller: priya._id,
      title: 'Engineering Mathematics Vol 1 & 2 (Erwin Kreyszig)',
      description: 'Complete 10th Edition Advanced Engineering Mathematics. Covers Linear Algebra, Calculus, Differential Equations, and Complex Analysis. Clean pages with minimal pencil marks.',
      category: 'Books',
      price: 450,
      quantity: 1,
      stock: 1,
      condition: 'Good',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Central Library Lawn',
      status: 'AVAILABLE',
      reasonForSelling: 'Cleared Semester',
    });

    const p5 = await Product.create({
      seller: rahul._id,
      title: 'Hostel Wooden Study Desk & Ergonomic Mesh Chair',
      description: 'Compact wooden study table with bookshelf rack and breathable mesh swivel chair. Ideal for hostel rooms. Table is rock-solid and disassembles for easy transport.',
      category: 'Furniture',
      price: 1800,
      quantity: 1,
      stock: 1,
      condition: 'Good',
      image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Hostel 5 Common Room',
      status: 'AVAILABLE',
      reasonForSelling: 'Graduating',
    });

    const p6 = await Product.create({
      seller: priya._id,
      title: 'Pigeon 1.5L Stainless Steel Electric Kettle',
      description: 'Boils water and makes midnight hostel Maggi in 3 minutes! Auto-shutoff safety feature. Clean, descaled heating element with standard 3-pin plug.',
      category: 'Other useful student items',
      price: 350,
      quantity: 2,
      stock: 2,
      condition: 'Good',
      image: 'https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1594213114663-d94db9b17125?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Campus Canteen / Dispensary',
      status: 'AVAILABLE',
      reasonForSelling: 'Moving Off-Campus',
    });

    const p7 = await Product.create({
      seller: rahul._id,
      title: 'Yonex Muscle Power 29 Badminton Racket & 3 Mavis 350 Shuttles',
      description: 'Full carbon graphite shaft, pre-strung at 24 lbs tension with Yonex BG65 string. Great for inter-hostel matches and evening sports arena play.',
      category: 'Sports equipment',
      price: 800,
      quantity: 0,
      stock: 0,
      condition: 'Like New',
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Sports Complex Badminton Court',
      status: 'RESERVED',
      reasonForSelling: 'Graduating',
    });

    const p8 = await Product.create({
      seller: rahul._id,
      title: 'GATE CSE Handwritten Revision Notes & Formula Book',
      description: 'Comprehensive handwritten revision notes covering Algorithms, Operating Systems, DBMS, Theory of Computation, and Computer Networks. Scored AIR 340.',
      category: 'Notes/study material',
      price: 300,
      quantity: 0,
      stock: 0,
      condition: 'Like New',
      image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80',
      images: ['https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=800&q=80'],
      pickupLocation: 'Hostel 5 Gate',
      status: 'SOLD',
      reasonForSelling: 'Graduating',
    });

    console.log('🤝 Seeding Sample Purchase Requests (Purchases & Incoming Requests)...');

    // 1. Rahul's Own Purchases (My Purchases tab)
    // 1a. Accepted purchase (Demonstrates phone revealed for physical hand-off)
    await PurchaseRequest.create({
      product: p4._id, // Engineering Mathematics Book
      buyer: rahul._id,
      seller: priya._id,
      status: 'ACCEPTED',
      quantity: 1,
      totalAmount: 450,
      notes: 'Can meet after 4 PM lecture near Central Library.',
      pickupLocation: 'Central Library Lawn',
    });

    // 1b. Pending purchase (Demonstrates phone privacy hidden while waiting for seller)
    await PurchaseRequest.create({
      product: p6._id, // Electric Kettle
      buyer: rahul._id,
      seller: priya._id,
      status: 'PENDING',
      quantity: 1,
      totalAmount: 350,
      notes: 'Need this for hostel tea. Can pick up today evening.',
      pickupLocation: 'Campus Canteen / Dispensary',
    });

    // 2. Incoming Requests for Rahul's Listings (Incoming Requests tab)
    // 2a. Pending incoming request from Sneha (Demonstrates seller Accept/Decline actions)
    await PurchaseRequest.create({
      product: p1._id, // Casio Calculator
      buyer: sneha._id,
      seller: rahul._id,
      status: 'PENDING',
      quantity: 1,
      totalAmount: 650,
      notes: 'Hi Rahul! Can we meet tomorrow afternoon near the Central Lawn?',
      pickupLocation: 'Hostel 5 Gate / Central Lawn',
    });

    // 2b. Accepted incoming request for Yonex Racket
    await PurchaseRequest.create({
      product: p7._id, // Yonex Racket
      buyer: sneha._id,
      seller: rahul._id,
      status: 'ACCEPTED',
      quantity: 1,
      totalAmount: 800,
      notes: 'Available to meet at the Sports Complex around 6 PM.',
      pickupLocation: 'Sports Complex Badminton Court',
    });

    // 2c. Completed exchange with Amit for GATE Notes
    await PurchaseRequest.create({
      product: p8._id, // GATE Notes
      buyer: amit._id,
      seller: rahul._id,
      status: 'COMPLETED',
      quantity: 1,
      totalAmount: 300,
      notes: 'Hand-off done outside Hostel 5. Paid directly in person.',
      pickupLocation: 'Hostel 5 Gate',
    });

    console.log('✅ CampusExchange seed finished successfully!');
    return {
      admin: admin.email,
      students: [rahul.email, priya.email, amit.email, sneha.email],
      productsSeeded: 8,
      requestsSeeded: 5,
    };
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};
