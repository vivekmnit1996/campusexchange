import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'campusexchange_jwt_super_secret_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, role, college, branch, year, hostel, phone } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
    }

    const assignedRole = role && role.toUpperCase() === 'ADMIN'
      ? 'ADMIN'
      : 'STUDENT';

    const user = await User.create({
      name,
      email,
      password,
      role: assignedRole,
      college: college || 'MNIT Jaipur',
      branch: branch || 'Computer Science & Engineering',
      year: year || '3rd Year',
      hostel: hostel || 'Hostel 5',
      phone: phone || '',
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to CampusExchange.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        branch: user.branch,
        year: user.year,
        hostel: user.hostel,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended by the campus administrator.',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        branch: user.branch,
        year: user.year,
        hostel: user.hostel,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const demoLogin = async (req, res, next) => {
  try {
    const { role, email } = req.body;
    let user = null;

    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    if (!user && role) {
      const normalizedRole = role.toUpperCase();
      if (normalizedRole === 'ADMIN') {
        user = await User.findOne({ role: 'ADMIN' });
      } else {
        // Find existing student demo user
        user = (await User.findOne({ email: 'rahul@mnit.ac.in' })) ||
               (await User.findOne({ role: { $ne: 'ADMIN' } }));
      }
    }

    if (!user) {
      // Default fallback: student demo account
      user = (await User.findOne({ email: 'rahul@mnit.ac.in' })) ||
             (await User.findOne({ role: { $ne: 'ADMIN' } })) ||
             (await User.findOne());
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No demo student found. Please seed the database first.',
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: `Demo sign-in as ${user.name} (${user.role}) successful.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        branch: user.branch,
        year: user.year,
        hostel: user.hostel,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        branch: user.branch,
        year: user.year,
        hostel: user.hostel,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, college, branch, year, hostel, phone, avatar, role } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (college) user.college = college;
    if (branch) user.branch = branch;
    if (year) user.year = year;
    if (hostel) user.hostel = hostel;
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        college: user.college,
        branch: user.branch,
        year: user.year,
        hostel: user.hostel,
        phone: user.phone,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    next(error);
  }
};
