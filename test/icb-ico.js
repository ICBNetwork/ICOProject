const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const {
  latestBlock,
} = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time");
const { ERROR } = require("@nomicfoundation/ethereumjs-evm/dist/exceptions");

describe("ICB_ICO", async function () {
  async function deployment() {
    const USDT = await ethers.getContractFactory("USDT");
    const usdt = await USDT.deploy();

    const provider = ethers.provider;
    const [owner, funderAddr] = await ethers.getSigners();
    const USDT_Address = usdt.getAddress();
    const USDC_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
    const nativeAggreators = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const tokenDecimals = 6;
    const saleType = 1;
    const latestBlock = await ethers.provider.getBlock("latest");
    // Retrieve the timestamp from the latest block

    const saleStart = latestBlock.timestamp + 10;
    const saleEnd = saleStart + 10;

    const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
    const icb = await ICB_ICO_ETH.deploy(
      funderAddr,
      USDT_Address,
      USDC_Address,
      nativeAggreators,
      tokenDecimals,
      saleType,
      saleStart,
      saleEnd
    );

    return {
      usdt,
      provider,
      icb,
      owner,
      funderAddr,
      USDT_Address,
      USDC_Address,
      saleStart,
      saleEnd,
      latestBlock,
    };
  }

  describe("ICB_ICO Deployment", async function () {
    it("Should not deploy smart contract, invalid Addresses", async function () {
      const funderAddr = "0x0000000000000000000000000000000000000000";
      const USDT_Address = "0x0000000000000000000000000000000000000000";
      const USDC_Address = "0x0000000000000000000000000000000000000000";
      const nativeAggreators = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
      const tokenDecimals = 6;
      const saleType = 1;
      const timestamp = Date.now();
      const saleStart = 100;
      const saleEnd = saleStart + 100;
      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");

      try {
        await ICB_ICO_ETH.deploy(
          funderAddr,
          USDT_Address,
          USDC_Address,
          nativeAggreators,
          tokenDecimals,
          saleType,
          saleStart,
          saleEnd
        );
        throw new Error("Invalid Address");
      } catch (error) {
        expect(error.message).to.include("Not valid address");
      }
    });

    it("Cannot deploy smart contract, Sale Start time should be greater than current time", async function () {
      const [funderAddr] = await ethers.getSigners();
      const USDT_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
      const USDC_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
      const nativeAggreators = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
      const tokenDecimals = 6;
      const saleType = 1;
      const timestamp = Date.now();
      const saleStart = 100;
      const saleEnd = saleStart + 100;
      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");

      try {
        await ICB_ICO_ETH.deploy(
          funderAddr,
          USDT_Address,
          USDC_Address,
          nativeAggreators,
          tokenDecimals,
          saleType,
          saleStart,
          saleEnd
        );
        throw new Error("Invalid Time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Cannot set private sale config,Sale End time should be greater than Start time", async function () {
      const [funderAddr] = await ethers.getSigners();
      const USDT_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
      const USDC_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
      const nativeAggreators = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
      const tokenDecimals = 6;
      const saleType = 1;
      const timestamp = Date.now();
      const saleStart = timestamp + 100;
      const saleEnd = 100;
      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");

      try {
        await ICB_ICO_ETH.deploy(
          funderAddr,
          USDT_Address,
          USDC_Address,
          nativeAggreators,
          tokenDecimals,
          saleType,
          saleStart,
          saleEnd
        );
        throw new Error("Invalid Time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Should deploy ICB Contract and set initial values", async function () {
      const { icb, latestBlock } = await deployment();

      expect(await icb.currentSaleType()).to.be.equal(1);
      expect(await icb.saleStartTime()).to.greaterThan(latestBlock.timestamp);
      expect(await icb.saleEndTime()).to.be.greaterThan(
        await icb.saleStartTime()
      );
    });
  });

  describe("Pay With Native In Private Sale", async function () {
    it("Cannot pay with native currency ETH, Sale type not matched", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const packageAmount = 1000;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );

      try {
        const estimateAmt = await icb.estimateFund(packageAmount, 0);
        await icb.payWithNativeInPrivate(packageAmount, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Sale type is not matched");
      }
    });

    it("Cannot pay with native currency ETH, Sale is not started", async function () {
      const { icb, owner, funderAddr, provider } = await deployment();
      const packageAmount = 1000;

      try {
        const estimateAmt = await icb.estimateFund(packageAmount, 0);
        await icb.payWithNativeInPrivate(packageAmount, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with native currency ETH, Sale is ended", async function () {
      const { icb, saleStart, saleEnd } = await deployment();
      const packageAmount = 1000;
      try {
        const estimateAmt = await icb.estimateFund(packageAmount, 0);
        await time.increaseTo(saleEnd + 100);
        await icb.payWithNativeInPrivate(packageAmount, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with native currency ETH, invalid package amount", async function () {
      const { icb, saleStart, saleEnd } = await deployment();
      const packageAmount = 1000;

      try {
        const estimateAmt = await icb.estimateFund(packageAmount, 0);
        await time.increaseTo(saleStart);
        await icb.payWithNativeInPrivate(100, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Invalid package amount");
      }
    });

    it("Should successfully pay with native currency ETH", async function () {
      const { icb, owner, funderAddr, provider, saleStart } =
        await deployment();
      const packageAmount = 1000;

      const packages = await icb.packages(packageAmount);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      expect(await icb.currentSaleType()).to.be.equal(1);
      await time.increaseTo(saleStart);
      const funderbalanceBefore = await provider.getBalance(funderAddr);
      await icb.payWithNativeInPrivate(packageAmount, {
        value: estimateAmt[0],
      });
      const funderbalanceAfter = await provider.getBalance(funderAddr);

      expect(await funderbalanceAfter).to.equal(
        funderbalanceBefore + estimateAmt[0]
      );

      expect(icb.payWithNativeInPrivate(packageAmount))
        .to.emit(icb, "FundTransfer")
        .withArgs(
          owner,
          packageAmount,
          estimateAmt[1],
          Date.now(),
          packages.lockMonthTime,
          packages.linearVestingTime
        );
    });
  });

  describe("Pay with token USDC/USDT in private sale", async function () {
    it("Cannot pay with token USDT/USDC, Sale type not matched", async function () {
      const { icb, USDT_Address, latestBlock, saleEnd } = await deployment();
      const packageAmount = 1000;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );

      try {
        await icb.payWithTokenInPrivate(packageAmount, USDT_Address);
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Sale type is not matched");
      }
    });

    it("Cannot pay with token USDC/USDT, Sale is not started", async function () {
      const { icb, USDT_Address } = await deployment();
      const packageAmount = 1000;

      try {
        const estimateAmt = await icb.estimateFund(packageAmount, 1);
        await icb.payWithTokenInPrivate(packageAmount, USDT_Address);
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with token USDC/USDT, Sale is ended", async function () {
      const { icb, USDT_Address, saleEnd } = await deployment();
      const packageAmount = 1000;

      try {
        const estimateAmt = await icb.estimateFund(packageAmount, 1);
        await time.increaseTo(saleEnd + 100);
        await icb.payWithTokenInPrivate(packageAmount, USDT_Address);
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with token USDC/USDT, invalid package amount", async function () {
      const { icb, USDT_Address, saleStart } = await deployment();

      try {
        await time.increaseTo(saleStart);
        await icb.payWithTokenInPrivate(100, USDT_Address);
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Invalid package amount");
      }
    });

    it("Cannot pay with token USDC/USDT, invalid token address", async function () {
      const { icb, saleStart } = await deployment();
      const usdtAddress = "0x0000000000000000000000000000000000000000";
      const packageAmount = 1000;
      try {
        await time.increaseTo(saleStart);
        await icb.payWithTokenInPrivate(packageAmount, usdtAddress);
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Unsupported token");
      }
    });

    it("Cannot pay with token USDC/USDT, insufficient allowance", async function () {
      const { icb, USDT_Address, saleStart } = await deployment();
      const packageAmount = 1000;
      try {
        await time.increaseTo(saleStart);
        await icb.payWithTokenInPrivate(packageAmount, USDT_Address);
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Insufficient allowance");
      }
    });

    it("Should successfully set the token allowance", async function () {
      const { icb, owner, USDT_Address, usdt } = await deployment();
      const packageAmount = 1000;
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = await estimateAmt[0];
      const balance = await usdt.balanceOf(owner.getAddress());
      await usdt.approve(icb, estimateAmt[0]);

      expect(
        await usdt.allowance(owner, icb.getAddress())
      ).to.be.greaterThanOrEqual(await tokenAmount);
    });

    it("Should successfully pay with token USDC/USDT in private Sale", async function () {
      const {
        icb,
        owner,
        USDT_Address,
        usdt,
        funderAddr,
        saleStart,
        latestBlock,
        saleType,
      } = await deployment();
      const packageAmount = 1000;
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const packages = await icb.packages(packageAmount);

      await usdt.approve(icb, estimateAmt[0]);

      expect(usdt.allowance(owner, icb.getAddress()));
      const funderWalletBalance = await usdt.balanceOf(funderAddr);

      await time.increaseTo(saleStart);
      await icb.payWithTokenInPrivate(packageAmount, USDT_Address);
      const funderWalletBalanceAfter = await usdt.balanceOf(funderAddr);

      expect(await funderWalletBalanceAfter).to.be.greaterThan(
        await funderWalletBalance
      );

      expect(await usdt.balanceOf(funderAddr)).to.be.equal(
        await funderWalletBalanceAfter
      );
      expect(icb.payWithTokenInPrivate(packageAmount, USDT_Address))
        .to.emit(icb, "FundTransfer")
        .withArgs(
          owner,
          packageAmount,
          estimateAmt[1],
          latestBlock.timestamp,
          packages.lockMonthTime,
          packages.linearVestingTime,
          saleType
        );
    });
  });

  describe("Config PreSale", async function () {
    it("Should not config presale, caller is not owner", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp;
      const saleEnd = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      try {
        await icb
          .connect(addr2)
          .configPrePublicSale(
            setSaletype,
            salePriceInDollar,
            everyDayIncreasePrice,
            saleStart,
            saleEnd,
            lockMonths,
            vestingMonths
          );
        throw new ERROR("Not owner");
      } catch (error) {
        expect(error.message).to.include("You are not the Owner");
      }
    });

    it("Should succesfully config presale", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      expect(await Date.now()).to.be.greaterThan(await icb.saleEndTime());

      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );

      expect(await icb.currentSaleType()).to.be.equal(2);
      expect(await icb.saleStartTime()).to.be.greaterThan(
        latestBlock.timestamp
      );
      expect(await icb.saleEndTime()).to.be.greaterThan(
        await icb.saleStartTime()
      );
    });
  });

  describe("Pay with native currency in presale", async function () {
    it("Cannot pay with native currency ETH in presale, Sale type not matched", async function () {
      const { icb, latestBlock } = await deployment();
      const packageAmount = 100;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnd = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      try {
        const estimateAmt = await icb.estimateFund(1000, 0);
        await time.increaseTo(saleStart + 10);
        await icb.payWithNativeInPresale(packageAmount, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Sale type is not matched");
      }
    });

    it("Cannot pay with native currency ETH in presale, Sale is not started", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const packageAmount = 100;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.equal(2);
      try {
        const estimateAmt = await icb.estimateFund(packageAmount, 0);

        await icb.payWithNativeInPresale(packageAmount, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with native currency ETH in presale, Sale is ended", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const packageAmount = 100;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.equal(2);
      try {
        const estimateAmt = await icb.estimateFund(1000, 0);
        await time.increaseTo(saleEnds + 10);

        await icb.payWithNativeInPresale(packageAmount, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with native currency ETH in presale, Insufficient Native value", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const packageAmount = 100;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.equal(2);
      try {
        const estimateAmt = await icb.estimateFund(1000, 0);
        time.increaseTo(saleStart);
        await icb.payWithNativeInPresale(packageAmount, {
          value: 1000,
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Insufficient Native value");
      }
    });

    it("Succesfully pay with native currency ETH in presale", async function () {
      const { icb, owner, latestBlock, funderAddr, saleEnd, provider } =
        await deployment();
      const packageAmount = 100;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.equal(2);
      const estimateAmt = await icb.estimateFund(1000, 0);
      const icbAmount = estimateAmt[1];
      time.increaseTo(saleStart);

      const funderbalanceBefore = await provider.getBalance(funderAddr);
      await icb.payWithNativeInPresale(packageAmount, {
        value: estimateAmt[0],
      });
      const funderbalanceAfter = await provider.getBalance(funderAddr);

      expect(await funderbalanceAfter).to.be.greaterThan(
        await funderbalanceBefore
      );
      expect(await provider.getBalance(funderAddr)).to.be.equal(
        funderbalanceAfter
      );

      expect(icb.payWithNativeInPresale(packageAmount))
        .to.emit(icb, "FundTransfer")
        .withArgs(
          owner,
          packageAmount,
          icbAmount,
          latestBlock.timestamp,
          lockMonths,
          vestingMonths
        );
    });
  });

  describe("Pay with token USDC/USDT in PreSale", async function () {
    it("Cannot pay with token USDT/USDC in presale, Invalid package amount", async function () {
      const { icb, latestBlock, USDT_Address, saleEnd } = await deployment();

      const packageAmount = 0;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );

      try {
        await icb.payWithTokenInPresale(packageAmount, USDT_Address);
        throw new Error("Invalid amount");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Cannot pay with token USDC/USDT in presale, Sale type not matched", async function () {
      const { icb, USDT_Address } = await deployment();
      const packageAmount = 1000;

      try {
        await icb.payWithTokenInPresale(packageAmount, USDT_Address);
        throw new Error("Invalid Sale type");
      } catch (error) {
        expect(error.message).to.include("Sale type is not matched");
      }
    });

    it("Cannot pay with token USDC/USDT in presale, Sale is not started", async function () {
      const { icb, latestBlock, USDT_Address, saleEnd } = await deployment();

      const packageAmount = 1000;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );

      try {
        await icb.payWithTokenInPresale(packageAmount, USDT_Address);
        throw new Error("Sale not started");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with token USDC/USDT in presale, Sale is ended", async function () {
      const { icb, latestBlock, USDT_Address, saleEnd } = await deployment();

      const packageAmount = 1000;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10)
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );

      try {
        await time.increaseTo(saleEnds + 100);
        await icb.payWithTokenInPresale(packageAmount, USDT_Address);
        throw new Error("Sale ended");
      } catch (error) {
        expect(error.message).to.include(
          "Sale is not started or sale is ended"
        );
      }
    });

    it("Cannot pay with token USDC/USDT in presale, invalid token address", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const packageAmount = 1000;
      const USDT_Address = "0x0000000000000000000000000000000000000000";

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10)
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.be.equal(2);
      try {
        await icb.payWithTokenInPresale(packageAmount, USDT_Address);
        throw new Error("Invalid Address");
      } catch (error) {
        expect(error.message).to.include("Unsupported token");
      }
    });

    it("Cannot pay with token USDC/USDT in presale, insufficient balance", async function () {
      const { icb, latestBlock, USDT_Address, saleEnd } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const packageAmount = 1000;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.be.equal(2);
      try {
        await time.increaseTo(saleStart);
        await icb
          .connect(addr2)
          .payWithTokenInPresale(packageAmount, USDT_Address);
        throw new Error("Invalid Address");
      } catch (error) {
        expect(error.message).to.include("Insufficient token balance");
      }
    });

    it("Cannot pay with token USDC/USDT in presale, insufficient allowance", async function () {
      const { icb, latestBlock, USDT_Address, saleEnd } = await deployment();
      const packageAmount = 1000;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.be.equal(2);
      try {
        await time.increaseTo(saleStart);
        await icb.payWithTokenInPresale(packageAmount, USDT_Address);
        throw new Error("Invalid Address");
      } catch (error) {
        expect(error.message).to.include("Insufficient allowance");
      }
    });

    it("Should successfully set the token allowance", async function () {
      const { icb, owner, usdt, latestBlock, saleEnd } = await deployment();
      const packageAmount = 1000;

      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.be.equal(2);
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      const balance = await usdt.balanceOf(owner.getAddress());
      expect(await balance).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);

      expect(
        await usdt.allowance(owner, icb.getAddress())
      ).to.be.greaterThanOrEqual(await tokenAmount);
    });

    it("Should successfully pay with token USDC/USDT in preSale", async function () {
      const { icb, owner, USDT_Address, usdt, funderAddr, latestBlock, saleEnd } =
        await deployment();
      const packageAmount = 1000;
      const setSaletype = 2;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp + 100;
      const saleEnds = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStart,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.be.equal(2);

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      await usdt.approve(icb, tokenAmount);
      expect(
        await usdt.allowance(owner, icb.getAddress())
      ).to.be.greaterThanOrEqual(await tokenAmount);

      await time.increaseTo(saleStart + 50);

      const funderWalletBalanceBefore = await usdt.balanceOf(funderAddr);
      await icb.payWithTokenInPresale(packageAmount, USDT_Address);
      const funderWalletBalanceAfter = await usdt.balanceOf(funderAddr);

      expect(await funderWalletBalanceAfter).to.be.greaterThan(
        await funderWalletBalanceBefore
      );

      expect(await usdt.balanceOf(funderAddr)).to.be.equal(
        await funderWalletBalanceAfter
      );
      expect(icb.payWithTokenInPresale(packageAmount, USDT_Address))
        .to.emit(icb, "FundTransfer")
        .withArgs(
          owner,
          packageAmount,
          estimateAmt[1],
          latestBlock.timestamp,
          lockMonths,
          vestingMonths,
          await icb.currentSaleType()
        );
    });
  });

  describe("Config Public Sale", async function () {
    it("Should not config pre sale, caller is not owner", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();

      const setSaletype = 4;
      const salePriceInDollar = 5000; //(0.0005)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStart = latestBlock.timestamp;
      const saleEnd = saleStart + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      try {
        await icb
          .connect(addr2)
          .configPrePublicSale(
            setSaletype,
            salePriceInDollar,
            everyDayIncreasePrice,
            saleStart,
            saleEnd,
            lockMonths,
            vestingMonths
          );
        throw new ERROR("Not owner");
      } catch (error) {
        expect(error.message).to.include("You are not the Owner");
      }
    });

    it("Should succesfully config public sale", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();

      const setSaletype = 4;
      const salePriceInDollar = 2000; //(0.0002)
      const everyDayIncreasePrice = 100; //(0.00001)
      const saleStarts = latestBlock.timestamp + 100;
      const saleEnds = saleStarts + 100;
      const lockMonths = 6;
      const vestingMonths = 12;

      await time.increaseTo(saleEnd + 10);
      await icb.configPrePublicSale(
        setSaletype,
        salePriceInDollar,
        everyDayIncreasePrice,
        saleStarts,
        saleEnds,
        lockMonths,
        vestingMonths
      );
      expect(await icb.currentSaleType()).to.be.equal(4);
      expect(await icb.saleStartTime()).to.be.greaterThan(
        latestBlock.timestamp
      );
      expect(await icb.saleEndTime()).to.be.greaterThan(
        await icb.saleStartTime()
      );
    });
  });
});
