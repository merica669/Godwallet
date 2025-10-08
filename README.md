# 🌟 Godwallet Backend

> *Where domains find their dreams and possibilities multiply like pixie dust*

Welcome to the **Imagineering** behind Godwallet - the invisible infrastructure that transforms beautiful frontend visions into living, breathing digital experiences. Like the underground tunnels at Disneyland that make the magic seamless, this backend is the technical marvel that powers dreams.

---

## ✨ The Vision

Godwallet is more than a marketplace - it's a **transformation platform** where dormant domain names become vehicles for ambitious projects, where ownership becomes fluid, and where blockchain technology meets human creativity. Just as Walt Disney saw beyond animation to create entire worlds, we see beyond domain registration to create possibilities.

**Our Mission:** Connect dreamers with the digital real estate that can launch their visions into reality.

---

## 🎨 Architecture Overview

```
godwallet-backend/
│
├── server.js                 # The beating heart
├── package.json              # The blueprint
├── .env.example              # Configuration template
│
├── models/                   # The memory palace
│   ├── index.js             # Database models & relationships
│   └── associations.js      # How everything connects
│
├── routes/                   # The pathways
│   ├── auth.js              # Identity & authentication
│   ├── domains.js           # Domain & listing operations
│   ├── leases.js            # Active agreements
│   ├── users.js             # Profile management
│   ├── verification.js      # Domain ownership verification
│   ├── nft.js               # Blockchain lease rights
│   └── ai.js                # AI-powered recommendations
│
├── middleware/               # The guardians
│   ├── auth.js              # Authentication & authorization
│   ├── errorHandler.js      # Graceful error handling
│   └── validation.js        # Input sanitization
│
├── contracts/                # The blockchain magic
│   ├── DomainLeaseNFT.sol   # Smart contract for NFT leases
│   └── Escrow.sol           # Payment escrow system
│
├── services/                 # The specialized craftspeople
│   ├── domainVerification.js # DNS/wallet verification
│   ├── emailService.js       # Notification system
│   ├── qrCodeGenerator.js    # QR code creation
│   ├── aiService.js          # AI recommendations
│   └── blockchainService.js  # Web3 interactions
│
├── scripts/                  # The automation elves
│   ├── migrate.js           # Database migrations
│   ├── seed.js              # Sample data
│   └── deploy.js            # Contract deployment
│
└── tests/                    # The quality assurance
    ├── auth.test.js
    ├── domains.test.js
    └── integration.test.js
```

---

## 🚀 Quick Start - Bring the Magic to Life

### Prerequisites

Like assembling the perfect animation team, you'll need:

- **Node.js** (v18+) - The foundation
- **PostgreSQL** (v14+) - The memory palace
- **Redis** (optional) - The speed boost
- **MetaMask** or similar - For web3 testing

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/godwallet-backend.git
cd godwallet-backend

# Install dependencies (gathering your creative team)
npm install

# Set up your environment
cp .env.example .env
# Edit .env with your configuration

# Create the database
createdb godwallet

# Run migrations (building the foundation)
npm run migrate

# Seed with sample data (optional)
npm run seed

# Start the development server
npm run dev

# ✨ The magic begins at http://localhost:5000
```

### First Steps Verification

```bash
# Test the heartbeat
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "message": "Godwallet backend is alive and dreaming!",
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

---

## 🎭 Core Features

### 1. **Two-Tier Magic System**

**Free Mode:** 
- Browse infinite possibilities
- Search with basic filters
- View domain details
- Generate QR codes

**Pro Mode:**
- AI-powered domain matching
- Personalized recommendations
- Priority listing visibility
- Advanced analytics
- Custom lease agreements

### 2. **Dual-World Support**

- **Web2 Domains:** Traditional .com, .io, .dev, etc.
- **Web3 Domains:** .eth, .crypto, and blockchain-native names
- Unified verification system for both worlds

### 3. **NFT Lease Rights**

Transform lease agreements into:
- Transferable blockchain assets
- Transparent, on-chain verification
- Secondary market liquidity
- Collateralization opportunities

### 4. **Intelligent Matching**

AI analyzes:
- User's business category
- Project goals & timeline
- Budget constraints
- Past browsing behavior
- Success patterns from similar users

### 5. **Security First**

- JWT-based authentication
- Bcrypt password hashing
- Rate limiting on all endpoints
- Input sanitization & validation
- Escrow for all transactions
- Encrypted data at rest

---

## 🔧 API Documentation

### Authentication

```javascript
// Register new user
POST /api/auth/register
{
  "email": "dreamer@example.com",
  "password": "SecurePass123!",
  "name": "Dream Builder",
  "accountType": "both"
}

// Login
POST /api/auth/login
{
  "email": "dreamer@example.com",
  "password": "SecurePass123!"
}

// Web3 wallet login
POST /api/auth/wallet-login
{
  "walletAddress": "0x...",
  "signature": "0x...",
  "message": "Sign this message to log into Godwallet"
}
```

### Domain Listings

```javascript
// Get all listings
GET /api/domains/listings?search=tech&type=web2&minPrice=100&maxPrice=1000

// Get single listing
GET /api/domains/listings/:id

// Create listing (authenticated)
POST /api/domains/listings
Authorization: Bearer <token>
{
  "domainName": "dreamforge.com",
  "domainType": "web2",
  "price": 299,
  "durationMonths": 6,
  "description": "Perfect for creative agencies",
  "restrictions": "No adult content",
  "tags": ["creative", "tech", "premium"]
}

// Update listing (authenticated, owner only)
PATCH /api/domains/listings/:id
Authorization: Bearer <token>
{
  "price": 349,
  "description": "Updated description"
}
```

### AI Recommendations (Pro Only)

```javascript
// Get personalized recommendations
GET /api/domains/recommendations
Authorization: Bearer <token>

// Response includes match scores and reasoning
```

---

## 🌐 Smart Contract Deployment

### Testnet Deployment (Sepolia)

```bash
# Configure hardhat.config.js with your settings
npx hardhat compile

# Deploy to Sepolia
npx hardhat run scripts/deploy.js --network sepolia

# Verify contract on Etherscan
npx hardhat verify --network sepolia DEPLOYED_ADDRESS TREASURY_ADDRESS
```

### Contract Interaction

```javascript
// Mint a lease NFT
const lease = await contract.mintLease(
  lessorAddress,
  lesseeAddress,
  "dreamforge.com",
  startDate,
  endDate,
  priceInWei,
  "No content modification",
  "QmIPFShash...",
  "https://metadata.godwallet.com/lease/1"
);
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test suite
npm test -- auth.test.js

# Integration tests
npm run test:integration
```

---

## 🚢 Deployment

### Production Checklist

- [ ] Environment variables configured
- [ ] Database backed up
- [ ] Smart contracts audited
- [ ] SSL certificates installed
- [ ] Rate limiting configured
- [ ] Monitoring setup (Sentry, etc.)
- [ ] CDN configured for assets
- [ ] Redis cache enabled
- [ ] Email service tested
- [ ] Payment processors verified

### Deploy to Production

```bash
# Build optimized version
npm run build

# Start production server
NODE_ENV=production npm start

# Or use PM2 for process management
pm2 start server.js --name godwallet-backend
```

---

## 🎯 Roadmap - The Journey Ahead

### Phase 1: Foundation (Months 1-2) ✅
- [x] Core API endpoints
- [x] Database models
- [x] Authentication system
- [x] Basic domain verification

### Phase 2: Intelligence (Months 3-4) 🚧
- [ ] AI recommendation engine
- [ ] Advanced search algorithms
- [ ] User behavior analytics
- [ ] Smart pricing suggestions

### Phase 3: Web3 Integration (Months 5-6) 📋
- [ ] NFT minting flow
- [ ] Escrow smart contracts
- [ ] Multi-chain support
- [ ] Secondary NFT marketplace

### Phase 4: Scale (Months 7-8) 📋
- [ ] Mobile API optimization
- [ ] Real-time notifications
- [ ] Advanced analytics dashboard
- [ ] API for third-party integrations

### Phase 5: Innovation (Months 9+) 🌟
- [ ] AI-generated lease agreements
- [ ] Predictive domain valuation
- [ ] Social features (domain communities)
- [ ] DAO governance model

---

## 🤝 Contributing

We believe in the power of collaboration - like the animation teams that brought classic films to life!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

**Coding Standards:**
- Follow ESLint configuration
- Write tests for new features
- Document API changes
- Use meaningful commit messages

---

## 📚 Additional Resources

- [API Documentation](https://docs.godwallet.com/api)
- [Smart Contract Docs](https://docs.godwallet.com/contracts)
- [Architecture Deep Dive](https://docs.godwallet.com/architecture)
- [Security Best Practices](https://docs.godwallet.com/security)
- [Contributing Guide](CONTRIBUTING.md)

---

## 🐛 Troubleshooting

### Common Issues

**Database connection fails:**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Verify credentials in .env
# Ensure database exists
createdb godwallet
```

**JWT token errors:**
```bash
# Ensure JWT_SECRET is set in .env
# Check token expiration settings
# Verify Authorization header format: "Bearer <token>"
```

**Smart contract deployment fails:**
```bash
# Check wallet has sufficient funds for gas
# Verify RPC URL is correct
# Ensure private key is properly formatted
```

---

## 📄 License

MIT License - Build with freedom, create with joy!

---

## 💖 Acknowledgments

To every dreamer who believes domains can be more than addresses - they can be launching pads for ambition, bridges to opportunity, and vessels for vision.

Like Walt Disney said: *"It's kind of fun to do the impossible."*

**Let's make the impossible possible, one domain at a time.** ✨

---

## 📞 Support

- **Email:** support@godwallet.com
- **Discord:** [Join our community](https://discord.gg/godwallet)
- **Twitter:** [@godwallet](https://twitter.com/godwallet)
- **Documentation:** [docs.godwallet.com](https://docs.godwallet.com)

---

<div align="center">

**Built with 💜 by dreamers, for dreamers**

*Where imagination meets infrastructure*

[Website](https://godwallet.com) • [Docs](https://docs.godwallet.com) • [Blog](https://blog.godwallet.com)

</div>