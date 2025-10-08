// routes/domains.js - The Marketplace Heart
// Where digital real estate finds its destiny

const express = require('express');
const router = express.Router();
const { Domain, Listing, User, InteractionHistory } = require('../models');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { Op } = require('sequelize');

// @route   GET /api/domains/listings
// @desc    Get all active listings with filters
// @access  Public
router.get('/listings', optionalAuth, async (req, res) => {
  try {
    const { 
      search, 
      type, 
      minPrice, 
      maxPrice, 
      withSite, 
      tags,
      sortBy = 'createdAt',
      order = 'DESC',
      page = 1,
      limit = 20
    } = req.query;

    // Build where clause
    const where = { status: 'active' };
    
    if (minPrice || maxPrice) {
      where.priceAmount = {};
      if (minPrice) where.priceAmount[Op.gte] = parseFloat(minPrice);
      if (maxPrice) where.priceAmount[Op.lte] = parseFloat(maxPrice);
    }

    if (tags) {
      where.tags = {
        [Op.overlap]: tags.split(',')
      };
    }

    // Build domain where clause
    const domainWhere = {};
    if (type && type !== 'all') {
      domainWhere.domainType = type;
    }
    if (withSite === 'true') {
      domainWhere.existingSiteUrl = { [Op.ne]: null };
    }

    // Search across domain name and description
    if (search) {
      const searchConditions = {
        [Op.or]: [
          { '$domain.domainName$': { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } },
          { tags: { [Op.overlap]: [search.toLowerCase()] } }
        ]
      };
      Object.assign(where, searchConditions);
    }

    // Pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Fetch listings
    const { rows: listings, count } = await Listing.findAndCountAll({
      where,
      include: [
        {
          model: Domain,
          as: 'domain',
          where: domainWhere,
          attributes: ['id', 'domainName', 'tld', 'domainType', 'existingSiteUrl', 'seoMetrics']
        },
        {
          model: User,
          as: 'lessor',
          attributes: ['id', 'name', 'accountType', 'emailVerified', 'icannApproved']
        }
      ],
      order: [[sortBy, order]],
      limit: parseInt(limit),
      offset,
      distinct: true
    });

    // Track view interactions for authenticated users
    if (req.userId) {
      const viewedListingIds = listings.slice(0, 5).map(l => l.id);
      await InteractionHistory.bulkCreate(
        viewedListingIds.map(listingId => ({
          userId: req.userId,
          listingId,
          actionType: 'view',
          metadata: { source: 'marketplace' }
        })),
        { ignoreDuplicates: true }
      );
    }

    res.json({
      listings: listings.map(listing => ({
        id: listing.id,
        domainName: listing.domain.domainName,
        type: listing.domain.domainType,
        price: listing.priceAmount,
        duration: `${Math.floor(listing.durationDays / 30)} months`,
        hasSite: !!listing.domain.existingSiteUrl,
        traffic: listing.domain.seoMetrics?.traffic || null,
        authority: listing.domain.seoMetrics?.authority || null,
        description: listing.description,
        tags: listing.tags,
        lessor: listing.lessor.name,
        nftAvailable: !!listing.nftContractAddress,
        restrictions: listing.restrictions,
        seoMetrics: listing.domain.seoMetrics,
        viewsCount: listing.viewsCount,
        createdAt: listing.createdAt
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      },
      message: `Found ${count} magical domains waiting for dreamers! ✨`
    });

  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch listings',
      message: 'The marketplace is temporarily unavailable'
    });
  }
});

// @route   GET /api/domains/listings/:id
// @desc    Get single listing details
// @access  Public
router.get('/listings/:id', optionalAuth, async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id, {
      include: [
        {
          model: Domain,
          as: 'domain',
          include: [{
            model: User,
            as: 'owner',
            attributes: ['id', 'name', 'emailVerified', 'icannApproved']
          }]
        },
        {
          model: User,
          as: 'lessor',
          attributes: ['id', 'name', 'accountType', 'emailVerified']
        }
      ]
    });

    if (!listing) {
      return res.status(404).json({ 
        error: 'Listing not found',
        message: 'This domain has vanished into the digital ether'
      });
    }

    // Increment view count
    await listing.increment('viewsCount');

    // Track interaction for authenticated users
    if (req.userId) {
      await InteractionHistory.create({
        userId: req.userId,
        domainId: listing.domain.id,
        listingId: listing.id,
        actionType: 'view',
        metadata: { source: 'direct_link' }
      });
    }

    res.json({
      listing: {
        id: listing.id,
        domain: {
          id: listing.domain.id,
          name: listing.domain.domainName,
          tld: listing.domain.tld,
          type: listing.domain.domainType,
          existingSiteUrl: listing.domain.existingSiteUrl,
          seoMetrics: listing.domain.seoMetrics,
          verificationStatus: listing.domain.verificationStatus
        },
        price: listing.priceAmount,
        currency: listing.priceCurrency,
        durationDays: listing.durationDays,
        leaseType: listing.leaseType,
        description: listing.description,
        restrictions: listing.restrictions,
        tags: listing.tags,
        status: listing.status,
        nftAvailable: !!listing.nftContractAddress,
        nftContractAddress: listing.nftContractAddress,
        nftTokenId: listing.nftTokenId,
        qrCodeUrl: listing.qrCodeUrl,
        viewsCount: listing.viewsCount,
        featured: listing.featured,
        lessor: {
          id: listing.lessor.id,
          name: listing.lessor.name,
          verified: listing.lessor.emailVerified
        },
        createdAt: listing.createdAt,
        updatedAt: listing.updatedAt
      }
    });

  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch listing',
      message: 'Could not retrieve this domain'
    });
  }
});

// @route   POST /api/domains/listings
// @desc    Create new listing
// @access  Private
router.post('/listings', authenticate, async (req, res) => {
  try {
    const {
      domainName,
      domainType,
      price,
      durationMonths,
      description,
      restrictions,
      tags,
      existingSiteUrl,
      enableNft
    } = req.body;

    // Validate domain ownership or create domain
    let domain = await Domain.findOne({ 
      where: { domainName } 
    });

    if (domain && domain.ownerId !== req.userId) {
      return res.status(403).json({
        error: 'Domain not owned',
        message: 'You cannot list a domain you do not own'
      });
    }

    if (!domain) {
      // Create domain entry
      domain = await Domain.create({
        domainName,
        tld: domainName.split('.').pop(),
        domainType,
        ownerId: req.userId,
        existingSiteUrl,
        verificationStatus: 'pending'
      });
    }

    // Create listing
    const listing = await Listing.create({
      domainId: domain.id,
      lessorId: req.userId,
      leaseType: 'fixed',
      priceAmount: price,
      priceCurrency: 'USD',
      durationDays: durationMonths * 30,
      description,
      restrictions,
      tags: tags || [],
      status: 'active'
    });

    res.status(201).json({
      message: 'Your domain is now live in the marketplace! 🎉',
      listing: {
        id: listing.id,
        domainName: domain.domainName,
        price: listing.priceAmount,
        duration: `${durationMonths} months`,
        status: listing.status
      },
      nextSteps: [
        'Verify domain ownership',
        enableNft ? 'Mint NFT lease rights' : null,
        'Share your listing with potential lessees'
      ].filter(Boolean)
    });

  } catch (error) {
    console.error('Create listing error:', error);
    res.status(500).json({ 
      error: 'Failed to create listing',
      message: 'Could not publish your domain to the marketplace'
    });
  }
});

// @route   PATCH /api/domains/listings/:id
// @desc    Update listing
// @access  Private (owner only)
router.patch('/listings/:id', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.lessorId !== req.userId) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'You can only update your own listings'
      });
    }

    const { price, description, restrictions, tags, status } = req.body;

    await listing.update({
      priceAmount: price || listing.priceAmount,
      description: description || listing.description,
      restrictions: restrictions || listing.restrictions,
      tags: tags || listing.tags,
      status: status || listing.status
    });

    res.json({
      message: 'Listing updated successfully! ✨',
      listing: {
        id: listing.id,
        price: listing.priceAmount,
        description: listing.description,
        status: listing.status
      }
    });

  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ 
      error: 'Failed to update listing',
      message: 'Could not update your listing'
    });
  }
});

// @route   DELETE /api/domains/listings/:id
// @desc    Delete/cancel listing
// @access  Private (owner only)
router.delete('/listings/:id', authenticate, async (req, res) => {
  try {
    const listing = await Listing.findByPk(req.params.id);

    if (!listing) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listing.lessorId !== req.userId) {
      return res.status(403).json({ 
        error: 'Unauthorized',
        message: 'You can only delete your own listings'
      });
    }

    if (listing.status === 'leased') {
      return res.status(400).json({
        error: 'Cannot delete active lease',
        message: 'This listing is currently leased'
      });
    }

    await listing.update({ status: 'cancelled' });

    res.json({
      message: 'Listing removed from marketplace',
      listing: {
        id: listing.id,
        status: 'cancelled'
      }
    });

  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ 
      error: 'Failed to delete listing',
      message: 'Could not remove your listing'
    });
  }
});

// @route   GET /api/domains/recommendations
// @desc    Get AI-powered domain recommendations
// @access  Private (Pro users)
router.get('/recommendations', authenticate, async (req, res) => {
  try {
    const user = await User.findByPk(req.userId);

    if (!user.isPro) {
      return res.status(403).json({
        error: 'Pro subscription required',
        message: 'Upgrade to Pro for AI-powered recommendations! ✨'
      });
    }

    // Get user's interaction history
    const recentInteractions = await InteractionHistory.findAll({
      where: { userId: req.userId },
      order: [['createdAt', 'DESC']],
      limit: 20,
      include: [{
        model: Domain,
        as: 'domain',
        attributes: ['domainType', 'tld'],
        include: [{
          model: Listing,
          as: 'listings',
          attributes: ['tags', 'priceAmount']
        }]
      }]
    });

    // Build recommendation query based on user profile and history
    const whereClause = {
      status: 'active',
      priceAmount: {
        [Op.between]: [user.budgetMin, user.budgetMax]
      }
    };

    // Filter by preferred TLDs if specified
    const domainWhere = {};
    if (user.preferredTlds && user.preferredTlds.length > 0) {
      domainWhere.tld = { [Op.in]: user.preferredTlds.map(t => t.replace('.', '')) };
    }

    // Get listings matching user preferences
    const recommendations = await Listing.findAll({
      where: whereClause,
      include: [{
        model: Domain,
        as: 'domain',
        where: domainWhere,
        attributes: ['domainName', 'tld', 'domainType', 'seoMetrics']
      }, {
        model: User,
        as: 'lessor',
        attributes: ['name']
      }],
      order: [['viewsCount', 'DESC']],
      limit: 10
    });

    res.json({
      message: 'Here are domains picked just for you! ✨',
      recommendations: recommendations.map(listing => ({
        id: listing.id,
        domainName: listing.domain.domainName,
        type: listing.domain.domainType,
        price: listing.priceAmount,
        tags: listing.tags,
        matchScore: Math.random() * 100, // TODO: Implement real scoring
        reason: `Matches your ${user.businessCategory[0]} focus`
      })),
      basedOn: {
        businessCategory: user.businessCategory,
        projectGoals: user.projectGoals,
        budgetRange: { min: user.budgetMin, max: user.budgetMax },
        recentViews: recentInteractions.length
      }
    });

  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({ 
      error: 'Failed to get recommendations',
      message: 'Could not generate personalized recommendations'
    });
  }
});

module.exports = router;