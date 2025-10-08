// middleware/auth.js - The Guardian at the Gate
// Protecting dreams and verifying identities

const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication middleware - Requires valid JWT token
 * Attaches userId to request object
 */
const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in to access this magical realm'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if user exists
    const user = await User.findByPk(decoded.userId);
    
    if (!user) {
      return res.status(401).json({ 
        error: 'User not found',
        message: 'Your credentials have expired or are invalid'
      });
    }

    // Attach user info to request
    req.userId = decoded.userId;
    req.user = user;
    
    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Invalid token',
        message: 'Your session is invalid'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expired',
        message: 'Your session has expired. Please log in again.'
      });
    }

    console.error('Auth middleware error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      message: 'Could not verify your identity'
    });
  }
};

/**
 * Optional authentication - Attaches user if token provided
 * Does not block request if no token
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findByPk(decoded.userId);
    
    if (user) {
      req.userId = decoded.userId;
      req.user = user;
    }
    
    next();

  } catch (error) {
    // Silently fail for optional auth
    next();
  }
};

/**
 * Pro user middleware - Requires Pro subscription
 */
const requirePro = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        message: 'Please log in first'
      });
    }

    if (!req.user.isPro) {
      return res.status(403).json({ 
        error: 'Pro subscription required',
        message: 'Upgrade to Pro to unlock this magical feature! ✨',
        upgradeUrl: '/upgrade'
      });
    }

    // Check if Pro subscription is expired
    if (req.user.proExpiresAt && new Date(req.user.proExpiresAt) < new Date()) {
      await req.user.update({ isPro: false, proExpiresAt: null });
      
      return res.status(403).json({ 
        error: 'Pro subscription expired',
        message: 'Your Pro magic has expired. Time to renew! 🌟',
        upgradeUrl: '/upgrade'
      });
    }

    next();

  } catch (error) {
    console.error('Pro middleware error:', error);
    res.status(500).json({ 
      error: 'Verification failed',
      message: 'Could not verify Pro status'
    });
  }
};

/**
 * Domain owner middleware - Verifies user owns the domain
 */
const requireDomainOwner = (paramName = 'domainId') => {
  return async (req, res, next) => {
    try {
      const { Domain } = require('../models');
      const domainId = req.params[paramName];

      const domain = await Domain.findByPk(domainId);

      if (!domain) {
        return res.status(404).json({ 
          error: 'Domain not found',
          message: 'This domain does not exist in our universe'
        });
      }

      if (domain.ownerId !== req.userId) {
        return res.status(403).json({ 
          error: 'Unauthorized',
          message: 'You do not own this domain'
        });
      }

      req.domain = domain;
      next();

    } catch (error) {
      console.error('Domain owner middleware error:', error);
      res.status(500).json({ 
        error: 'Verification failed',
        message: 'Could not verify domain ownership'
      });
    }
  };
};

/**
 * Rate limiting check for AI features
 */
const checkAILimit = async (req, res, next) => {
  try {
    const { InteractionHistory } = require('../models');
    const { Op } = require('sequelize');

    // Count AI calls in last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    
    const aiCallCount = await InteractionHistory.count({
      where: {
        userId: req.userId,
        actionType: 'ai_analysis',
        createdAt: { [Op.gte]: oneHourAgo }
      }
    });

    const limit = req.user.isPro ? 50 : 5;

    if (aiCallCount >= limit) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        message: req.user.isPro 
          ? 'You\'ve reached the Pro AI limit for this hour'
          : 'You\'ve used all free AI analyses. Upgrade to Pro for more! ✨',
        upgradeUrl: req.user.isPro ? null : '/upgrade'
      });
    }

    req.aiCallsRemaining = limit - aiCallCount;
    next();

  } catch (error) {
    console.error('AI limit middleware error:', error);
    next(); // Continue on error
  }
};

module.exports = {
  authenticate,
  optionalAuth,
  requirePro,
  requireDomainOwner,
  checkAILimit
};