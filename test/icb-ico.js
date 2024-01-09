const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");

describe("ICB_ICO", async function () {
  async function deployment() {
    const provider = ethers.provider;
    const [owner, funderAddr] = await ethers.getSigners();
    const USDT_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
    const USDC_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
    const nativeAggreators = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const tokenDecimals = 6;
    const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
    const icb = await ICB_ICO_ETH.deploy(
      funderAddr,
      USDT_Address,
      USDC_Address,
      nativeAggreators,
      tokenDecimals
    );

    return { provider, icb, owner, funderAddr, USDT_Address, USDC_Address };
  }

  describe("Private Sale config", async function () {
    it("Should not set private sale config, caller is not owner", async function () {
      const { icb } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const timestamp = Date.now();
      const setSaletype = 1;
      const saleStart = timestamp + 100;
      const saleEnd = saleStart + 100;
      try {
        await icb
          .connect(addr2)
          .configPrivateSale(setSaletype, saleStart, saleEnd);
        throw new Error("Not Owner");
      } catch (error) {
        expect(error.message).to.be.include("You are not the Owner");
      }
    });

    it("Cannot set private sale config,Sale Start time should be greater than current time", async function () {
      const { icb } = await deployment();
      const setSaletype = 1;
      const saleStart = 0;
      const saleEnd = saleStart + 100;
      try {
        await icb.configPrivateSale(setSaletype, saleStart, saleEnd);
        throw new Error("Invalid Time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Cannot set private sale config,Sale End time should be greater than Start time", async function () {
      const { icb } = await deployment();
      const timestamp = Date.now();
      const setSaletype = 1;
      const saleStart = timestamp + 100;
      const saleEnd = 100;
      try {
        await icb.configPrivateSale(setSaletype, saleStart, saleEnd);
        throw new Error("Invalid Time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Should succesfully set the private sale config", async function () {
      const { icb } = await deployment();
      const timestamp = Date.now();
      const setSaletype = 1;
      const saleStart = timestamp + 100;
      const saleEnd = saleStart + 100;

      await icb.configPrivateSale(setSaletype, saleStart, saleEnd);

      expect(await icb.currentSaleType()).to.be.equal(1);
      expect(await icb.saleStartTime()).to.be.greaterThan(timestamp);
      expect(await icb.saleEndTime()).to.be.greaterThan(saleStart);
    });
  });

  describe("Add package data", async function () {
    it("Should not update the package data, Invalid packag amount", async function () {
      const { icb } = await deployment();
      const packageAmount = 500;
      const icbPerDollar = 0.0002 * 10 ** 7;
      const lockMonthTime = 6;
      const linearVestingTime = 6;
      try {
        await icb.addPackage(
          packageAmount,
          icbPerDollar,
          lockMonthTime,
          linearVestingTime
        );
        throw new Error("Invalid data");
      } catch (error) {
        expect(error.message).to.include("Invalid package amount");
      }
    });

    it("Should update the package data, with package amount 1000", async function () {
      const { icb } = await deployment();
      const packageAmount = 1000;
      const icbPerDollar = 0.0002 * 10 ** 7;
      const lockMonthTime = 6; // Time is in month
      const linearVestingTime = 6; // Time is in month

      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );
      const packages = await icb.packages(packageAmount);
      expect(await packages.icbPerDollar).to.be.equal(2000);
      expect(await packages.lockMonthTime).to.be.equal(lockMonthTime);
      expect(await packages.linearVestingTime).to.be.equal(linearVestingTime);
    });

    it("Should update the package data, with package amount 5000", async function () {
      const { icb } = await deployment();

      const packageAmount = 5000;
      const icbPerDollar = 0.00018 * 10 ** 7;
      const lockMonthTime = 6; // Time is in month
      const linearVestingTime = 3; // Time is in month

      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );
      const packages = await icb.packages(packageAmount);

      expect(await packages.icbPerDollar).to.be.equal(1800);
      expect(await packages.lockMonthTime).to.be.equal(lockMonthTime);
      expect(await packages.linearVestingTime).to.be.equal(linearVestingTime);
    });

    it("Should update the package data, with package amount 10000", async function () {
      const { icb } = await deployment();

      const packageAmount = 10000;
      const icbPerDollar = 0.00015 * 10 ** 7;
      const icbDollar = Number(icbPerDollar).toFixed(2);
      const icbDoller = Math.floor(icbDollar);
      const lockMonthTime = 3; // Time is in month
      const linearVestingTime = 3; // Time is in month

      await icb.addPackage(
        packageAmount,
        icbDoller,
        lockMonthTime,
        linearVestingTime
      );
      const packages = await icb.packages(packageAmount);
      expect(await packages.icbPerDollar).to.be.equal(icbDoller);
      expect(await packages.lockMonthTime).to.be.equal(lockMonthTime);
      expect(await packages.linearVestingTime).to.be.equal(linearVestingTime);
    });

    it("Should update the package data, with package amount 30000", async function () {
      const { icb } = await deployment();

      const packageAmount = 30000;
      const icbPerDollar = 0.0001 * 10 ** 7;
      const lockMonthTime = 1; // Time is in month
      const linearVestingTime = 3; // Time is in month

      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );
      const packages = await icb.packages(packageAmount);
      expect(await packages.icbPerDollar).to.be.equal(icbPerDollar);
      expect(await packages.lockMonthTime).to.be.equal(lockMonthTime);
      expect(await packages.linearVestingTime).to.be.equal(linearVestingTime);
    });
  });

  describe("Pay With Native In Private Sale", async function () {
    it("Cannot pay with native currency ETH, Sale type not matched", async function () {
      const { icb, owner, funderAddr, provider } = await deployment();
      const packageAmount = 1000;
      const icbPerDollar = 0.0002 * 10 ** 7;
      const lockMonthTime = 6; // Time is in month
      const linearVestingTime = 6; // Time is in month
      // update package details
      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );

      try {
        const estimateAmt = await icb.estimatePrivateFund(packageAmount, 0);
        await icb.payWithNativeInPrivate(packageAmount, {
          value: estimateAmt[0],
        });
        throw new Error("Error");
      } catch (error) {
        expect(error.message).to.include("Sale type is not matched");
      }
    });

    it("Cannot pay with native currency ETH, Current time is less than start time", async function () {
      const { icb, owner, funderAddr, provider } = await deployment();
      const packageAmount = 1000;
      const icbPerDollar = 0.0002 * 10 ** 7;
      const lockMonthTime = 6; // Time is in month
      const linearVestingTime = 6; // Time is in month
      // update package details
      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );

      try {
        const timestamp = Date.now();
        const setSaletype = 1;
        const saleStart = timestamp + 100;
        const saleEnd = saleStart + 100;
        await icb.configPrivateSale(setSaletype, saleStart, saleEnd);
        const estimateAmt = await icb.estimatePrivateFund(packageAmount, 0);
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

    it("Cannot pay with native currency ETH, Current time is greater than end time", async function () {
      const { icb, owner, funderAddr, provider } = await deployment();
      const packageAmount = 1000;
      const icbPerDollar = 0.0002 * 10 ** 7;
      const lockMonthTime = 6; // Time is in month
      const linearVestingTime = 6; // Time is in month
      // update package details
      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );

      try {
        const timestamp = Date.now();
        const setSaletype = 1;
        const saleStart = timestamp + 100;
        const saleEnd = saleStart + 100;
        await icb.configPrivateSale(setSaletype, saleStart, saleEnd);
        const estimateAmt = await icb.estimatePrivateFund(packageAmount, 0);
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
      const { icb } = await deployment();
      const packageAmount = 1000;
      const icbPerDollar = 0.0002 * 10 ** 7;
      const lockMonthTime = 6; // Time is in month
      const linearVestingTime = 6; // Time is in month
      // update package details
      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );

      try {
        const timestamp = Date.now();
        const setSaletype = 1;
        const saleStart = timestamp + 900;
        const saleEnd = saleStart + 100;
        await icb.configPrivateSale(setSaletype, saleStart, saleEnd);
        const estimateAmt = await icb.estimatePrivateFund(packageAmount, 0);
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
      const { icb, owner, funderAddr, provider } = await deployment();
      const packageAmount = 1000;
      const icbPerDollar = 0.0002 * 10 ** 7;
      const lockMonthTime = 6; // Time is in month
      const linearVestingTime = 6; // Time is in month
      // update package details
      await icb.addPackage(
        packageAmount,
        icbPerDollar,
        lockMonthTime,
        linearVestingTime
      );
      const packages = await icb.packages(packageAmount);
      const timestamp = Date.now();
      const setSaletype = 1;
      const saleStart = timestamp + 1000;
      const saleEnd = saleStart + 100;

      await icb.configPrivateSale(setSaletype, saleStart, saleEnd);
      const estimateAmt = await icb.estimatePrivateFund(packageAmount, 0);
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
});
