// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ICBNetworkPrivateSale {

    address public owner;
    address public funderAddress;
    address public usdtTokenAddress;
    address public usdcTokenAddress;
    AggregatorV3Interface internal priceFeed =
        AggregatorV3Interface(0x694AA1769357215DE4FAC081bf1f309aDC325306);
 
    uint256 public saleStartTime;
    uint256 public saleEndTime;

    enum BuyType {
        eth,
        token
    }

    enum SaleType {
        defaultSale, // which show sell is stop
        privateSale  // sale is open as private
    }

    SaleType public currentSaleType; // to check current sale 

    struct Package {
        uint256 icbPerDollar; // icb in dollar ex: 0.0001 USD we have to pass 1000 as a input
        uint8 lockMonthTime; // lock month time ex: 6
        uint8 linearVestingTime; //linear vesting time ex: 3
    }

    struct  UserDeposit {
        uint256 packageAmount;   // package amount in dollar ex: 1000 ==1000$ , 300000 == 30000$
        uint256 userIcbAmount;   // user estimate icb
        uint256 icbInDollar;     // icb rate in dollar
        uint256 investTime;      // user invest time
        uint8 lockMonthTime;     // user lock time
        uint8 linearVestingTime; // user linear vesting time
    }

    mapping(uint256 => Package) public packages; // PackAmount => Package
    mapping(address => UserDeposit) public userDeposits; // userAddress => UserDeposit

    modifier onlyOwner() {
        require(owner == msg.sender, "You are not the Owner !");
        _;
    }

    modifier tokenCheck(address tokenAddress) {
        require(tokenAddress == usdtTokenAddress || tokenAddress == usdcTokenAddress , "Unsupported token");
        _;
    }

    modifier packageAmountCheck(uint256 packageAmount) {
        require(packageAmount == 1000 || packageAmount == 5000 || packageAmount == 10000 || packageAmount == 30000 , "Invalid package amount" );      
        _;
    }

    modifier privateSaleBuyCheck(address user) {
        require(userDeposits[msg.sender].packageAmount >= 1000, "Already bought a package");
        _;
    }
    
    modifier privateSaleCheck() {
        require(currentSaleType == SaleType.privateSale, "Already bought a package");
        require(block.timestamp > saleStartTime && saleEndTime > block.timestamp," Sale is not started or sale is ended");
        _;
    }

    modifier isContractCall(address _account) {
        require(!isContract(_account), "Contract Address");
        _;
    }

    // Modifiers can take inputs. This modifier checks that the
    // address passed in is not the zero address.
    modifier validAddress(address _addr) {
        require(_addr != address(0), "Not valid address");
        _;
    }
    
    constructor(address contractOwner, address funderWallet, address usdtAddress, address usdcAddress) validAddress(funderWallet) validAddress(usdtAddress) validAddress(usdcAddress) {
        owner = contractOwner;
        funderAddress = funderWallet;
        usdtTokenAddress = usdtAddress;
        usdcTokenAddress = usdcAddress;
    }

    /**** OnlyOwner ****/
    
    /// @notice To configure the private sale
    /// @param setSaletype To set the private sale type which is 1
    /// @param saleStart The private sale start time
    /// @param saleEnd The private sale end time
    function configPrivateSale(SaleType setSaletype, uint256 saleStart, uint256 saleEnd) external onlyOwner returns(bool) {
        currentSaleType = setSaletype;
        saleStartTime = saleStart;
        saleEndTime = saleEnd;
        return true;
    }

    /// @notice To add the availabe 4 package
    /// @param packageAmount The packageAmount in dollar which user going to buy 
    /// @param lockMonthTime The lock month for the investment
    /// @param linearVestingTime The linear vesting month
    function addPackage(uint256 packageAmount, uint256 icbPerDollar, uint8 lockMonthTime, uint8 linearVestingTime) external onlyOwner packageAmountCheck(packageAmount) returns(bool){
        require(packages[packageAmount].icbPerDollar == 0 , "Package already exist");
        Package storage p = packages[packageAmount];
        p.icbPerDollar = icbPerDollar;
        p.lockMonthTime = lockMonthTime;
        p.linearVestingTime = linearVestingTime;
        return true;
    }

    /// @notice To turn off/on the sale status
    /// @param setSaleStatus To set sale off we have to pass: 0 and for start the sale pass 1
    function toggleSale(SaleType setSaleStatus) external onlyOwner {
        currentSaleType = setSaleStatus;
    }
     
    /**** Public Functions ****/

    /// @dev Function to get the live eth price
    function getNativePrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /// @notice To calculate the estimate fund for token and icb 
    /// @param packageAmount The exact package amount which is set for private sale
    function estimatePrivateSaleFund(uint256 packageAmount, BuyType buyType) public view returns(uint256, uint256){
        uint256 icbDollar = packages[packageAmount].icbPerDollar;
        if(BuyType.eth == buyType){
            // int256 liveprice = getNativePrice() * 10 ** 10;
            int256 liveprice = 223512014065 * 10 ** 10; // for testing purpose I used the hardcoded value
            uint256 dollarAmount = packageAmount * 10**18 * 10**18;
            uint256 ethInDollar = (dollarAmount) / uint256(liveprice) ;
            uint256 icbAmount = (packageAmount * 10**7 ) / icbDollar;
            return (ethInDollar, icbAmount);
        }
        if(BuyType.token == buyType){
            uint256 tokenAmount = packageAmount * (10**6); // 6 for token decimal on ethereum both token having 6 decimal value
            uint256 icbAmount = (packageAmount * 10**7) / icbDollar;
            return (tokenAmount, icbAmount); 
        }
        return (0,0);    
    }
                                               
    /// @notice This function used in private sale for buying the ICB using both token(USDT, USDC)
    /// @param packageAmount The exact package amount which is set for private sale
    /// @param tokenAddress The token address from which user can buy
    function payWithToken(uint256 packageAmount, address tokenAddress) external privateSaleCheck tokenCheck(tokenAddress) packageAmountCheck(packageAmount) privateSaleBuyCheck(msg.sender) isContractCall(msg.sender) returns(bool){
        Package memory p = packages[packageAmount];
        uint256 estimatedToken;
        uint256 icbAmount;
        (estimatedToken, icbAmount) = estimatePrivateSaleFund(packageAmount, BuyType.token); // 6 for token decimal on ethereum both token having 6 decimal value
        internalDeposit(msg.sender, packageAmount, icbAmount, p.icbPerDollar , block.timestamp, p.lockMonthTime, p.linearVestingTime);
        IERC20(tokenAddress).transferFrom(msg.sender, funderAddress, estimatedToken);
        return true;
    }

    /// @notice This function used in private sale for buying the ICB using native currency
    /// @param packageAmount The exact package amount which is set for private sale
    function payWithNative(uint256 packageAmount) external payable privateSaleCheck packageAmountCheck(packageAmount) privateSaleBuyCheck(msg.sender) isContractCall(msg.sender) returns(bool){
        Package memory p = packages[packageAmount];
        uint256 estimatedNative;
        uint256 icbAmount;
        (estimatedNative, icbAmount) = estimatePrivateSaleFund(packageAmount, BuyType.eth);
        require(msg.value >= estimatedNative, "Insufficient Native value");
        internalDeposit(msg.sender, packageAmount, icbAmount, p.icbPerDollar , block.timestamp, p.lockMonthTime, p.linearVestingTime);
        payable(funderAddress).transfer(estimatedNative);
        return true;
    }
    
    /**** Internal ****/

    /// @dev function to update the user details
    function internalDeposit(address userAddress, uint256 packageAmount, uint256 userIcbAmount, uint256 icbInDollar, uint256 investTime, uint8 lockMonthTime, uint8 linearVestingTime) isContractCall(msg.sender) internal  {
        UserDeposit storage p = userDeposits[userAddress];
        p.packageAmount = packageAmount;
        p.userIcbAmount = userIcbAmount;
        p.icbInDollar = icbInDollar;
        p.investTime = investTime;
        p.lockMonthTime = lockMonthTime;
        p.linearVestingTime = linearVestingTime;
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}