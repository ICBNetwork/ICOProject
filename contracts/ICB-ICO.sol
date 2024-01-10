// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ICB_ICO is ReentrancyGuard {
    
    // comman variable in(private, preSale1, preSale2, public) sales
    address public owner;
    address public funderAddress;
    address public usdtTokenAddress;
    address public usdcTokenAddress;
    AggregatorV3Interface internal priceFeed;
    uint256 public saleStartTime;
    uint256 public saleEndTime;
    uint256 public baseMultiplier;
    uint8 public tokenDecimal; 

    // private sale variable
    uint256 public totalSoldInPrivateSale; // for storing the private sale ICB amount

    // preSale1 variable
    uint256 public totalSoldInPreSale1; // for storing the presale sale 1 ICB amount

    // preSale2 variable
    uint256 public totalSoldInPreSale2; // for storing the presale sale 2 ICB amount

    // public sale variable
    uint256 public totalSoldInPublicSale; // for storing the public sale ICB amount

    // comman variable in(preSale1, preSale2, and private) sales
    uint256 public nextDateTimestamp;
    uint256 public icbDollarInPrePublic; // This price will update per day basic
    uint256 public incrementPriceEveryDay; // code is configure like 100 == 0.00001 , 1000 == 0.0001
    uint8 public lockMonth; // We are storing this for pre(1,2) and public sale
    uint8 public vestingMonth; // We are storing this for pre(1,2) and public sale
    
    enum BuyType {
        eth,
        token
    }

    enum SaleType {
        saleNotActive,
        privateSale,
        preSale1,
        preSale2,
        publicSale
    }

    SaleType public currentSaleType; // to check current sale 

    struct Package {
        uint256 icbPerDollar; // icb in dollar ex: 0.0001 USD we have to pass 1000 as a input
        uint8 lockMonthTime; // lock month time ex: 6
        uint8 linearVestingTime; //linear vesting time ex: 3
    }

    struct UserDeposit {
        uint256 packageAmount;   // package amount in dollar ex: 1000 ==1000$ , 300000 == 30000$
        uint256 userIcbAmount;   // user estimate icb
        uint256 icbInDollar;     // icb rate in dollar
        uint256 investTime;      // user invest time
        uint8 lockMonthTime;     // user lock time
        uint8 linearVestingTime; // user linear vesting time
        SaleType saleType;       // store sale phase type
    }

    mapping(uint256 => Package) public packages; // PackAmount => Package
    mapping(address => UserDeposit[]) private userDeposits; // userAddress => UserDeposit
    mapping(address => uint256) public userReferralReward; // userAddress => rewardAmount
    mapping(address => bool) public icbInvestors;

    event FundTransfer(address indexed user, uint256 packageAmounts, uint256 userIcbAmounts, uint256 investTime, uint256 lockMonthTime, uint256 linearVestingTime, SaleType currentSalePhase);
    event ConfigPrePublicSale(SaleType setSaletype, uint256 salePriceInDollar, uint256 everyDayIncreasePrice, uint256 saleStart, uint256 saleEnd, uint8 lockMonths, uint8 vestingMonths);
    event UpdateLockAndVestingMonth(uint8 lockMonths, uint8 vestingMonths);

    modifier onlyOwner() {
        require(owner == msg.sender, "You are not the Owner");
        _;
    }

    modifier packageAmountCheck(uint256 packageAmount) {
        require(packageAmount == 1000 || packageAmount == 5000 || packageAmount == 10000 || packageAmount == 30000 , "Invalid package amount" );      
        _;
    }
    
    modifier tokenCheck(address tokenAddress) {
        require(tokenAddress == usdtTokenAddress || tokenAddress == usdcTokenAddress , "Unsupported token");
        _;
    }

    modifier privateSaleBuyCheck(address user) {
        require(userDeposits[msg.sender].length < 1, "Already bought a package");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Not valid address");
        _;
    }
    
    modifier isContractCall(address _account) {
        require(!isContract(_account), "Contract Address");
        _;
    }

    modifier privateSaleCheck() {
        require(currentSaleType == SaleType.privateSale, "Sale type is not matched");
        require(block.timestamp > saleStartTime && saleEndTime > block.timestamp," Sale is not started or sale is ended");
        _;
    }
    
    modifier preSalesCheck() {
        require(currentSaleType == SaleType.preSale1 || currentSaleType == SaleType.preSale2 , "Sale type is not matched");
        require(block.timestamp > saleStartTime && saleEndTime > block.timestamp," Sale is not started or sale is ended");
        _;
    }

    modifier publicSalesCheck() {
        require(currentSaleType == SaleType.publicSale, "Sale type is not matched");
        require(block.timestamp > saleStartTime ," Sale is not started"); // We are not comparing the end time because in public sale owner can end the sale anytime as they want.
        _;
    }
    
    /// @param funderWallet The wallet on which we are transfering the fund
    /// @param usdtAddress The usdt token from which user will pay
    /// @param usdcAddress The usdc address from which user will pay 
    /// @param nativeAggreators The native Aggreators from which we will get the live native currency price
    /// @param tokenDecimals The token(usdt and usdc) decimal which required to calculate the fund, on the ETH(USDT and USDC is 6), BNB((USDT and USDC is 18), Matic((USDT and USDC is 6) 
    /// @param setSaletype To set the private sale type which is 1
    /// @param saleStart The private sale start time
    /// @param saleEnd The private sale end time
    constructor(address funderWallet, address usdtAddress, address usdcAddress, address nativeAggreators, uint8 tokenDecimals, SaleType setSaletype, uint256 saleStart, uint256 saleEnd) validAddress(funderWallet) validAddress(usdtAddress) validAddress(usdcAddress) {
        require(saleStart > block.timestamp && saleEnd > saleStart ,"End time must be greater than start time");
        owner = msg.sender;
        funderAddress = funderWallet;
        usdtTokenAddress = usdtAddress;
        usdcTokenAddress = usdcAddress;
        tokenDecimal = tokenDecimals; 
        priceFeed = AggregatorV3Interface(nativeAggreators);
        currentSaleType = setSaletype;
        saleStartTime = saleStart;
        saleEndTime = saleEnd;
        baseMultiplier = 10_000_000;
        addPackage(1000, 2000, 6, 6);
        addPackage(5000, 1800, 6, 3);
        addPackage(10000, 1500, 3, 3);
        addPackage(30000, 1000, 1, 3);
    }

    /**** OnlyOwner ****/
    
    /// @notice This function is used by admin to update the user data who did the payment using card
    function addUserByAdmin(address[] memory userAddress, uint256[] memory packageAmount, uint256[] memory userIcbAmount, uint256[] memory icbInDollar, uint256[] memory investTime, uint8[] memory lockMonthTime, uint8[] memory linearVestingTime, SaleType[] memory currentSaleTypes) external onlyOwner returns(bool) {
        for(uint256 i=0; i <= userAddress.length; i++){
        internalDeposit(userAddress[i], packageAmount[i], userIcbAmount[i], icbInDollar[i], investTime[i], lockMonthTime[i], linearVestingTime[i], currentSaleTypes[i]);
        }
        return true;
    }
    
    /// @notice To update the lock and vesting time by owner
    /// @param lockMonths The lock month time which is going to use in pre1, pre2, and public sale
    /// @param vestingMonths The vesting month time which is going to use in pre1, pre2, and public sale
    function updateLockAndVestingMonth(uint8 lockMonths, uint8 vestingMonths) external onlyOwner {
        lockMonth = lockMonths;
        vestingMonth = vestingMonths;
        emit UpdateLockAndVestingMonth(lockMonths, vestingMonths);
    }

    /// @notice To turn off/on the sale status
    /// @param setSaleStatus To set sale off we have to pass: 0 and to open the sale pass the saleType as required : 1,2,3, and 4
    function toggleSale(SaleType setSaleStatus) external onlyOwner {
        currentSaleType = setSaleStatus;
    }
    
    /// @notice To configure the pre(1 and 2) and public sale 
    /// @param setSaletype To set the pre/public sale type ex: for presale1 set 2, for presale2 set 3, and for public sale set 4
    /// @param saleStart The sale start time
    /// @param saleEnd The sale end time
    /// @param lockMonths The lock month accordingly 
    /// @param vestingMonths The vesting month accordingly
    function configPrePublicSale(SaleType setSaletype, uint256 salePriceInDollar, uint256 everyDayIncreasePrice, uint256 saleStart, uint256 saleEnd, uint8 lockMonths, uint8 vestingMonths) external onlyOwner returns(bool) {
        currentSaleType = setSaletype;
        icbDollarInPrePublic = salePriceInDollar;
        incrementPriceEveryDay =  everyDayIncreasePrice;
        saleStartTime = saleStart;
        saleEndTime = saleEnd;
        lockMonth = lockMonths;
        vestingMonth = vestingMonths;
        getTimestampOfNextDate();
        emit ConfigPrePublicSale(setSaletype, salePriceInDollar, everyDayIncreasePrice, saleStart, saleEnd, lockMonths, vestingMonths);
        return true;
    }

    /// @dev To add the availabe 4 package
    /// @param packageAmount The packageAmount in dollar which user going to buy 
    /// @param lockMonthTime The lock month for the investment
    /// @param linearVestingTime The linear vesting month
    function addPackage(uint256 packageAmount, uint256 icbPerDollar, uint8 lockMonthTime, uint8 linearVestingTime) internal {
        Package storage privateSalePackage = packages[packageAmount];
        privateSalePackage.icbPerDollar = icbPerDollar;
        privateSalePackage.lockMonthTime = lockMonthTime;
        privateSalePackage.linearVestingTime = linearVestingTime;
    }

    /// @notice This function is used for withdraw the token from contract if user pay via direct transfer
    /// @param tokenAddress The token contract address 
    /// @param tokenAmount The exact amount which is availabe on contract address, we have to pass tokenAmount in wei
    function getTokenFromContract(address tokenAddress, uint256 tokenAmount) external onlyOwner returns(bool){
        IERC20 token = IERC20(tokenAddress);
        require(token.balanceOf(address(this)) >= tokenAmount, "Insufficient token");
        token.transfer(funderAddress, tokenAmount);
        return true;
    }
    
    /// @notice This is used to withdaw the native token if user pay directly
    /// @param nativeAmount The exact amount availabe on contract
    function getNativeTokenFromContract(uint256 nativeAmount) external onlyOwner returns(bool){
        require(address(this).balance >= nativeAmount, "Insufficient native token");
        payable(funderAddress).transfer(nativeAmount);
        return true;
    }
       
    /**** Public Functions ****/

    /// @dev Function to get the live native token price
    function getNativePrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }
    
    /** Private Sale **/

    /// @notice To calculate the estimate fund for token and icb 
    /// @param packageAmount The exact package amount which is set for private sale
    function estimatePrivateFund(uint256 packageAmount, BuyType buyType) public view returns(uint256, uint256){
        uint256 icbDollar = packages[packageAmount].icbPerDollar;
        if(BuyType.eth == buyType){
            // int256 liveprice = getNativePrice() * 10 ** 10;
            int256 liveprice = 229633671342 * 10 ** 10; // for testing purpose I used the hardcoded value
            uint256 dollarAmount = packageAmount * 10**18 * 10**18;
            uint256 ethInDollar = (dollarAmount) / uint256(liveprice) ;
            uint256 icbAmount = (packageAmount * baseMultiplier) / icbDollar;
            return (ethInDollar, icbAmount);
        }
        if(BuyType.token == buyType){
            uint256 tokenAmount = packageAmount * (10**tokenDecimal);
            uint256 icbAmount = (packageAmount * baseMultiplier) / icbDollar;
            return (tokenAmount, icbAmount); 
        }
        return (0,0);    
    }

    /// @notice To calculate the estimate fund for token and icb 
    /// @param packageAmount The exact package amount which is set for private sale
    function estimatePrePublicFund(uint256 packageAmount, BuyType buyType) public view returns(uint256, uint256){
        if(BuyType.eth == buyType){
            int256 liveprice = getNativePrice() * 10 ** 10;
            // int256 liveprice = 229633671342 * 10 ** 10; // for testing purpose I used the hardcoded value
            uint256 dollarAmount = packageAmount * 10**18 * 10**18;
            uint256 ethInDollar = (dollarAmount) / uint256(liveprice) ;
            uint256 icbAmount = (packageAmount * baseMultiplier) / icbDollarInPrePublic;
            return (ethInDollar, icbAmount);
        }
        if(BuyType.token == buyType){
            uint256 tokenAmount = packageAmount * (10**tokenDecimal); 
            uint256 icbAmount = (packageAmount * baseMultiplier) / icbDollarInPrePublic;
            return (tokenAmount, icbAmount); 
        }
        return (0,0);    
    }
                                               
    /// @notice This function used in private sale for buying the ICB using both token(USDT, USDC)
    /// @param packageAmount The exact package amount which is set for private sale
    /// @param tokenAddress The token address from which user can buy
    function payWithTokenInPrivate(uint256 packageAmount, address tokenAddress) external nonReentrant isContractCall(msg.sender) privateSaleCheck tokenCheck(tokenAddress) packageAmountCheck(packageAmount) privateSaleBuyCheck(msg.sender) returns(bool){
        Package memory privateSalePackage = packages[packageAmount];
        uint256 estimatedToken;
        uint256 icbAmount;
        (estimatedToken, icbAmount) = estimatePrivateFund(packageAmount, BuyType.token);
        require(IERC20(tokenAddress).allowance(msg.sender, address(this)) >= estimatedToken, "Insufficient allowance");
        internalDeposit(msg.sender, packageAmount, icbAmount, privateSalePackage.icbPerDollar , block.timestamp, privateSalePackage.lockMonthTime, privateSalePackage.linearVestingTime, currentSaleType);
        internalSalePhaseAmount(icbAmount);
        IERC20(tokenAddress).transferFrom(msg.sender, funderAddress, estimatedToken);
        emit FundTransfer(msg.sender, packageAmount, icbAmount, block.timestamp, privateSalePackage.lockMonthTime , privateSalePackage.linearVestingTime, currentSaleType);
        return true;
    }

    /// @notice This function used in private sale for buying the ICB using native token
    /// @param packageAmount The exact package amount which is set for private sale
    function payWithNativeInPrivate(uint256 packageAmount) external payable nonReentrant isContractCall(msg.sender) privateSaleCheck packageAmountCheck(packageAmount) privateSaleBuyCheck(msg.sender) returns(bool){
        Package memory privateSalePackage = packages[packageAmount];
        uint256 estimatedNative;
        uint256 icbAmount;
        (estimatedNative, icbAmount) = estimatePrivateFund(packageAmount, BuyType.eth);
        require(msg.value >= estimatedNative, "Insufficient Native value");
        internalDeposit(msg.sender, packageAmount, icbAmount, privateSalePackage.icbPerDollar , block.timestamp, privateSalePackage.lockMonthTime, privateSalePackage.linearVestingTime, currentSaleType);
        internalSalePhaseAmount(icbAmount);
        payable(funderAddress).transfer(estimatedNative);
        emit FundTransfer(msg.sender, packageAmount, icbAmount, block.timestamp, privateSalePackage.lockMonthTime , privateSalePackage.linearVestingTime, currentSaleType);
        return true;
    }

    /** PreSale (Phase 1 and 2)**/

    /// @notice This function used in private sale for buying the ICB using both token(USDT, USDC)
    /// @param packageAmount The packageAmount in usd 
    /// @param tokenAddress The token address from which user can buy
    function payWithTokenInPresale(uint256 packageAmount, address tokenAddress) external nonReentrant isContractCall(msg.sender) tokenCheck(tokenAddress) preSalesCheck returns(bool){
        uint256 estimatedToken;
        uint256 icbAmount;
        (estimatedToken, icbAmount) = estimatePrePublicFund(packageAmount, BuyType.token);
        require(IERC20(tokenAddress).allowance(msg.sender, address(this)) >= estimatedToken, "Insufficient allowance");
        internalDeposit(msg.sender, packageAmount, icbAmount, icbDollarInPrePublic , block.timestamp, lockMonth, vestingMonth, currentSaleType);
        internalSalePhaseAmount(icbAmount);
        calPerDayIcbDollar();
        IERC20(tokenAddress).transferFrom(msg.sender, funderAddress, estimatedToken);
        emit FundTransfer(msg.sender, packageAmount, icbAmount, block.timestamp, lockMonth , vestingMonth, currentSaleType);
        return true;
    }

    /// @notice This function used in presale sale for buying the ICB using Native token
    /// @param packageAmount The packageAmount in usd 
    function payWithNativeInPresale(uint256 packageAmount) external payable nonReentrant isContractCall(msg.sender) preSalesCheck returns(bool){
        uint256 estimatedNative;
        uint256 icbAmount;
        (estimatedNative, icbAmount) = estimatePrePublicFund(packageAmount, BuyType.eth);
        require(msg.value >= estimatedNative, "Insufficient Native value");
        internalDeposit(msg.sender, packageAmount, icbAmount, icbDollarInPrePublic, block.timestamp, lockMonth, vestingMonth, currentSaleType);
        internalSalePhaseAmount(icbAmount);
        calPerDayIcbDollar();
        payable(funderAddress).transfer(estimatedNative);
        emit FundTransfer(msg.sender, packageAmount, icbAmount, block.timestamp, lockMonth , vestingMonth, currentSaleType);
        return true;
    }

    /** Public **/

    /// @notice This function used in public sale for buying the ICB using both token(USDT, USDC)
    /// @param packageAmount The packageAmount in usd 
    /// @param isReferral This is used to tell that user is paying with referralAddress if isReferral is true otherwise we are skiping this part in calculation
    /// @param referralAddress The referral address which must be our investor ealier in any sale
    /// @param tokenAddress The token address from which user can buy
    function payWithTokenInPublic(uint256 packageAmount, bool isReferral, address referralAddress, address tokenAddress) external nonReentrant isContractCall(msg.sender) publicSalesCheck tokenCheck(tokenAddress) returns(bool){
        uint256 estimatedToken;
        uint256 icbAmount;
        (estimatedToken, icbAmount) = estimatePrePublicFund(packageAmount, BuyType.token);
        require(IERC20(tokenAddress).allowance(msg.sender, address(this)) >= estimatedToken, "Insufficient allowance");
        uint256 exactBuyerIcbAmt;
        if(isReferral){
            require(icbInvestors[referralAddress], "Referral Address not invested ealier");
            uint256 buyerActualICB = (icbAmount *99)/100;
            uint256 referralAmount = icbAmount - buyerActualICB;
            userReferralReward[referralAddress] += referralAmount;
            exactBuyerIcbAmt = buyerActualICB;
            internalDeposit(msg.sender, packageAmount, buyerActualICB, icbDollarInPrePublic, block.timestamp, lockMonth, vestingMonth, currentSaleType);
        }
        else{
            exactBuyerIcbAmt = icbAmount;
            internalDeposit(msg.sender, packageAmount, icbAmount, icbDollarInPrePublic, block.timestamp, lockMonth, vestingMonth, currentSaleType);
        }
        internalSalePhaseAmount(icbAmount);
        calPerDayIcbDollar();    
        IERC20(tokenAddress).transferFrom(msg.sender, funderAddress, estimatedToken);
        emit FundTransfer(msg.sender, packageAmount, exactBuyerIcbAmt, block.timestamp, lockMonth , vestingMonth, currentSaleType);
        return true;
    }
    
    /// @notice This function used in public sale for buying the ICB using native currency
    /// @param packageAmount The packageAmount in usd 
    /// @param isReferral This is used to tell that user is paying with referralAddress if isReferral is true otherwise we are skiping this part in calculation
    /// @param referralAddress The referral address which must be our investor ealier in any sale
    function payWithNativeInPublic(uint256 packageAmount, bool isReferral, address referralAddress) external payable nonReentrant isContractCall(msg.sender) publicSalesCheck returns(bool){
        uint256 estimatedNative;
        uint256 icbAmount;
        (estimatedNative, icbAmount) = estimatePrePublicFund(packageAmount, BuyType.eth);
        require(msg.value >= estimatedNative, "Insufficient Native value");
        uint256 exactBuyerIcbAmt;
        if(isReferral){
            require(icbInvestors[referralAddress], "Referral Address not invested ealier");
            uint256 buyerActualICB = (icbAmount *99)/100;
            uint256 referralAmount = icbAmount - buyerActualICB;
            userReferralReward[referralAddress] += referralAmount;
            exactBuyerIcbAmt = buyerActualICB;
            internalDeposit(msg.sender, packageAmount, buyerActualICB, icbDollarInPrePublic, block.timestamp, lockMonth, vestingMonth, currentSaleType);
        }else{
            exactBuyerIcbAmt = icbAmount;
            internalDeposit(msg.sender, packageAmount, icbAmount, icbDollarInPrePublic, block.timestamp, lockMonth, vestingMonth, currentSaleType );
        }
        internalSalePhaseAmount(icbAmount);
        calPerDayIcbDollar();
        payable(funderAddress).transfer(estimatedNative);
        emit FundTransfer(msg.sender, packageAmount, exactBuyerIcbAmt, block.timestamp, lockMonth , vestingMonth, currentSaleType);
        return true;
    }   
    
    /// @notice To get the user invest details
    /// @param userAddress The user address from which we need the details
    function getUserDetails(address userAddress) external view returns (UserDeposit[] memory) {
        return userDeposits[userAddress];
    }
    
    /**** Internal ****/

    function internalSalePhaseAmount(uint256 icbAmount) internal {
        if(SaleType.privateSale == currentSaleType){
            totalSoldInPrivateSale += icbAmount;
        }
        if(SaleType.preSale1 == currentSaleType){
            totalSoldInPreSale1 += icbAmount;
        }
        if(SaleType.preSale2 == currentSaleType){
            totalSoldInPreSale2 += icbAmount;           
        }
        if(SaleType.publicSale == currentSaleType){
            totalSoldInPublicSale += icbAmount;           
        }
    } 

    /// @dev function to update the user details
    function internalDeposit(address userAddress, uint256 packageAmount, uint256 userIcbAmount, uint256 icbInDollar, uint256 investTime, uint8 lockMonthTime, uint8 linearVestingTime, SaleType currentSaleTypes) internal  {
        userDeposits[userAddress].push(UserDeposit(packageAmount, userIcbAmount, icbInDollar, investTime, lockMonthTime, linearVestingTime, currentSaleTypes));
        if(!icbInvestors[userAddress]){
            icbInvestors[userAddress] = true;
        }
    }
 
    function getTimestampOfNextDate() internal {
        nextDateTimestamp = (block.timestamp / 1 days + 1) * 1 days;
    
    }

    function calPerDayIcbDollar() internal  {   
        if(nextDateTimestamp <= block.timestamp) {
            icbDollarInPrePublic += incrementPriceEveryDay;
            getTimestampOfNextDate();
        }
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }

    receive() external payable {}
    
}
