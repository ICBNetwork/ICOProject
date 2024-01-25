// SPDX-License-Identifier: MIT
// File: @chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol


pragma solidity ^0.8.0;

interface AggregatorV3Interface {
  function decimals() external view returns (uint8);

  function description() external view returns (string memory);

  function version() external view returns (uint256);

  function getRoundData(
    uint80 _roundId
  ) external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);

  function latestRoundData()
    external
    view
    returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound);
}

// File: @openzeppelin/contracts/utils/Context.sol


// OpenZeppelin Contracts (last updated v5.0.1) (utils/Context.sol)

pragma solidity ^0.8.20;

/**
 * @dev Provides information about the current execution context, including the
 * sender of the transaction and its data. While these are generally available
 * via msg.sender and msg.data, they should not be accessed in such a direct
 * manner, since when dealing with meta-transactions the account sending and
 * paying for execution may not be the actual sender (as far as an application
 * is concerned).
 *
 * This contract is only required for intermediate, library-like contracts.
 */
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }

    function _contextSuffixLength() internal view virtual returns (uint256) {
        return 0;
    }
}

// File: @openzeppelin/contracts/access/Ownable.sol


// OpenZeppelin Contracts (last updated v5.0.0) (access/Ownable.sol)

pragma solidity ^0.8.20;


/**
 * @dev Contract module which provides a basic access control mechanism, where
 * there is an account (an owner) that can be granted exclusive access to
 * specific functions.
 *
 * The initial owner is set to the address provided by the deployer. This can
 * later be changed with {transferOwnership}.
 *
 * This module is used through inheritance. It will make available the modifier
 * `onlyOwner`, which can be applied to your functions to restrict their use to
 * the owner.
 */
abstract contract Ownable is Context {
    address private _owner;

    /**
     * @dev The caller account is not authorized to perform an operation.
     */
    error OwnableUnauthorizedAccount(address account);

    /**
     * @dev The owner is not a valid owner account. (eg. `address(0)`)
     */
    error OwnableInvalidOwner(address owner);

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract setting the address provided by the deployer as the initial owner.
     */
    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby disabling any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

pragma solidity ^0.8.20;

abstract contract ReentrancyGuard {
    uint256 private constant NOT_ENTERED = 1;
    uint256 private constant ENTERED = 2;

    uint256 private _status;

    /**
     * @dev Unauthorized reentrant call.
     */
    error ReentrancyGuardReentrantCall();

    constructor() {
        _status = NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        // On the first call to nonReentrant, _status will be NOT_ENTERED
        if (_status == ENTERED) {
            revert ReentrancyGuardReentrantCall();
        }

        // Any calls to nonReentrant after this point will fail
        _status = ENTERED;
    }

    function _nonReentrantAfter() private {
        // By storing the original value once again, a refund is triggered (see
        // https://eips.ethereum.org/EIPS/eip-2200)
        _status = NOT_ENTERED;
    }

    /**
     * @dev Returns true if the reentrancy guard is currently set to "entered", which indicates there is a
     * `nonReentrant` function in the call stack.
     */
    function _reentrancyGuardEntered() internal view returns (bool) {
        return _status == ENTERED;
    }
}

// File: @openzeppelin/contracts/utils/Address.sol


// OpenZeppelin Contracts (last updated v5.0.0) (utils/Address.sol)

pragma solidity ^0.8.20;

/**
 * @dev Collection of functions related to the address type
 */
library Address {
    /**
     * @dev The ETH balance of the account is not enough to perform the operation.
     */
    error AddressInsufficientBalance(address account);

    /**
     * @dev There's no code at `target` (it is not a contract).
     */
    error AddressEmptyCode(address target);

    /**
     * @dev A call to an address target failed. The target may have reverted.
     */
    error FailedInnerCall();

    function sendValue(address payable recipient, uint256 amount) internal {
        if (address(this).balance < amount) {
            revert AddressInsufficientBalance(address(this));
        }

        (bool success, ) = recipient.call{value: amount}("");
        if (!success) {
            revert FailedInnerCall();
        }
    }

    function functionCall(address target, bytes memory data) internal returns (bytes memory) {
        return functionCallWithValue(target, data, 0);
    }

    function functionCallWithValue(address target, bytes memory data, uint256 value) internal returns (bytes memory) {
        if (address(this).balance < value) {
            revert AddressInsufficientBalance(address(this));
        }
        (bool success, bytes memory returndata) = target.call{value: value}(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    /**
     * @dev Same as {xref-Address-functionCall-address-bytes-}[`functionCall`],
     * but performing a static call.
     */
    function functionStaticCall(address target, bytes memory data) internal view returns (bytes memory) {
        (bool success, bytes memory returndata) = target.staticcall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function functionDelegateCall(address target, bytes memory data) internal returns (bytes memory) {
        (bool success, bytes memory returndata) = target.delegatecall(data);
        return verifyCallResultFromTarget(target, success, returndata);
    }

    function verifyCallResultFromTarget(
        address target,
        bool success,
        bytes memory returndata
    ) internal view returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            // only check if target is a contract if the call was successful and the return data is empty
            // otherwise we already know that it was a contract
            if (returndata.length == 0 && target.code.length == 0) {
                revert AddressEmptyCode(target);
            }
            return returndata;
        }
    }

    function verifyCallResult(bool success, bytes memory returndata) internal pure returns (bytes memory) {
        if (!success) {
            _revert(returndata);
        } else {
            return returndata;
        }
    }

    /**
     * @dev Reverts with returndata if present. Otherwise reverts with {FailedInnerCall}.
     */
    function _revert(bytes memory returndata) private pure {
        // Look for revert reason and bubble it up if present
        if (returndata.length > 0) {
            // The easiest way to bubble the revert reason is using memory via assembly
            /// @solidity memory-safe-assembly
            assembly {
                let returndata_size := mload(returndata)
                revert(add(32, returndata), returndata_size)
            }
        } else {
            revert FailedInnerCall();
        }
    }
}

pragma solidity ^0.8.20;

interface IERC20Permit {
    function permit(
        address owner,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    /**
     * @dev Returns the current nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);

    /**
     * @dev Returns the domain separator used in the encoding of the signature for {permit}, as defined by {EIP712}.
     */
    // solhint-disable-next-line func-name-mixedcase
    function DOMAIN_SEPARATOR() external view returns (bytes32);
}

// File: @openzeppelin/contracts/token/ERC20/IERC20.sol


// OpenZeppelin Contracts (last updated v5.0.0) (token/ERC20/IERC20.sol)

pragma solidity ^0.8.20;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);

    function totalSupply() external view returns (uint256);
    function decimals() external view returns (uint8);
    function balanceOf(address account) external view returns (uint256);
    function transfer(address to, uint256 value) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 value) external returns (bool);
    function transferFrom(address from, address to, uint256 value) external returns (bool);
}

pragma solidity ^0.8.20;

library SafeERC20 {
    using Address for address;

    error SafeERC20FailedOperation(address token);

    error SafeERC20FailedDecreaseAllowance(address spender, uint256 currentAllowance, uint256 requestedDecrease);


    function safeTransfer(IERC20 token, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transfer, (to, value)));
    }


    function safeTransferFrom(IERC20 token, address from, address to, uint256 value) internal {
        _callOptionalReturn(token, abi.encodeCall(token.transferFrom, (from, to, value)));
    }

  
    function safeIncreaseAllowance(IERC20 token, address spender, uint256 value) internal {
        uint256 oldAllowance = token.allowance(address(this), spender);
        forceApprove(token, spender, oldAllowance + value);
    }

  
    function safeDecreaseAllowance(IERC20 token, address spender, uint256 requestedDecrease) internal {
        unchecked {
            uint256 currentAllowance = token.allowance(address(this), spender);
            if (currentAllowance < requestedDecrease) {
                revert SafeERC20FailedDecreaseAllowance(spender, currentAllowance, requestedDecrease);
            }
            forceApprove(token, spender, currentAllowance - requestedDecrease);
        }
    }

    function forceApprove(IERC20 token, address spender, uint256 value) internal {
        bytes memory approvalCall = abi.encodeCall(token.approve, (spender, value));

        if (!_callOptionalReturnBool(token, approvalCall)) {
            _callOptionalReturn(token, abi.encodeCall(token.approve, (spender, 0)));
            _callOptionalReturn(token, approvalCall);
        }
    }

    function _callOptionalReturn(IERC20 token, bytes memory data) private {
        bytes memory returndata = address(token).functionCall(data);
        if (returndata.length != 0 && !abi.decode(returndata, (bool))) {
            revert SafeERC20FailedOperation(address(token));
        }
    }

    function _callOptionalReturnBool(IERC20 token, bytes memory data) private returns (bool) {
        (bool success, bytes memory returndata) = address(token).call(data);
        return success && (returndata.length == 0 || abi.decode(returndata, (bool))) && address(token).code.length > 0;
    }
}

pragma solidity 0.8.20;

contract ICB_ICO is ReentrancyGuard, Ownable {

    using SafeERC20 for IERC20;
    using Address for address;

    struct ICOConfig {
        address fundingWallet;
        address[] tokenAddresses;
        bool isNativeAllowed;
        AggregatorV3Interface ChainLinkAggregator;
    }

    struct ICOInfo {
        uint256 totalSoldInPrivateSale;
        uint256 totalSoldInPreSaleOne;
        uint256 totalSoldInPresaleTwo;
        uint256 totalSoldInPublicSale;
    }

    struct Package {
        uint256 icbPerDollar; // icb in dollar in wei ex: 0.0002 = 200000000000000
        uint256 lockMonthTime; // lock month time ex: 6
        uint256 linearVestingTime; //linear vesting time ex: 3
    }

    struct UserDeposit {
        uint256 packageAmount;   // package amount in dollar ex: 1000 ==1000$ , 300000 == 30000$, 500 = 500$
        uint256 userIcbAmount;   // user estimate icb
        uint256 icbInDollar;     // icb rate in wei
        uint256 investTime;      // user invest time in second
        uint256 lockMonthTime;     // user lock time in second
        uint256 linearVestingTime; // user linear vesting time in second
        string saleType;       // store sale phase type
    }

    ICOConfig private _icoConfig;
    ICOInfo private _info;  
    
    // common variable in(private, preSale1, preSale2, public) sales
    uint256 public saleStartTime;
    uint256 public saleEndTime;

    // common variable in(preSale1, preSale2, and private) sales
    uint256 public nextDateTimestamp;
    uint256 public icbDollarInPrePublic; // This price will update per day basic
    uint256 public incrementPriceEveryDay; // code is configure like 100 == 0.00001 , 1000 == 0.0001
    uint256 public lockPeriod; // We are storing this for pre(1,2) and public sale
    uint256 public vestingPeriod; // We are storing this for pre(1,2) and public sale
    uint256 private updateInterval = 1 days;
    uint256 constant PACKAGE_ONE_AMOUNT = 1000;
    uint256 constant PACKAGE_TWO_AMOUNT = 5000;
    uint256 constant PACKAGE_THREE_AMOUNT = 10000;
    uint256 constant PACKAGE_FOUR_AMOUNT = 30000;


    bool public isActive;
    
    uint256 constant REFERRAL_COMMISSION = 5; // 5% commission
    uint256 constant ICB_DECIMALS = 10**18; 
    
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

    mapping(uint256 => Package) public packages; // PackAmount => Package
    mapping(address => UserDeposit[]) public userDeposits; // userAddress => UserDeposit
    mapping(address => bool) public icbInvestors; 

    event BuyWithToken(address indexed user, uint256 packageAmounts, uint256 userIcbAmounts, SaleType currentSalePhase);
    event BuyWithNative(address indexed user, uint256 packageAmounts, uint256 userIcbAmounts, SaleType currentSalePhase);
    event ConfigSale(SaleType setSaletype, uint256 salePriceInDollar, uint256 everyDayIncreasePrice, uint256 saleStart, uint256 saleEnd, uint256 lockPeriod, uint256 vestingPeriod);
    event AddUserByAdmin(address[] indexed userAddress, uint256[] packageAmount, uint256[] userIcbAmount, uint256[] icbInDollar, uint256[] investTime, uint256[] lockMonthTime, uint256[] linearVestingTime, string[] currentSaleTypes);
    event UpdateLockAndVestingMonth(uint256 lockPeriod, uint256 vestingPeriod);
    event UpdateStartEndTime(uint256 startTime, uint256 endTime);
    event ToggleSale();
    event ResetSale();

    modifier isNativeTokenAvailable() {
        require(_icoConfig.isNativeAllowed, "This token is not available");
        _;
    }

    modifier validAddress(address _addr) {
        require(_addr != address(0), "Not valid address");
        _;
    }
    
    modifier onlyEoA(address _account) {
        require(!isContract(_account), "Contract Address");
        _;
    }

    modifier nonZero(uint256 amount) {
        require(amount >= 1 ," Invalid input amount");
        _;
    }
    modifier notPaused() {
        require(isActive, "Sale is paused.");
        _;
    }

    /// @param funderWallet The wallet on which we are transferring the fund
    /// @param aggregator The native Aggregators from which we will get the live native currency price
    /// @param saleStart The private sale start time
    /// @param saleEnd The private sale end time
    constructor(address funderWallet, address[] memory allowedTokens, bool isNativeAllowed, address aggregator, uint256 saleStart, uint256 saleEnd) Ownable(msg.sender) validAddress(funderWallet) {
        require(saleStart > block.timestamp && saleEnd > saleStart ,"End time must be greater than start time");
        _icoConfig.fundingWallet = funderWallet;
        _icoConfig.tokenAddresses = allowedTokens;
        _icoConfig.isNativeAllowed = isNativeAllowed;
        if (isNativeAllowed) {
            require(aggregator != address(0), "Invalid aggregator address");
            _icoConfig.ChainLinkAggregator = AggregatorV3Interface(aggregator);
        }
        else{
            _icoConfig.ChainLinkAggregator = AggregatorV3Interface(address(0));
        }
        currentSaleType = SaleType.privateSale;
        saleStartTime = saleStart;
        saleEndTime = saleEnd;
        isActive = true;
        addPackage(PACKAGE_ONE_AMOUNT, 200_000_000_000_000, 6, 6);  // 0.0002 ether
        addPackage(PACKAGE_TWO_AMOUNT, 180_000_000_000_000, 6, 3);  // 0.00018 ether
        addPackage(PACKAGE_THREE_AMOUNT, 150_000_000_000_000, 3, 3); // 0.00015 ether
        addPackage(PACKAGE_FOUR_AMOUNT, 100_000_000_000_000, 1, 3); // 0.0001 ether
    }

    /**** OnlyOwner ****/
    
    /// @notice To update the lock and vesting time by owner
    /// @param lockMonths The lock month time which is going to use in pre1, pre2, and public sale
    /// @param vestingMonths The vesting month time which is going to use in pre1, pre2, and public sale
    function updateLockAndVestingMonth(uint256 lockMonths, uint256 vestingMonths) external onlyOwner {
        lockPeriod = lockMonths;
        vestingPeriod = vestingMonths;
        emit UpdateLockAndVestingMonth(lockMonths, vestingMonths);
    }

    /// @notice To update the start and end time if need by owner
    /// @param revisedStartTime The start time
    /// @param revisedEndTime The end time
    function updateStartEndTime(
        uint256 revisedStartTime,
        uint256 revisedEndTime
    ) external onlyOwner {
        require(revisedStartTime > block.timestamp && revisedEndTime > revisedStartTime ,"End time must be greater than start time");
        saleStartTime = revisedStartTime;
        saleEndTime = revisedEndTime;
        emit UpdateStartEndTime(revisedStartTime, revisedEndTime);
    }

    /// @notice Function to toggle sale if needed only by owner
    function toggleSale() external onlyOwner{
        isActive = !isActive;
        emit ToggleSale();
    }

    /// @notice The getter function for ICOConfig
    function getICOConfig() external view returns (
        address fundingWallet,
        address[] memory tokenAddresses,
        bool isNativeAllowed,
        AggregatorV3Interface ChainLinkAggregator
    ) {
        fundingWallet = _icoConfig.fundingWallet;
        tokenAddresses = _icoConfig.tokenAddresses;
        isNativeAllowed = _icoConfig.isNativeAllowed;
        ChainLinkAggregator = _icoConfig.ChainLinkAggregator;
    }
    
    /// @notice To reset the sale if owner pass wrong data while configuring the sale turn off pubic sale
    function resetSale() external onlyOwner {      
        currentSaleType = SaleType.saleNotActive;
        saleStartTime = 0;
        saleEndTime = 0;
        icbDollarInPrePublic = 0;
        incrementPriceEveryDay =0;
        nextDateTimestamp = 0;
        lockPeriod = 0;
        vestingPeriod =0;
        emit ResetSale();
    }
    
    /// @notice To configure the pre(1 and 2) and public sale 
    /// @param setSaletype To set the pre/public sale type ex: for presale1 set 2, for presale2 set 3, and for public sale set 4
    /// @param icbPriceInWei Icb dollar price in wei ex: 1 ICB = 0.0001 usd so, input is : 100000000000000
    /// @param everyDayIncreasePriceInWei The everyday increase price in wei
    /// @param saleStart The sale start time
    /// @param saleEnd The sale end time
    /// @param lockMonths The lock month accordingly 
    /// @param vestingMonths The vesting month accordingly
    function configSale(SaleType setSaletype, uint256 icbPriceInWei, uint256 everyDayIncreasePriceInWei, uint256 saleStart, uint256 saleEnd, uint256 lockMonths, uint256 vestingMonths) external onlyOwner returns(bool) {
        require(saleStart > block.timestamp && saleEnd > saleStart ,"End time must be greater than start time");
        currentSaleType = setSaletype;
        icbDollarInPrePublic = icbPriceInWei;
        incrementPriceEveryDay =  everyDayIncreasePriceInWei;
        saleStartTime = saleStart;
        saleEndTime = saleEnd;
        lockPeriod = lockMonths;
        vestingPeriod = vestingMonths;
        getTimestampOfNextDate();
        emit ConfigSale(setSaletype, icbPriceInWei, everyDayIncreasePriceInWei, saleStart, saleEnd, lockMonths, vestingMonths);
        return true;
    }
   
    /// @notice This function is used for withdraw the token from contract if user pay via direct transfer
    /// @param tokenAddress The token contract address 
    /// @param tokenAmount The exact amount which is availabe on contract address, we have to pass tokenAmount in wei
    function getTokenFromContract(address tokenAddress, uint256 tokenAmount) external onlyOwner returns(bool){
        IERC20 token = IERC20(tokenAddress);
        token.safeTransfer(_icoConfig.fundingWallet, tokenAmount);
        return true;
    }

    /// @notice To get the ib sold data
    function getTotalSold() external view returns(uint256 totalSold, uint256 totalSoldInPrivateSales, uint256 totalSoldInPreSale1, uint256 totalSoldInPresale2, uint256 totalSoldInPublicSales){
        uint256 totalIcbSold = _info.totalSoldInPrivateSale + _info.totalSoldInPreSaleOne + _info.totalSoldInPresaleTwo + _info.totalSoldInPublicSale;
        return (totalIcbSold, _info.totalSoldInPrivateSale, _info.totalSoldInPreSaleOne, _info.totalSoldInPresaleTwo, _info.totalSoldInPublicSale);
    }
       
    /**** Public Functions ****/

    /// @dev Function to get the live native token price
    function getNativePrice() public view returns (int256) {
        (, int256 price, , , ) = _icoConfig.ChainLinkAggregator.latestRoundData();
        return price;
    }

    /// @notice To calculate the estimate fund 
    /// @param packageAmount The package amount in usd which is used to calculate the native, ICB, token(USDT,USDC) 
    /// @param buyType The buy type
    function estimateFund(uint256 packageAmount, address tokenAddress, BuyType buyType) public view nonZero(packageAmount) notPaused returns(uint256, uint256){
        require(SaleType.saleNotActive != currentSaleType, "Sale is not active");
        uint256 icbInDollarSaleWise;
        if(currentSaleType == SaleType.privateSale){
            privateSalePackageCheck(packageAmount);
            icbInDollarSaleWise = packages[packageAmount].icbPerDollar;
        }
        if(currentSaleType == SaleType.preSale1 || currentSaleType == SaleType.preSale2 || currentSaleType == SaleType.publicSale){
            icbInDollarSaleWise = icbDollarInPrePublic;
        }
        if(BuyType.eth == buyType){
            int256 livePrice = getNativePrice() * 10 ** 10;
            uint256 dollarAmount = packageAmount * ICB_DECIMALS * ICB_DECIMALS;
            uint256 ethInDollar = (dollarAmount) / uint256(livePrice) ;
            uint256 icbAmount = (packageAmount * ICB_DECIMALS) / icbInDollarSaleWise;
            return (ethInDollar, icbAmount);
        }
        else{
            allowedTokenCheck(tokenAddress);
            IERC20 token = IERC20(tokenAddress);
            uint8 tokenDecimal = token.decimals();
            uint256 tokenAmount = packageAmount * (10**tokenDecimal);
            uint256 icbAmount = (packageAmount * ICB_DECIMALS) / icbInDollarSaleWise;
            return (tokenAmount, icbAmount); 
        }
    }
    
    /// @notice To get the user invest details
    /// @param userAddress The user address from which we need the details
    function getUserDetails(address userAddress) external view returns (UserDeposit[] memory) {
        return userDeposits[userAddress];
    }
     
    /// @notice This function is used buy icb using token(USDT, USDC) in all sale
    /// @param amount The amount is in usd means if user want to buy for 50$ so just pass 50
    /// @param tokenAddress The token address from which user can buy
    /// @param referralAddress The added which is must be icb investor otherwise we are calculating the referral fee
    function buyWithToken(uint256 amount, address tokenAddress, address referralAddress) external
        nonReentrant
        notPaused
        nonZero(amount)
        onlyEoA(msg.sender)
        validAddress(referralAddress)
        returns (bool)
    {   
        allowedTokenCheck(tokenAddress);
        IERC20 token = IERC20(tokenAddress);
        uint256 estimatedToken;
        uint256 icbAmount;
        (estimatedToken, icbAmount) = estimateFund(amount, tokenAddress, BuyType.token);
        require(token.allowance(msg.sender, address(this)) >= estimatedToken,"Insufficient allowance");
        uint256 amountToBuy = amount;
        updateDepositState(amountToBuy, msg.sender, referralAddress);
        if(currentSaleType != SaleType.privateSale){
            calculatePerDayIcbDollar();
        }
        token.safeTransferFrom(msg.sender, _icoConfig.fundingWallet, estimatedToken);
        emit BuyWithToken(msg.sender, estimatedToken, icbAmount, currentSaleType);
        return true;
    }
    
    /// @notice This function is used buy icb using native token
    /// @param amount The amount is in usd means if user want to buy for 50$ so just pass 50
    /// @param referralAddress The added which is must be icb investor otherwise we are calculating the referral fee
    function buyWithNative(uint256 amount, address referralAddress)
        external
        payable
        nonReentrant
        notPaused
        onlyEoA(msg.sender)
        isNativeTokenAvailable
        nonZero(amount)
        validAddress(referralAddress)
        returns (bool)
    {
        uint256 estimatedNative;
        uint256 icbAmount;
        (estimatedNative, icbAmount) = estimateFund(amount, address(0), BuyType.eth);  // here I just pass the a token address just for fullfill the token param in estimateFund function
        require(msg.value >= estimatedNative, "Insufficient Native value");
        updateDepositState(amount, msg.sender, referralAddress);
        if(currentSaleType != SaleType.privateSale){
            calculatePerDayIcbDollar();
        }
        if(msg.value > estimatedNative){
            uint256 userExtraCoin = msg.value - estimatedNative;
            Address.sendValue(payable(msg.sender), userExtraCoin);
        }
        Address.sendValue(payable(_icoConfig.fundingWallet), estimatedNative);
        emit BuyWithNative(msg.sender, estimatedNative, icbAmount, currentSaleType);
        return true;
    }
    
    /**** Internal ****/

    function updateDepositState(
        uint256 amount, 
        address userAddress,
        address referralAddress
    ) internal {
        require(block.timestamp > saleStartTime && saleEndTime > block.timestamp," Sale is not started or sale is ended");
        if (currentSaleType == SaleType.privateSale) {
            privateSalePackageCheck(amount);
            Package memory privateSalePackage = packages[amount];
            uint256 icbAmount = (amount *ICB_DECIMALS)/ privateSalePackage.icbPerDollar;        
            internalDeposit(userAddress, amount, icbAmount, privateSalePackage.icbPerDollar, block.timestamp, (privateSalePackage.lockMonthTime*30) * 1 days, (privateSalePackage.linearVestingTime*30) * 1 days, "Private sale");
            _info.totalSoldInPrivateSale += icbAmount;
        }
        else if (currentSaleType == SaleType.preSale1) {
            uint256 currentPrice = icbDollarInPrePublic;
            uint256 preSaleOneIcb = amount * ICB_DECIMALS / currentPrice;
            internalDeposit(userAddress, amount, preSaleOneIcb, currentPrice, block.timestamp, (lockPeriod*30) * 1 days, (vestingPeriod*30) * 1 days, "Presale one");
            _info.totalSoldInPreSaleOne += preSaleOneIcb;
        }
        else if (currentSaleType == SaleType.preSale2) {
            uint256 currentPrice = icbDollarInPrePublic;
            uint256 preSaleTwoIcb = amount * ICB_DECIMALS / currentPrice;
            internalDeposit(userAddress, amount, preSaleTwoIcb, currentPrice, block.timestamp, (lockPeriod*30) * 1 days, (vestingPeriod*30) * 1 days, "Presale two");
            _info.totalSoldInPresaleTwo += preSaleTwoIcb;
        }
        else if (currentSaleType == SaleType.publicSale) {
            uint256 currentPrice = icbDollarInPrePublic;
            uint256 _amountToBuy = amount * ICB_DECIMALS / currentPrice; // exect icb amount in wei
            uint256 _commission = 0;
            uint256 _bonus = 0;
            if (icbInvestors[referralAddress]) {
                _commission = (_amountToBuy * REFERRAL_COMMISSION) / 100; //calculating referral 5%
                internalDeposit(referralAddress, 0, _commission, 0, block.timestamp, (lockPeriod*30) * 1 days, (vestingPeriod*30) * 1 days, "Referral");
            } 
            if (amount >= 100 && amount <= 500) {
                _bonus = (_amountToBuy * 1) / 100; // 1%bonus
            } else if (amount > 500 && amount <= 2000) {
                _bonus = (_amountToBuy * 2) / 100; //2% bonus
            } else if ( amount > 2000 && amount <= 10000) {
                _bonus = (_amountToBuy * 3) / 100; //3% bonus
            } else if (amount > 10000 && amount <= 20000) {
                _bonus = (_amountToBuy * 5) / 100; //5% bonus
            }else if (amount > 20000) {
                _bonus = (_amountToBuy * 10) / 100; //10% bonus
            }
            _amountToBuy = (_amountToBuy - _commission) + _bonus;
            internalDeposit(userAddress, amount, _amountToBuy, currentPrice, block.timestamp, (lockPeriod*30) * 1 days, (vestingPeriod*30) * 1 days, "Public sale");
            _info.totalSoldInPublicSale  += (_amountToBuy + _commission);
        }
        else {
            revert("Sale is not active yet");
        }
    }

    /// @dev function to update the user details
    function internalDeposit(address userAddress, uint256 packageAmount, uint256 userIcbAmount, uint256 icbInDollar, uint256 investTime, uint256 lockMonthTime, uint256 linearVestingTime, string memory currentSaleTypes) internal {
        userDeposits[userAddress].push(UserDeposit(packageAmount, userIcbAmount, icbInDollar, investTime, lockMonthTime, linearVestingTime, currentSaleTypes));
        if(!icbInvestors[userAddress]){
            icbInvestors[userAddress] = true;
        }
    }

    function privateSalePackageCheck(uint256 amount) internal pure {
        require(amount == PACKAGE_ONE_AMOUNT || amount == PACKAGE_TWO_AMOUNT || amount == PACKAGE_THREE_AMOUNT || amount == PACKAGE_FOUR_AMOUNT , "Invalid package amount for private sale" );
    }

    function allowedTokenCheck(address tokenAddress) internal view {
        bool exists = false;
        for (uint256 i = 0; i < _icoConfig.tokenAddresses.length; i++) {
            if (_icoConfig.tokenAddresses[i] == tokenAddress) {
                exists = true;
                break;
            }
        }
        require(exists, "This currency is not supported in ICO");
    }

    function getTimestampOfNextDate() internal {
        nextDateTimestamp = (block.timestamp / 1 days + 1) * 1 days;    
    }

    function calculatePerDayIcbDollar() internal  {   
        if(nextDateTimestamp <= block.timestamp) {
            uint256 daysPassed = ((block.timestamp - nextDateTimestamp) / updateInterval) + 1;
            icbDollarInPrePublic = icbDollarInPrePublic + (incrementPriceEveryDay * daysPassed) ;
            getTimestampOfNextDate();
        }
    }

    /// @dev To add the availabe 4 package
    /// @param packageAmount The packageAmount in dollar which user going to buy 
    /// @param lockMonths The lock month for the investment
    /// @param linearVestings The linear vesting month
    function addPackage(uint256 packageAmount, uint256 icbPerDollar, uint256 lockMonths, uint256 linearVestings) internal {
        Package storage privateSalePackage = packages[packageAmount];
        privateSalePackage.icbPerDollar = icbPerDollar;
        privateSalePackage.lockMonthTime = lockMonths;
        privateSalePackage.linearVestingTime = linearVestings;
    }

    function isContract(address account) internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(account)
        }
        return size > 0;
    }
}