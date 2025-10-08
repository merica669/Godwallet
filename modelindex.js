// models/index.js - The Memory Palace of Godwallet
// Where every domain's story is written and preserved

const { Sequelize, DataTypes } = require('sequelize');
require('dotenv').config();

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME || 'godwallet',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// User Model - The Dreamers
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  accountType: {
    type: DataTypes.ENUM('lessor', 'lessee', 'both'),
    defaultValue: 'lessee'
  },
  walletAddress: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true
  },
  businessCategory: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  projectGoals: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  budgetMin: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  budgetMax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  preferredTlds: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['.com', '.io']
  },
  leaseDuration: {
    type: DataTypes.STRING,
    defaultValue: 'long-term'
  },
  withExistingSite: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  blockchainPreference: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: ['none']
  },
  communicationStyle: {
    type: DataTypes.ENUM('technical', 'business', 'casual'),
    defaultValue: 'business'
  },
  emailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  icannApproved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  kycCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPro: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  proExpiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastActive: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['email'] },
    { fields: ['walletAddress'] }
  ]
});

// Domain Model - The Digital Real Estate
const Domain = sequelize.define('Domain', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  domainName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true
  },
  tld: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  domainType: {
    type: DataTypes.ENUM('web2', 'web3'),
    allowNull: false
  },
  ownerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  verificationStatus: {
    type: DataTypes.ENUM('pending', 'verified', 'failed'),
    defaultValue: 'pending'
  },
  verificationMethod: {
    type: DataTypes.STRING(100)
  },
  verificationToken: {
    type: DataTypes.STRING
  },
  existingSiteUrl: {
    type: DataTypes.STRING(500)
  },
  seoMetrics: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  verifiedAt: {
    type: DataTypes.DATE
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['domainName'] },
    { fields: ['ownerId'] },
    { fields: ['verificationStatus'] }
  ]
});

// Listing Model - The Marketplace Offerings
const Listing = sequelize.define('Listing', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  domainId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Domains',
      key: 'id'
    }
  },
  lessorId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  leaseType: {
    type: DataTypes.ENUM('fixed', 'auction', 'rent_to_own'),
    defaultValue: 'fixed'
  },
  priceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  priceCurrency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  durationDays: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  restrictions: {
    type: DataTypes.TEXT
  },
  description: {
    type: DataTypes.TEXT
  },
  tags: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: []
  },
  status: {
    type: DataTypes.ENUM('active', 'leased', 'expired', 'cancelled'),
    defaultValue: 'active'
  },
  nftContractAddress: {
    type: DataTypes.STRING(42)
  },
  nftTokenId: {
    type: DataTypes.STRING(78)
  },
  qrCodeUrl: {
    type: DataTypes.STRING(500)
  },
  viewsCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  featured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['domainId'] },
    { fields: ['lessorId'] },
    { fields: ['status'] },
    { fields: ['priceAmount'] }
  ]
});

// Lease Model - The Active Agreements
const Lease = sequelize.define('Lease', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  listingId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Listings',
      key: 'id'
    }
  },
  lesseeId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  paymentAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  paymentCurrency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  agreementUrl: {
    type: DataTypes.STRING(500)
  },
  nftTransferredAt: {
    type: DataTypes.DATE
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'terminated', 'disputed'),
    defaultValue: 'active'
  },
  escrowTxHash: {
    type: DataTypes.STRING
  },
  autoRenew: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['listingId'] },
    { fields: ['lesseeId'] },
    { fields: ['status'] },
    { fields: ['endDate'] }
  ]
});

// Transaction Model - The Payment Trail
const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  leaseId: {
    type: DataTypes.UUID,
    references: {
      model: 'Leases',
      key: 'id'
    }
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  type: {
    type: DataTypes.ENUM('lease_payment', 'platform_fee', 'refund', 'withdrawal'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(10),
    defaultValue: 'USD'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.STRING(50)
  },
  paymentProvider: {
    type: DataTypes.STRING(50)
  },
  txHash: {
    type: DataTypes.STRING
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['leaseId'] },
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

// InteractionHistory Model - The User Journey
const InteractionHistory = sequelize.define('InteractionHistory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  domainId: {
    type: DataTypes.UUID,
    references: {
      model: 'Domains',
      key: 'id'
    }
  },
  listingId: {
    type: DataTypes.UUID,
    references: {
      model: 'Listings',
      key: 'id'
    }
  },
  actionType: {
    type: DataTypes.ENUM('view', 'search', 'favorite', 'contact', 'lease_start'),
    allowNull: false
  },
  metadata: {
    type: DataTypes.JSONB,
    defaultValue: {}
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['actionType'] },
    { fields: ['createdAt'] }
  ]
});

// Define Associations
User.hasMany(Domain, { foreignKey: 'ownerId', as: 'domains' });
Domain.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

User.hasMany(Listing, { foreignKey: 'lessorId', as: 'listings' });
Listing.belongsTo(User, { foreignKey: 'lessorId', as: 'lessor' });

Domain.hasMany(Listing, { foreignKey: 'domainId', as: 'listings' });
Listing.belongsTo(Domain, { foreignKey: 'domainId', as: 'domain' });

User.hasMany(Lease, { foreignKey: 'lesseeId', as: 'leases' });
Lease.belongsTo(User, { foreignKey: 'lesseeId', as: 'lessee' });

Listing.hasMany(Lease, { foreignKey: 'listingId', as: 'leases' });
Lease.belongsTo(Listing, { foreignKey: 'listingId', as: 'listing' });

User.hasMany(Transaction, { foreignKey: 'userId', as: 'transactions' });
Transaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Lease.hasMany(Transaction, { foreignKey: 'leaseId', as: 'transactions' });
Transaction.belongsTo(Lease, { foreignKey: 'leaseId', as: 'lease' });

User.hasMany(InteractionHistory, { foreignKey: 'userId', as: 'interactions' });
InteractionHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = {
  sequelize,
  User,
  Domain,
  Listing,
  Lease,
  Transaction,
  InteractionHistory
};