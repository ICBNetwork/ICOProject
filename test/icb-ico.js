const {
  time,
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const { latestBlock } = require("@nomicfoundation/hardhat-network-helpers/dist/src/helpers/time");

describe("ICB_ICO", async function () {
  async function deployment() {
    const provider = ethers.provider;
    const [owner, funderAddr] = await ethers.getSigners();
    const USDT_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
    const USDC_Address = "0xd9145CCE52D386f254917e481eB44e9943F39138";
    const nativeAggreators = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    const tokenDecimals = 6;
    const saleType = 1;
    const latestBlock = await ethers.provider.getBlock("latest");
    // Retrieve the timestamp from the latest block
    const currentTime = latestBlock.timestamp;
    const timestamp = Date.now();
    const saleStart = currentTime + 100000;
    const saleEnd = saleStart + 100;

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
      provider,
      icb,
      owner,
      funderAddr,
      USDT_Address,
      USDC_Address,
      saleStart,
      saleEnd,
      latestBlock
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
      const { icb, owner, funderAddr, provider } = await deployment();
      const packageAmount = 1000;

      await icb.toggleSale(0);

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

      try {
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
      const { icb, saleStart, saleEnd } = await deployment();
      const packageAmount = 1000;
      try {
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
      const { icb, saleStart, saleEnd } = await deployment();
      const packageAmount = 1000;

      try {
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
      const { icb, owner, funderAddr, provider, saleStart } = await deployment();
      const packageAmount = 1000;

      const packages = await icb.packages(packageAmount);
      const estimateAmt = await icb.estimatePrivateFund(packageAmount, 0);
      console.log(estimateAmt)
      expect(await icb.currentSaleType()).to.be.equal(1);
      await time.increaseTo(saleStart);
      const funderbalanceBefore = await provider.getBalance(funderAddr);
      await icb.payWithNativeInPrivate(packageAmount, {
        value: estimateAmt[0],
      });
      console.log(await icb.getUserDetails(owner));
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

  describe("Pay with token in private sale", async function () {

  })
});
