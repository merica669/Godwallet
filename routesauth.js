// routes/auth.js - The Gateway to Dreams
// Where every journey begins with identity and trust

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { ethers } = require('ethers');

// Validation middleware
const validateRegistration = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('name').trim().isLength({ min: 2, max: 100 })
];

const validateLogin = [
  body('email').isEmail().normalizeEmail(),
  body('password').exists()
];

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
// @desc    Register new user
// @access  Public
router.post('/register', validateRegistration, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password, name, accountType } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ 
        error: 'User already exists',
        message: 'This email is already part of the Godwallet family!'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = await User.create({
      email,
      passwordHash,
      name,
      accountType: accountType || 'lessee'
    });

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Welcome to Godwallet! Your journey begins now ✨',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        isPro: user.isPro
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed',
      message: 'Something magical went wrong. Please try again.'
    });
  }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', validateLogin, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: errors.array() 
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ 
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }

    // Update last active
    await user.update({ lastActive: new Date() });

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Welcome back, dreamer! 🌟',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        isPro: user.isPro,
        businessCategory: user.businessCategory,
        projectGoals: user.projectGoals,
        preferences: {
          communicationStyle: user.communicationStyle,
          leaseDuration: user.leaseDuration,
          withExistingSite: user.withExistingSite
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed',
      message: 'Something magical went wrong. Please try again.'
    });
  }
});

// @route   POST /api/auth/wallet-login
// @desc    Login/register with Web3 wallet
// @access  Public
router.post('/wallet-login', async (req, res) => {
  try {
    const { walletAddress, signature, message } = req.body;

    // Verify signature
    const recoveredAddress = ethers.verifyMessage(message, signature);
    
    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(401).json({ 
        error: 'Invalid signature',
        message: 'Wallet verification failed'
      });
    }

    // Find or create user
    let user = await User.findOne({ where: { walletAddress } });
    
    if (!user) {
      // Create new user with wallet
      user = await User.create({
        email: `${walletAddress.substring(0, 10)}@wallet.godwallet.com`,
        passwordHash: await bcrypt.hash(Math.random().toString(), 10), // Random password
        name: `Wallet User ${walletAddress.substring(0, 6)}`,
        walletAddress,
        accountType: 'both',
        emailVerified: false
      });
    } else {
      await user.update({ lastActive: new Date() });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: user.createdAt === user.updatedAt 
        ? 'Welcome to Godwallet! 🌟' 
        : 'Welcome back! 🌟',
      token,
      user: {
        id: user.id,
        name: user.name,
        walletAddress: user.walletAddress,
        accountType: user.accountType,
        isPro: user.isPro,
        isNewUser: user.createdAt === user.updatedAt
      }
    });

  } catch (error) {
    console.error('Wallet login error:', error);
    res.status(500).json({ 
      error: 'Wallet login failed',
      message: 'Could not verify your wallet. Please try again.'
    });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private (requires auth middleware)
router.get('/me', async (req, res) => {
  try {
    // req.userId set by auth middleware
    const user = await User.findByPk(req.userId, {
      attributes: { exclude: ['passwordHash'] }
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found',
        message: 'This dreamer seems to have vanished into the ether'
      });
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        accountType: user.accountType,
        walletAddress: user.walletAddress,
        businessCategory: user.businessCategory,
        projectGoals: user.projectGoals,
        budgetRange: {
          min: user.budgetMin,
          max: user.budgetMax,
          currency: user.currency
        },
        preferredTlds: user.preferredTlds,
        preferences: {
          leaseDuration: user.leaseDuration,
          withExistingSite: user.withExistingSite,
          blockchainPreference: user.blockchainPreference,
          communicationStyle: user.communicationStyle
        },
        verification: {
          emailVerified: user.emailVerified,
          icannApproved: user.icannApproved,
          kycCompleted: user.kycCompleted
        },
        isPro: user.isPro,
        proExpiresAt: user.proExpiresAt,
        lastActive: user.lastActive
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      error: 'Failed to get user',
      message: 'Could not retrieve your profile'
    });
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verify old token (even if expired)
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { 
      ignoreExpiration: true 
    });

    // Check if user still exists
    const user = await User.findByPk(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new token
    const newToken = generateToken(user.id);

    res.json({
      message: 'Token refreshed successfully',
      token: newToken
    });

  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(401).json({ 
      error: 'Invalid token',
      message: 'Could not refresh your session'
    });
  }
});

module.exports = router;