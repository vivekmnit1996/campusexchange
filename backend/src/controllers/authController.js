import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Store } from '../models/Store.js';
import { Product } from '../models/Product.js';

const generateTokens = (user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'marketpulse_jwt_super_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET || 'marketpulse_refresh_super_secret_key_2026',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

  return { token, refreshToken };
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, storeName } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Email is already registered.' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'customer',
      walletBalance: 0.0,
      savedAddresses: [
        {
          name: name || 'Customer',
          address: '452 Innovation Blvd, Suite 300',
          city: 'San Francisco',
          postalCode: '94107',
          country: 'United States',
          isDefault: true,
        },
      ],
    });

    let store = null;
    if (role === 'vendor' && storeName) {
      const slug = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      store = await Store.create({
        name: storeName,
        slug,
        owner: user._id,
      });
      user.store = store._id;
      await user.save();
    }

    const { token, refreshToken } = generateTokens(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        savedAddresses: user.savedAddresses,
        wishlist: user.wishlist || [],
        store: store ? { id: store._id, name: store.name, slug: store.slug } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password.' });
    }

    const cleanEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: cleanEmail }).select('+password').populate('store');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const { token, refreshToken } = generateTokens(user);

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        savedAddresses: user.savedAddresses || [],
        wishlist: user.wishlist || [],
        store: user.store ? { id: user.store._id, name: user.store.name, slug: user.store.slug, balance: user.store.balance } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('store');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        walletBalance: user.walletBalance,
        savedAddresses: user.savedAddresses || [],
        wishlist: user.wishlist || [],
        store: user.store ? { id: user.store._id, name: user.store.name, slug: user.store.slug, balance: user.store.balance } : null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const user = await User.findById(req.user.id);

    const index = user.wishlist.indexOf(productId);
    let inWishlist = false;

    if (index > -1) {
      user.wishlist.splice(index, 1);
      inWishlist = false;
    } else {
      user.wishlist.push(productId);
      inWishlist = true;
    }

    await user.save();
    res.json({ success: true, inWishlist, wishlist: user.wishlist });
  } catch (error) {
    next(error);
  }
};

export const getWishlist = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate({
      path: 'wishlist',
      populate: { path: 'store', select: 'name slug' },
    });
    res.json({ success: true, wishlist: user.wishlist || [] });
  } catch (error) {
    next(error);
  }
};

export const addSavedAddress = async (req, res, next) => {
  try {
    const { name, address, city, postalCode, country } = req.body;
    const user = await User.findById(req.user.id);

    user.savedAddresses.push({
      name,
      address,
      city,
      postalCode,
      country: country || 'United States',
      isDefault: user.savedAddresses.length === 0,
    });

    await user.save();
    res.status(201).json({ success: true, savedAddresses: user.savedAddresses });
  } catch (error) {
    next(error);
  }
};

export const deleteSavedAddress = async (req, res, next) => {
  try {
    const { addressId } = req.params;
    const user = await User.findById(req.user.id);

    user.savedAddresses = user.savedAddresses.filter((a) => a._id.toString() !== addressId);
    await user.save();

    res.json({ success: true, savedAddresses: user.savedAddresses });
  } catch (error) {
    next(error);
  }
};
