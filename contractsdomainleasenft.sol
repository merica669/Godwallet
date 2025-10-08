// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title DomainLeaseNFT
 * @dev NFT contract for Godwallet domain lease rights
 * Each token represents a transferable lease agreement
 * Where blockchain meets dreams and domains find new homes
 */

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract DomainLeaseNFT is ERC721, ERC721URIStorage, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // Lease information structure
    struct LeaseInfo {
        string domainName;
        address lessor;
        address lessee;
        uint256 startDate;
        uint256 endDate;
        uint256 priceAmount;
        string restrictions;
        string agreementIpfsHash;
        bool active;
    }

    // Mapping from token ID to lease info
    mapping(uint256 => LeaseInfo) public leases;
    
    // Mapping from domain name to token ID
    mapping(string => uint256) public domainToToken;
    
    // Platform fee (in basis points, e.g., 500 = 5%)
    uint256 public platformFee = 500;
    
    // Godwallet treasury address
    address public treasury;

    // Events
    event LeaseCreated(
        uint256 indexed tokenId,
        string domainName,
        address indexed lessor,
        address indexed lessee,
        uint256 startDate,
        uint256 endDate
    );
    
    event LeaseTransferred(
        uint256 indexed tokenId,
        address indexed from,
        address indexed to
    );
    
    event LeaseTerminated(
        uint256 indexed tokenId,
        address indexed terminatedBy
    );

    constructor(address _treasury) ERC721("Godwallet Domain Lease", "GWDL") {
        treasury = _treasury;
    }

    /**
     * @dev Mint a new lease NFT
     * @param lessor The domain owner leasing out the domain
     * @param lessee The person leasing the domain
     * @param domainName The domain being leased
     * @param startDate Unix timestamp of lease start
     * @param endDate Unix timestamp of lease end
     * @param priceAmount Lease price in wei
     * @param restrictions Lease restrictions text
     * @param agreementIpfsHash IPFS hash of full lease agreement
     * @param tokenURI Metadata URI for the NFT
     */
    function mintLease(
        address lessor,
        address lessee,
        string memory domainName,
        uint256 startDate,
        uint256 endDate,
        uint256 priceAmount,
        string memory restrictions,
        string memory agreementIpfsHash,
        string memory tokenURI
    ) public onlyOwner returns (uint256) {
        require(bytes(domainName).length > 0, "Domain name required");
        require(lessee != address(0), "Invalid lessee address");
        require(endDate > startDate, "End date must be after start date");
        require(domainToToken[domainName] == 0, "Lease already exists for this domain");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        // Create lease info
        leases[newTokenId] = LeaseInfo({
            domainName: domainName,
            lessor: lessor,
            lessee: lessee,
            startDate: startDate,
            endDate: endDate,
            priceAmount: priceAmount,
            restrictions: restrictions,
            agreementIpfsHash: agreementIpfsHash,
            active: true
        });

        domainToToken[domainName] = newTokenId;

        // Mint NFT to lessee
        _safeMint(lessee, newTokenId);
        _setTokenURI(newTokenId, tokenURI);

        emit LeaseCreated(
            newTokenId,
            domainName,
            lessor,
            lessee,
            startDate,
            endDate
        );

        return newTokenId;
    }

    /**
     * @dev Get lease information for a token
     */
    function getLeaseInfo(uint256 tokenId) public view returns (LeaseInfo memory) {
        require(_exists(tokenId), "Token does not exist");
        return leases[tokenId];
    }

    /**
     * @dev Check if a lease is currently active
     */
    function isLeaseActive(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        LeaseInfo memory lease = leases[tokenId];
        return lease.active && 
               block.timestamp >= lease.startDate && 
               block.timestamp <= lease.endDate;
    }

    /**
     * @dev Check if a lease has expired
     */
    function isLeaseExpired(uint256 tokenId) public view returns (bool) {
        require(_exists(tokenId), "Token does not exist");
        return block.timestamp > leases[tokenId].endDate;
    }

    /**
     * @dev Terminate a lease early (only by lessor or contract owner)
     */
    function terminateLease(uint256 tokenId) public {
        require(_exists(tokenId), "Token does not exist");
        LeaseInfo storage lease = leases[tokenId];
        
        require(
            msg.sender == lease.lessor || msg.sender == owner(),
            "Only lessor or owner can terminate"
        );
        require(lease.active, "Lease already inactive");

        lease.active = false;
        emit LeaseTerminated(tokenId, msg.sender);
    }

    /**
     * @dev Override transfer to emit custom event and update lessee
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        super._transfer(from, to, tokenId);
        
        // Update lessee in lease info
        leases[tokenId].lessee = to;
        
        emit LeaseTransferred(tokenId, from, to);
    }

    /**
     * @dev Update platform fee (only owner)
     */
    function setPlatformFee(uint256 _fee) public onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        platformFee = _fee;
    }

    /**
     * @dev Update treasury address (only owner)
     */
    function setTreasury(address _treasury) public onlyOwner {
        require(_treasury != address(0), "Invalid treasury address");
        treasury = _treasury;
    }

    /**
     * @dev Withdraw platform fees (only owner)
     */
    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        
        (bool success, ) = treasury.call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Calculate platform fee for a given amount
     */
    function calculatePlatformFee(uint256 amount) public view returns (uint256) {
        return (amount * platformFee) / 10000;
    }

    // Required overrides for ERC721URIStorage
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
        
        // Clean up lease data
        string memory domain = leases[tokenId].domainName;
        delete domainToToken[domain];
        delete leases[tokenId];
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
     * @dev Get total number of leases minted
     */
    function totalLeases() public view returns (uint256) {
        return _tokenIds.current();
    }
}

/**
 * 🌟 Godwallet Smart Contract Architecture 🌟
 * 
 * This contract transforms domain leases into blockchain-verified assets.
 * Each NFT represents a living agreement - transferable, transparent, and trustless.
 * 
 * Like the first sketch that becomes a beloved character, this contract is the
 * foundation upon which dreams are built and domains find their destiny.
 * 
 * Key Features:
 * - ERC721 compliant NFTs representing lease rights
 * - Full lease information stored on-chain
 * - Transfer lease rights by transferring NFT
 * - Automatic expiration tracking
 * - IPFS integration for full agreements
 * - Platform fee mechanism for sustainability
 * 
 * Deployment:
 * 1. Deploy to testnet (Sepolia/Mumbai) first
 * 2. Verify contract on Etherscan/Polygonscan
 * 3. Test all functions thoroughly
 * 4. Audit before mainnet deployment
 * 5. Deploy to mainnet when ready for production
 * 
 * Magic happens at the intersection of code and dreams! ✨
 */