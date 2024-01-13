// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract ICB_ICO is ReentrancyGuard, Ownable {
    struct ICOConfig {
        address fundingWallet;
        address[] tokenAddresses;
        uint8 tokenDecimal;
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
        uint8 lockMonthTime; // lock month time ex: 6
        uint8 linearVestingTime; //linear vesting time ex: 3
    }
    struct UserDeposit {
        uint256 packageAmount; // package amount in dollar ex: 1000 ==1000$ , 300000 == 30000$, 500 = 500$
        uint256 userIcbAmount; // user estimate icb
        uint256 icbInDollar; // icb rate in wei
        uint256 investTime; // user invest time
        uint256 lockMonthTime; // user lock time
        uint256 linearVestingTime; // user linear vesting time
        string saleType; // store sale phase type
    }

    ICOConfig private _icoConfig;
    ICOInfo private _info; // make it private

    // comman variable in(private, preSale1, preSale2, public) sales
    uint256 public saleStartTime;
    uint256 public saleEndTime;

    // comman variable in(preSale1, preSale2, and private) sales
    uint256 public nextDateTimestamp;
    uint256 public icbDollarInPrePublic; // This price will update per day basic
    uint256 public incrementPriceEveryDay; // code is configure like 100 == 0.00001 , 1000 == 0.0001
    uint256 public lockMonths; // We are storing this for pre(1,2) and public sale
    uint256 public vestingMonths; // We are storing this for pre(1,2) and public sale
    bool public isPause;

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
    mapping(address => UserDeposit[]) private _userDeposits; // userAddress => UserDeposit
    mapping(address => bool) public icbInvestors;

    event BuyWithToken(
        address indexed user,
        uint256 packageAmounts,
        uint256 userIcbAmounts,
        SaleType currentSalePhase
    );
    event BuyWithNative(
        address indexed user,
        uint256 packageAmounts,
        uint256 userIcbAmounts,
        SaleType currentSalePhase
    );
    event ConfigSale(
        SaleType setSaletype,
        uint256 salePriceInDollar,
        uint256 everyDayIncreasePrice,
        uint256 saleStart,
        uint256 saleEnd,
        uint8 lockMonths,
        uint8 vestingMonths
    );
    event UpdateLockAndVestingMonth(uint256 lockMonths, uint256 vestingMonths);
    event UpdateStartEndTime(uint256 startTime, uint256 endTime);
    event ToggleSale();
    event ResetSale();

    modifier tokenCheck(address tokenAddress) {
        bool exists = false;
        for (uint256 i = 0; i < _icoConfig.tokenAddresses.length; i++) {
            if (_icoConfig.tokenAddresses[i] == tokenAddress) {
                exists = true;
                break;
            }
        }
        require(exists, "This currency is not supported in ICO");
        _;
    }

    modifier isNativeTokenAvailable() {
        require(_icoConfig.isNativeAllowed, "This token is not available");
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

    modifier inputNumberCheck(uint256 amount) {
        require(amount != 0 || amount >= 1, " Invalid input amount");
        _;
    }
    modifier isSalePause() {
        require(isPause, "Sale is paused.");
        _;
    }

    /// @param funderWallet The wallet on which we are transfering the fund
    /// @param aggregator The native Aggreators from which we will get the live native currency price
    /// @param tokenDecimals The token(usdt and usdc) decimal which required to calculate the fund, on the ETH(USDT and USDC is 6), BNB((USDT and USDC is 18), Matic((USDT and USDC is 6)
    /// @param saleStart The private sale start time
    /// @param saleEnd The private sale end time
    constructor(
        address funderWallet,
        address[] memory allowedTokens,
        bool isNativeAllowed,
        address aggregator,
        uint8 tokenDecimals,
        uint256 saleStart,
        uint256 saleEnd
    )
        Ownable(msg.sender)
        validAddress(funderWallet)
        validAddress(aggregator)
        inputNumberCheck(tokenDecimals)
    {
        require(
            saleStart > block.timestamp && saleEnd > saleStart,
            "End time must be greater than start time"
        );
        _icoConfig.fundingWallet = funderWallet;
        _icoConfig.tokenAddresses = allowedTokens;
        _icoConfig.tokenDecimal = tokenDecimals;
        _icoConfig.isNativeAllowed = isNativeAllowed;
        if (isNativeAllowed) {
            _icoConfig.ChainLinkAggregator = AggregatorV3Interface(aggregator);
        }
        currentSaleType = SaleType.privateSale;
        saleStartTime = saleStart;
        saleEndTime = saleEnd;
        isPause = true;
        addPackage(1000, 0.0002 ether, 6, 6);
        addPackage(5000, 0.00018 ether, 6, 3);
        addPackage(10000, 0.00015 ether, 3, 3);
        addPackage(30000, 0.0001 ether, 1, 3);
    }

    /**** OnlyOwner ****/

    /// @notice This function is used by admin to update the user data who did the payment using card
    function addUserByAdmin(
        address[] memory userAddress,
        uint256[] memory packageAmount,
        uint256[] memory userIcbAmount,
        uint256[] memory icbInDollar,
        uint256[] memory investTime,
        uint256[] memory lockMonthTime,
        uint256[] memory linearVestingTime,
        string[] memory currentSaleTypes
    ) external onlyOwner returns (bool) {
        require(
            userAddress.length <= 100,
            "Adding more than 100 users at a time causing gas issue"
        );
        require(
            userAddress.length == packageAmount.length &&
                userAddress.length == userIcbAmount.length &&
                userAddress.length == icbInDollar.length &&
                userAddress.length == investTime.length &&
                userAddress.length == lockMonthTime.length &&
                userAddress.length == linearVestingTime.length &&
                userAddress.length == currentSaleTypes.length,
            "Input arrays must have the same length"
        );
        for (uint256 i = 0; i < userAddress.length; i++) {
            internalDeposit(
                userAddress[i],
                packageAmount[i],
                userIcbAmount[i],
                icbInDollar[i],
                investTime[i],
                lockMonthTime[i],
                linearVestingTime[i],
                currentSaleTypes[i]
            );
        }
        return true;
    }

    /// @notice To update the lock and vesting time by owner
    /// @param lockMonthTime The lock month time which is going to use in pre1, pre2, and public sale
    /// @param vestingMonthTime The vesting month time which is going to use in pre1, pre2, and public sale
    function updateLockAndVestingMonth(
        uint256 lockMonthTime,
        uint256 vestingMonthTime
    ) external onlyOwner {
        lockMonths = lockMonthTime;
        vestingMonths = vestingMonthTime;
        emit UpdateLockAndVestingMonth(lockMonthTime, vestingMonthTime);
    }

    /// @notice To update the start and end time if need by owner
    /// @param revisedStartTime The start time
    /// @param revisedEndTime The end time
    function updateStartEndTime(
        uint256 revisedStartTime,
        uint256 revisedEndTime
    ) external onlyOwner {
        require(
            revisedStartTime > block.timestamp &&
                revisedEndTime > revisedStartTime,
            "End time must be greater than start time"
        );
        saleStartTime = revisedStartTime;
        saleEndTime = revisedEndTime;
        emit UpdateStartEndTime(revisedStartTime, revisedEndTime);
    }

    /// @notice Function to toggle sale if needed only by owner
    function toggleSale() external onlyOwner {
        isPause = !isPause;
        emit ToggleSale();
    }

    /// @notice The getter function for ICOConfig
    function getICOConfig()
        external
        view
        returns (
            address fundingWallet,
            address[] memory tokenAddresses,
            uint8 tokenDecimal,
            bool isNativeAllowed,
            AggregatorV3Interface ChainLinkAggregator
        )
    {
        fundingWallet = _icoConfig.fundingWallet;
        tokenAddresses = _icoConfig.tokenAddresses;
        tokenDecimal = _icoConfig.tokenDecimal;
        isNativeAllowed = _icoConfig.isNativeAllowed;
        ChainLinkAggregator = _icoConfig.ChainLinkAggregator;
    }

    /// @notice To reset the sale if owner pass wrong data while configuring the sale turn off pubic sale
    function resetSale() external onlyOwner {
        currentSaleType = SaleType.saleNotActive;
        saleStartTime = 0;
        saleEndTime = 0;
        icbDollarInPrePublic = 0;
        incrementPriceEveryDay = 0;
        nextDateTimestamp = 0;
        lockMonths = 0;
        vestingMonths = 0;
        emit ResetSale();
    }

    /// @notice To configure the pre(1 and 2) and public sale
    /// @param setSaletype To set the pre/public sale type ex: for presale1 set 2, for presale2 set 3, and for public sale set 4
    /// @param icbPriceInWei Icb dollar price in wei ex: 1 ICB = 0.0001 usd so, input is : 100000000000000
    /// @param everyDayIncreasePriceInWei The everyday increase price in wei
    /// @param saleStart The sale start time
    /// @param saleEnd The sale end time
    /// @param lockMonthTime The lock month accordingly
    /// @param vestingMonthTime The vesting month accordingly
    function configSale(
        SaleType setSaletype,
        uint256 icbPriceInWei,
        uint256 everyDayIncreasePriceInWei,
        uint256 saleStart,
        uint256 saleEnd,
        uint8 lockMonthTime,
        uint8 vestingMonthTime
    ) external onlyOwner returns (bool) {
        require(
            saleStart > block.timestamp && saleEnd > saleStart,
            "End time must be greater than start time"
        );
        currentSaleType = setSaletype;
        icbDollarInPrePublic = icbPriceInWei;
        incrementPriceEveryDay = everyDayIncreasePriceInWei;
        saleStartTime = saleStart;
        saleEndTime = saleEnd;
        lockMonths = lockMonthTime;
        vestingMonths = vestingMonthTime;
        getTimestampOfNextDate();
        emit ConfigSale(
            setSaletype,
            icbPriceInWei,
            everyDayIncreasePriceInWei,
            saleStart,
            saleEnd,
            lockMonthTime,
            vestingMonthTime
        );
        return true;
    }

    /// @notice This function is used for withdraw the token from contract if user pay via direct transfer
    /// @param tokenAddress The token contract address
    /// @param tokenAmount The exact amount which is availabe on contract address, we have to pass tokenAmount in wei
    function getTokenFromContract(
        address tokenAddress,
        uint256 tokenAmount
    ) external onlyOwner returns (bool) {
        IERC20 token = IERC20(tokenAddress);
        require(
            token.balanceOf(address(this)) >= tokenAmount,
            "Insufficient token"
        );
        token.transfer(_icoConfig.fundingWallet, tokenAmount);
        return true;
    }

    /// @notice This is used to withdaw the native token if user pay directly
    /// @param nativeAmount The exact amount availabe on contract
    function getNativeTokenFromContract(
        uint256 nativeAmount
    ) external onlyOwner returns (bool) {
        require(
            address(this).balance >= nativeAmount,
            "Insufficient native token"
        );
        payable(_icoConfig.fundingWallet).transfer(nativeAmount);
        return true;
    }

    /// @notice To get the ib sold data
    function getTotalSold()
        external
        view
        returns (
            uint256 totalSold,
            uint256 totalSoldInPrivateSales,
            uint256 totalSoldInPreSale1,
            uint256 totalSoldInPresale2,
            uint256 totalSoldInPublicSales
        )
    {
        uint256 totalIcbSold = _info.totalSoldInPrivateSale +
            _info.totalSoldInPreSaleOne +
            _info.totalSoldInPresaleTwo +
            _info.totalSoldInPublicSale;
        return (
            totalIcbSold,
            _info.totalSoldInPrivateSale,
            _info.totalSoldInPreSaleOne,
            _info.totalSoldInPresaleTwo,
            _info.totalSoldInPublicSale
        );
    }

    /**** Public Functions ****/

    /// @dev Function to get the live native token price
    function getNativePrice() public view returns (int256) {
        (, int256 price, , , ) = _icoConfig
            .ChainLinkAggregator
            .latestRoundData();
        return price;
    }

    /// @notice To calculate the estimate fund
    /// @param packageAmount The package amount in usd which is used to calculate the native, ICB, token(USDT,USDC)
    /// @param buyType The buy type
    function estimateFund(
        uint256 packageAmount,
        BuyType buyType
    )
        public
        view
        inputNumberCheck(packageAmount)
        isSalePause
        returns (uint256, uint256)
    {
        require(
            SaleType.saleNotActive != currentSaleType,
            "Sale is not active"
        );
        uint256 icbInDollarSaleWise;
        if (currentSaleType == SaleType.privateSale) {
            require(
                packageAmount == 1000 ||
                    packageAmount == 5000 ||
                    packageAmount == 10000 ||
                    packageAmount == 30000,
                "Invalid package amount for private sale"
            );
            icbInDollarSaleWise = packages[packageAmount].icbPerDollar;
        }
        if (
            currentSaleType == SaleType.preSale1 ||
            currentSaleType == SaleType.preSale2 ||
            currentSaleType == SaleType.publicSale
        ) {
            icbInDollarSaleWise = icbDollarInPrePublic;
        }
        if (BuyType.eth == buyType) {
            // int256 liveprice = getNativePrice() * 10 ** 10;
            int256 liveprice = 229633671342 * 10 ** 10; // for testing purpose I used the hardcoded value

            uint256 dollarAmount = packageAmount * 10 ** 18 * 10 ** 18;
            uint256 ethInDollar = (dollarAmount) / uint256(liveprice);
            uint256 icbAmount = (packageAmount * 10 ** 18) /
                icbInDollarSaleWise;
            return (ethInDollar, icbAmount);
        } else {
            uint256 tokenAmount = packageAmount *
                (10 ** _icoConfig.tokenDecimal);
            uint256 icbAmount = (packageAmount * 10 ** 18) /
                icbInDollarSaleWise;
            return (tokenAmount, icbAmount);
        }
    }

    /// @notice To get the user invest details
    /// @param userAddress The user address from which we need the details
    function getUserDetails(
        address userAddress
    ) external view returns (UserDeposit[] memory) {
        return _userDeposits[userAddress];
    }

    /// @notice This function is used buy icb using token(USDT, USDC) in all sale
    /// @param amount The amount is in usd means if user want to buy for 50$ so just pass 50
    /// @param tokenAddress The token address from which user can buy
    /// @param referralAddress The added which is must be icb investor otherwise we are calculating the referral fee
    function buyWithToken(
        uint256 amount,
        address tokenAddress,
        address referralAddress
    )
        external
        nonReentrant
        isSalePause
        inputNumberCheck(amount)
        isContractCall(msg.sender)
        validAddress(msg.sender)
        validAddress(referralAddress)
        tokenCheck(tokenAddress)
        returns (bool)
    {
        IERC20 token = IERC20(tokenAddress);
        uint256 estimatedToken;
        uint256 icbAmount;
        (estimatedToken, icbAmount) = estimateFund(amount, BuyType.token);
        require(
            token.balanceOf(msg.sender) >= estimatedToken,
            "Insufficient token balance"
        );
        require(
            token.allowance(msg.sender, address(this)) >= estimatedToken,
            "Insufficient allowance"
        );
        uint256 amountToBuy = amount;
        UpdateDepositState(amountToBuy, msg.sender, referralAddress);
        calculatePerDayIcbDollar();
        IERC20(tokenAddress).transferFrom(
            msg.sender,
            _icoConfig.fundingWallet,
            estimatedToken
        );
        emit BuyWithToken(
            msg.sender,
            estimatedToken,
            icbAmount,
            currentSaleType
        );
        return true;
    }

    /// @notice This function is used buy icb using native token
    /// @param amount The amount is in usd means if user want to buy for 50$ so just pass 50
    /// @param referralAddress The added which is must be icb investor otherwise we are calculating the referral fee
    function buyWithNative(
        uint256 amount,
        address referralAddress
    )
        external
        payable
        nonReentrant
        isSalePause
        isContractCall(msg.sender)
        isNativeTokenAvailable
        inputNumberCheck(amount)
        validAddress(referralAddress)
        returns (bool)
    {
        uint256 estimatedNative;
        uint256 icbAmount;
        (estimatedNative, icbAmount) = estimateFund(amount, BuyType.eth);
        require(msg.value >= estimatedNative, "Insufficient Native value");
        UpdateDepositState(amount, msg.sender, referralAddress);
        calculatePerDayIcbDollar();
        payable(_icoConfig.fundingWallet).transfer(msg.value);
        emit BuyWithToken(
            msg.sender,
            estimatedNative,
            icbAmount,
            currentSaleType
        );
        return true;
    }

    /**** Internal ****/

    function UpdateDepositState(
        uint256 amount,
        address userAddress,
        address referralAddress
    ) internal {
        require(
            block.timestamp > saleStartTime && saleEndTime > block.timestamp,
            " Sale is not started or sale is ended"
        );
        if (currentSaleType == SaleType.privateSale) {
            require(
                amount == 1000 ||
                    amount == 5000 ||
                    amount == 10000 ||
                    amount == 30000,
                "Invalid package amount for private sale"
            );
            Package memory privateSalePackage = packages[amount];
            uint256 icbAmount = (amount * 10 ** 18) /
                privateSalePackage.icbPerDollar;
            internalDeposit(
                userAddress,
                amount,
                icbAmount,
                privateSalePackage.icbPerDollar,
                block.timestamp,
                (privateSalePackage.lockMonthTime * 30) * 1 days,
                (privateSalePackage.linearVestingTime * 30) * 1 days,
                "Private sale"
            );
            _info.totalSoldInPrivateSale += icbAmount;
        } else if (currentSaleType == SaleType.preSale1) {
            uint256 currentPrice = icbDollarInPrePublic;
            uint256 preSaleOneIcb = (amount * 10 ** 18) / currentPrice;
            internalDeposit(
                userAddress,
                amount,
                preSaleOneIcb,
                currentPrice,
                block.timestamp,
                (lockMonths * 30) * 1 days,
                (vestingMonths * 30) * 1 days,
                "Presale one"
            );
            _info.totalSoldInPreSaleOne += preSaleOneIcb;
        } else if (currentSaleType == SaleType.preSale2) {
            uint256 currentPrice = icbDollarInPrePublic;
            uint256 preSaleTwoIcb = (amount * 10 ** 18) / currentPrice;
            internalDeposit(
                userAddress,
                amount,
                preSaleTwoIcb,
                currentPrice,
                block.timestamp,
                (lockMonths * 30) * 1 days,
                (vestingMonths * 30) * 1 days,
                "Presale two"
            );
            _info.totalSoldInPresaleTwo += preSaleTwoIcb;
        } else if (currentSaleType == SaleType.publicSale) {
            uint256 currentPrice = icbDollarInPrePublic;
            uint256 _amountToBuy = (amount * 10 ** 18) / currentPrice; // exect icb amount in wei
            uint256 _commission = 0;
            uint256 _bonus = 0;
            if (icbInvestors[referralAddress]) {
                _commission = (_amountToBuy * 100) / 10_000; //calculating referral 1%
                internalDeposit(
                    referralAddress,
                    0,
                    _commission,
                    0,
                    block.timestamp,
                    (lockMonths * 30) * 1 days,
                    (vestingMonths * 30) * 1 days,
                    "Referral"
                );
            }
            if (amount > 100 && amount <= 500) {
                _bonus = (_amountToBuy * 100) / 10_000; // 1%bonus
            } else if (amount > 500 && amount <= 1000) {
                _bonus = (_amountToBuy * 500) / 10_000; //5% bonus
            } else if (amount > 1000 && amount <= 5000) {
                _bonus = (_amountToBuy * 1000) / 10_000; //10% bonus
            } else if (amount > 5000) {
                _bonus = (_amountToBuy * 2500) / 10_000; //25% bonus
            }
            _amountToBuy = (_amountToBuy - _commission) + _bonus;
            internalDeposit(
                userAddress,
                amount,
                _amountToBuy,
                currentPrice,
                block.timestamp,
                (lockMonths * 30) * 1 days,
                (vestingMonths * 30) * 1 days,
                "Public sale"
            );
            _info.totalSoldInPublicSale += (_amountToBuy + _commission);
        } else {
            revert("Sale is not active yet");
        }
    }

    /// @dev function to update the user details
    function internalDeposit(
        address userAddress,
        uint256 packageAmount,
        uint256 userIcbAmount,
        uint256 icbInDollar,
        uint256 investTime,
        uint256 lockMonthTime,
        uint256 linearVestingTime,
        string memory currentSaleTypes
    ) internal {
        _userDeposits[userAddress].push(
            UserDeposit(
                packageAmount,
                userIcbAmount,
                icbInDollar,
                investTime,
                lockMonthTime,
                linearVestingTime,
                currentSaleTypes
            )
        );
        if (!icbInvestors[userAddress]) {
            icbInvestors[userAddress] = true;
        }
    }

    function getTimestampOfNextDate() internal {
        nextDateTimestamp = (block.timestamp / 1 days + 1) * 1 days;
    }

    function calculatePerDayIcbDollar() internal {
        if (nextDateTimestamp <= block.timestamp) {
            icbDollarInPrePublic += incrementPriceEveryDay;
            getTimestampOfNextDate();
        }
    }

    /// @dev To add the availabe 4 package
    /// @param packageAmount The packageAmount in dollar which user going to buy
    /// @param lockMonthTime The lock month for the investment
    /// @param linearVestingTime The linear vesting month
    function addPackage(
        uint256 packageAmount,
        uint256 icbPerDollar,
        uint8 lockMonthTime,
        uint8 linearVestingTime
    ) internal {
        Package storage privateSalePackage = packages[packageAmount];
        privateSalePackage.icbPerDollar = icbPerDollar;
        privateSalePackage.lockMonthTime = lockMonthTime;
        privateSalePackage.linearVestingTime = linearVestingTime;
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
