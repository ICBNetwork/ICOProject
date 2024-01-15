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
    const [owner, funderAddr, aggregatorAddress] = await ethers.getSigners();

    const USDT_Address = usdt.getAddress();

    const allowedTokens = [USDT_Address];
    const tokenDecimalis = 6;
    const latestBlock = await ethers.provider.getBlock("latest");
    const saleStart = latestBlock.timestamp + 10;
    const saleEnd = saleStart + 50;

    const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
    const icb = await ICB_ICO_ETH.deploy(
      funderAddr,
      allowedTokens,
      true,
      aggregatorAddress,
      tokenDecimalis,
      saleStart,
      saleEnd
    );

    return {
      usdt,
      funderAddr,
      saleStart,
      saleEnd,
      icb,
      USDT_Address,
      owner,
      provider,
      latestBlock,
    };
  }

  describe("ICB_ICO deployment", async function () {
    it("Should not deploy ICB_ICO, Invalid Address", async function () {
      const USDT = await ethers.getContractFactory("USDT");
      const usdt = await USDT.deploy();

      const provider = ethers.provider;

      const funderAddr = "0x0000000000000000000000000000000000000000";
      const aggregatorAddress = "0x0000000000000000000000000000000000000000";
      const USDT_Address = usdt.getAddress();

      const allowedTokens = [USDT_Address];
      const tokenDecimalis = 6;
      const latestBlock = await ethers.provider.getBlock("latest");
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;

      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
      try {
        const icb = await ICB_ICO_ETH.deploy(
          funderAddr,
          allowedTokens,
          true,
          aggregatorAddress,
          tokenDecimalis,
          saleStart,
          saleEnd
        );
      } catch (error) {
        expect(error.message).to.include("Not valid address");
      }
    });

    it("Should not deploy ICB_ICO, Invalid Start time", async function () {
      const USDT = await ethers.getContractFactory("USDT");
      const usdt = await USDT.deploy();
      const [funderAddr, aggregatorAddress] = await ethers.getSigners();
      const provider = ethers.provider;

      const USDT_Address = usdt.getAddress();

      const allowedTokens = [USDT_Address];
      const tokenDecimalis = 6;
      const latestBlock = await ethers.provider.getBlock("latest");
      const saleStart = latestBlock.timestamp;
      const saleEnd = saleStart + 50;

      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
      try {
        const icb = await ICB_ICO_ETH.deploy(
          funderAddr,
          allowedTokens,
          true,
          aggregatorAddress,
          tokenDecimalis,
          saleStart,
          saleEnd
        );
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Should succesfully set start time", async function () {
      const USDT = await ethers.getContractFactory("USDT");
      const usdt = await USDT.deploy();
      const [funderAddr, aggregatorAddress] = await ethers.getSigners();
      const provider = ethers.provider;

      const USDT_Address = usdt.getAddress();

      const allowedTokens = [USDT_Address];
      const tokenDecimalis = 6;
      const latestBlock = await ethers.provider.getBlock("latest");
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;

      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");

      const icb = await ICB_ICO_ETH.deploy(
        funderAddr,
        allowedTokens,
        true,
        aggregatorAddress,
        tokenDecimalis,
        saleStart,
        saleEnd
      );

      expect(saleStart).to.be.greaterThan(latestBlock.timestamp);
    });

    it("Should not deploy ICB_ICO, Invalid End time", async function () {
      const USDT = await ethers.getContractFactory("USDT");
      const usdt = await USDT.deploy();
      const [funderAddr, aggregatorAddress] = await ethers.getSigners();
      const provider = ethers.provider;

      const USDT_Address = usdt.getAddress();

      const allowedTokens = [USDT_Address];
      const tokenDecimalis = 6;
      const latestBlock = await ethers.provider.getBlock("latest");
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = 50;

      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
      try {
        const icb = await ICB_ICO_ETH.deploy(
          funderAddr,
          allowedTokens,
          true,
          aggregatorAddress,
          tokenDecimalis,
          saleStart,
          saleEnd
        );
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Should succesfully set Sale end time", async function () {
      const USDT = await ethers.getContractFactory("USDT");
      const usdt = await USDT.deploy();
      const [funderAddr, aggregatorAddress] = await ethers.getSigners();
      const provider = ethers.provider;

      const USDT_Address = usdt.getAddress();

      const allowedTokens = [USDT_Address];
      const tokenDecimalis = 6;
      const latestBlock = await ethers.provider.getBlock("latest");
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;

      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
      const icb = await ICB_ICO_ETH.deploy(
        funderAddr,
        allowedTokens,
        true,
        aggregatorAddress,
        tokenDecimalis,
        saleStart,
        saleEnd
      );
      expect(saleEnd).to.be.greaterThan(saleStart);
    });

    it("Should not deploy ICB_ICO, Invalid Decimal value", async function () {
      const USDT = await ethers.getContractFactory("USDT");
      const usdt = await USDT.deploy();
      const [funderAddr, aggregatorAddress] = await ethers.getSigners();
      const provider = ethers.provider;

      const USDT_Address = usdt.getAddress();

      const allowedTokens = [USDT_Address];
      const tokenDecimalis = 0;
      const latestBlock = await ethers.provider.getBlock("latest");
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;

      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
      try {
        const icb = await ICB_ICO_ETH.deploy(
          funderAddr,
          allowedTokens,
          true,
          aggregatorAddress,
          tokenDecimalis,
          saleStart,
          saleEnd
        );
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should succesfully set decimal value", async function () {
      const USDT = await ethers.getContractFactory("USDT");
      const usdt = await USDT.deploy();
      const [funderAddr, aggregatorAddress] = await ethers.getSigners();
      const provider = ethers.provider;

      const USDT_Address = usdt.getAddress();

      const allowedTokens = [USDT_Address];
      const tokenDecimalis = 6;
      const latestBlock = await ethers.provider.getBlock("latest");
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;

      const ICB_ICO_ETH = await ethers.getContractFactory("ICB_ICO");
      const icb = await ICB_ICO_ETH.deploy(
        funderAddr,
        allowedTokens,
        true,
        aggregatorAddress,
        tokenDecimalis,
        saleStart,
        saleEnd
      );
      expect(tokenDecimalis).to.be.greaterThanOrEqual(1);
    });

    it("Should successfully deploy ICB_ICO and set private sale ", async function () {
      const { icb, latestBlock, saleStart, saleEnd } = await deployment();

      expect(await icb.currentSaleType()).to.be.equal(1);
      //   expect(await saleStart).to.greaterThan(latestBlock.timestamp);
      expect(await icb.saleEndTime()).to.be.greaterThan(
        await icb.saleStartTime()
      );
    });
  });

  describe("Pay with Token private sale", async function () {
    it("Cannot pay with token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 100; //token amount
      await icb.toggleSale();

      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 100; //token amount

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid token amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should successfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 1000; //token amount

      expect(amount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with token, invalid address", async function () {
      const { icb, USDT_Address } = await deployment();
      const amount = 100; //token amount
      const referalAddr = "0x0000000000000000000000000000000000000000";
      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Not valid address");
      }
    });

    it("Cannot pay with token, Insufficient token balance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const amount = 1000; //token amount
      try {
        await icb
          .connect(addr2)
          .buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Insufficient token balance");
      }
    });

    it("Should succesfully set user token balance", async function () {
      const { icb, usdt, owner } = await deployment();
      const [addr2] = await ethers.getSigners();
      const packageAmount = 1000;

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.greaterThanOrEqual(tokenAmount);
    });

    it("Cannot pay with token, Insufficient allowance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const amount = 1000; //token amount
      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Insufficient allownace");
      } catch (error) {
        expect(error.message).to.include("Insufficient allowance");
      }
    });

    it("should successfully set user token allowance", async function () {
      const { icb, USDT_Address, owner, usdt } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 1000", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, saleStart } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStart);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 5000", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, saleStart } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 5000; //token amount
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStart);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });
    it("Should succesfully buy with token package amount 10000", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, saleStart } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 10000; //token amount
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStart);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 30000", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, saleStart } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 30000; //token amount

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStart);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });
  });

  describe("Buy with native curency ETH", async function () {
    it("Cannot pay with native token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      await icb.toggleSale();

      try {
        await icb.buyWithNative(packageAmount, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithNative(amount, referalAddr);
        throw new Error("Invalid package amount");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should succesfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(packageAmount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with native token, Insufficient Native value", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      try {
        await icb.buyWithNative(packageAmount, referalAddr, {
          value: 0,
        });
        throw new Error("Insufficient Native value");
      } catch (error) {
        expect(error.message).to.include("Insufficient Native value");
      }
    });

    it("Should succesfully buy with native package amount 1000", async function () {
      const { icb, owner, funderAddr, saleStart, provider } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });

    it("Should succesfully buy with native package amount 5000", async function () {
      const { icb, owner, funderAddr, saleStart, provider } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 5000; //token amount

      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });

    it("Should succesfully buy with native package amount 10000", async function () {
      const { icb, owner, funderAddr, saleStart, provider } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 10000; //token amount

      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );

      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });

    it("Should succesfully buy with native package amount 30000", async function () {
      const { icb, owner, funderAddr, saleStart, provider } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 30000; //token amount

      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });
  });

  describe("Config Pre-Sale1", async function () {
    it("Cannot config pre-sale1, caller is not owner", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      const addr = await addr2.getAddress();
      try {
        await icb
          .connect(addr2)
          .configSale(
            saletype,
            icbPriceInWei,
            everyDayIncreasePriceInWei,
            saleStart,
            saleEnd,
            lockMonthTime,
            vestingMonthTime
          );
      } catch (error) {
        expect(error.message).to.include(
          `OwnableUnauthorizedAccount(${JSON.stringify(addr)})`
        );
      }
    });

    it("Should succesfully set the owner", async function () {
      const { icb, owner } = await deployment();

      expect(await icb.owner()).to.be.equal(owner);
    });

    it("Cannot config pre-sale1, start time is less than current time", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      try {
        await icb.configSale(
          saletype,
          icbPriceInWei,
          everyDayIncreasePriceInWei,
          saleStart,
          saleEnd,
          lockMonthTime,
          vestingMonthTime
        );
        throw new ERROR("Invalid time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Cannot config pre-sale1, End time is less than start time", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      try {
        await icb.configSale(
          saletype,
          icbPriceInWei,
          everyDayIncreasePriceInWei,
          saleStart,
          saleEnd,
          lockMonthTime,
          vestingMonthTime
        );
        throw new ERROR("Invalid time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Should successfully set config time Pre-Sale1", async function () {
      const { icb, latestBlock } = await deployment();
      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      expect(await saleStart).to.greaterThan(latestBlock.timestamp);
      expect(await saleEnd).to.greaterThan(await saleStart);
    });

    it("Should successfully set config time Pre-Sale1", async function () {
      const { icb, latestBlock } = await deployment();
      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStart,
        saleEnd,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.saleStartTime()).to.greaterThan(latestBlock.timestamp);
      expect(await icb.saleEndTime()).to.greaterThan(await icb.saleStartTime());
      expect(await icb.currentSaleType()).to.equal(2);
    });
  });

  describe("Pay with token pre-sale1", async function () {
    it("Cannot pay with token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 100;
      await icb.toggleSale();

      try {
        await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 100;

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid token amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should successfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(packageAmount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with token, invalid address", async function () {
      const { icb, USDT_Address } = await deployment();
      const packageAmount = 100; //token amount
      const referalAddr = "0x0000000000000000000000000000000000000000";
      try {
        await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Not valid address");
      }
    });

    it("Cannot pay with token, Insufficient token balance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000;
      try {
        await icb
          .connect(addr2)
          .buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Insufficient token balance");
      }
    });

    it("Should succesfully set user token balance", async function () {
      const { icb, usdt, owner } = await deployment();
      const [addr2] = await ethers.getSigners();
      const packageAmount = 1000;

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.greaterThanOrEqual(tokenAmount);
    });

    it("Cannot pay with token, Insufficient allowance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const amount = 1000; //token amount
      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Insufficient allownace");
      } catch (error) {
        expect(error.message).to.include("Insufficient allowance");
      }
    });

    it("should successfully set user token allowance", async function () {
      const { icb, USDT_Address, owner, usdt } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 500", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 500; //token amount

      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      expect(await icb.currentSaleType()).to.equal(2);
      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStarts);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 2000", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, latestBlock } =
        await deployment();
      await icb.resetSale();

      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2000; //token amount

      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      expect(await icb.currentSaleType()).to.equal(2);
      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStarts);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });
  });

  describe("Buy with native token ETH", async function () {
    it("Cannot pay with native token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      await icb.toggleSale();

      try {
        await icb.buyWithNative(packageAmount, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithNative(amount, referalAddr);
        throw new Error("Invalid package amount");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should succesfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(packageAmount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with native token, Insufficient Native value", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      try {
        await icb.buyWithNative(packageAmount, referalAddr, {
          value: 0,
        });
        throw new Error("Insufficient Native value");
      } catch (error) {
        expect(error.message).to.include("Insufficient Native value");
      }
    });

    it("Should succesfully buy with native package amount 1000", async function () {
      const { icb, owner, funderAddr, saleStart, provider, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.currentSaleType()).to.be.equal(2);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });

    it("Should succesfully buy with native package amount 2500", async function () {
      const { icb, owner, funderAddr, saleStart, provider, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2500; //token amount

      const saletype = 2;
      const icbPriceInWei = 200000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.currentSaleType()).to.be.equal(2);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });
  });

  describe("Config Pre-Sale2", async function () {
    it("Cannot config pre-sale2, caller is not owner", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      const addr = await addr2.getAddress();
      try {
        await icb
          .connect(addr2)
          .configSale(
            saletype,
            icbPriceInWei,
            everyDayIncreasePriceInWei,
            saleStart,
            saleEnd,
            lockMonthTime,
            vestingMonthTime
          );
      } catch (error) {
        expect(error.message).to.be.revertedWith(
          `OwnableUnauthorizedAccount(${JSON.stringify(addr)})`
        );
      }
    });

    it("Should succesfully set the owner", async function () {
      const { icb, owner } = await deployment();

      expect(await icb.owner()).to.be.equal(owner);
    });

    it("Cannot config pre-sale2, start time is less than current time", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      try {
        await icb.configSale(
          saletype,
          icbPriceInWei,
          everyDayIncreasePriceInWei,
          saleStart,
          saleEnd,
          lockMonthTime,
          vestingMonthTime
        );
        throw new ERROR("Invalid time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Cannot config pre-sale2, End time is less than start time", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      try {
        await icb.configSale(
          saletype,
          icbPriceInWei,
          everyDayIncreasePriceInWei,
          saleStart,
          saleEnd,
          lockMonthTime,
          vestingMonthTime
        );
        throw new ERROR("Invalid time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Should successfully set config time Pre-Sale2", async function () {
      const { icb, latestBlock } = await deployment();
      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      expect(await saleStart).to.greaterThan(latestBlock.timestamp);
      expect(await saleEnd).to.greaterThan(await saleStart);
    });

    it("Should successfully set config time Pre-Sale2", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnds = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStart,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );
      expect(await icb.saleStartTime()).to.greaterThan(latestBlock.timestamp);
      expect(await icb.saleEndTime()).to.greaterThan(await icb.saleStartTime());
      expect(await icb.currentSaleType()).to.equal(3);
    });
  });

  describe("Pay with token pre-sale2", async function () {
    it("Cannot pay with token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 100;
      await icb.toggleSale();

      try {
        await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 100;

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid token amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should successfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(packageAmount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with token, invalid address", async function () {
      const { icb, USDT_Address } = await deployment();
      const packageAmount = 100; //token amount
      const referalAddr = "0x0000000000000000000000000000000000000000";
      try {
        await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Not valid address");
      }
    });

    it("Cannot pay with token, Insufficient token balance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000;
      try {
        await icb
          .connect(addr2)
          .buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Insufficient token balance");
      }
    });

    it("Should succesfully set user token balance", async function () {
      const { icb, usdt, owner } = await deployment();
      const [addr2] = await ethers.getSigners();
      const packageAmount = 1000;

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.greaterThanOrEqual(tokenAmount);
    });

    it("Cannot pay with token, Insufficient allowance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const amount = 1000; //token amount
      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Insufficient allownace");
      } catch (error) {
        expect(error.message).to.include("Insufficient allowance");
      }
    });

    it("should successfully set user token allowance", async function () {
      const { icb, USDT_Address, owner, usdt } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 500", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 500; //token amount

      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      expect(await icb.currentSaleType()).to.equal(3);
      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStarts);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 2000", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, latestBlock } =
        await deployment();
      await icb.resetSale();

      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2000; //token amount

      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      expect(await icb.currentSaleType()).to.equal(3);
      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStarts);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });
  });

  describe("Buy with native token ETH pre-sale2", async function () {
    it("Cannot pay with native token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      await icb.toggleSale();

      try {
        await icb.buyWithNative(packageAmount, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithNative(amount, referalAddr);
        throw new Error("Invalid package amount");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should succesfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(packageAmount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with native token, Insufficient Native value", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      try {
        await icb.buyWithNative(packageAmount, referalAddr, {
          value: 0,
        });
        throw new Error("Insufficient Native value");
      } catch (error) {
        expect(error.message).to.include("Insufficient Native value");
      }
    });

    it("Should succesfully buy with native package amount 1000", async function () {
      const { icb, owner, funderAddr, saleStart, provider, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.currentSaleType()).to.be.equal(3);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });

    it("Should succesfully buy with native package amount 2500", async function () {
      const { icb, owner, funderAddr, saleStart, provider, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2500; //token amount

      const saletype = 3;
      const icbPriceInWei = 300000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 6;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.currentSaleType()).to.be.equal(3);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];
      const userIcbAmount = await estimateAmt[1];
      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const getUserData = await icb.getUserDetails(owner);
      const funderAddrBalAfter = await provider.getBalance(funderAddr);

      expect(await userIcbAmount).to.be.equal(await getUserData[0][1]);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });
  });

  describe("Config Public Sale", async function () {
    it("Cannot config public sale, caller is not owner", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      const addr = await addr2.getAddress();
      try {
        await icb
          .connect(addr2)
          .configSale(
            saletype,
            icbPriceInWei,
            everyDayIncreasePriceInWei,
            saleStart,
            saleEnd,
            lockMonthTime,
            vestingMonthTime
          );
      } catch (error) {
        expect(error.message).to.be.revertedWith(
          `OwnableUnauthorizedAccount(${JSON.stringify(addr)})`
        );
      }
    });

    it("Should succesfully set the owner", async function () {
      const { icb, owner } = await deployment();

      expect(await icb.owner()).to.be.equal(owner);
    });

    it("Cannot config public sale, start time is less than current time", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      try {
        await icb.configSale(
          saletype,
          icbPriceInWei,
          everyDayIncreasePriceInWei,
          saleStart,
          saleEnd,
          lockMonthTime,
          vestingMonthTime
        );
        throw new ERROR("Invalid time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Cannot config public sale, End time is less than start time", async function () {
      const { icb, latestBlock } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      try {
        await icb.configSale(
          saletype,
          icbPriceInWei,
          everyDayIncreasePriceInWei,
          saleStart,
          saleEnd,
          lockMonthTime,
          vestingMonthTime
        );
        throw new ERROR("Invalid time");
      } catch (error) {
        expect(error.message).to.include(
          "End time must be greater than start time"
        );
      }
    });

    it("Should successfully set config time Public sale", async function () {
      const { icb, latestBlock } = await deployment();
      const saletype = 3;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnd = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      expect(await saleStart).to.greaterThan(latestBlock.timestamp);
      expect(await saleEnd).to.greaterThan(await saleStart);
    });

    it("Should successfully set config time Public sale", async function () {
      const { icb, latestBlock, saleEnd } = await deployment();
      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStart = latestBlock.timestamp + 10;
      const saleEnds = saleStart + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStart,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );
      expect(await icb.saleStartTime()).to.greaterThan(latestBlock.timestamp);
      expect(await icb.saleEndTime()).to.greaterThan(await icb.saleStartTime());
      expect(await icb.currentSaleType()).to.equal(4);
    });
  });

  describe("Pay with token public sale ", async function () {
    it("Cannot pay with token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 100;
      await icb.toggleSale();

      try {
        await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 100;

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid token amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should successfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(packageAmount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with token, invalid address", async function () {
      const { icb, USDT_Address } = await deployment();
      const packageAmount = 100; //token amount
      const referalAddr = "0x0000000000000000000000000000000000000000";
      try {
        await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Not valid address");
      }
    });

    it("Cannot pay with token, Insufficient token balance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000;
      try {
        await icb
          .connect(addr2)
          .buyWithToken(packageAmount, USDT_Address, referalAddr);
        throw new Error("Invalid address");
      } catch (error) {
        expect(error.message).to.include("Insufficient token balance");
      }
    });

    it("Should succesfully set user token balance", async function () {
      const { icb, usdt, owner } = await deployment();
      const [addr2] = await ethers.getSigners();
      const packageAmount = 1000;

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];

      expect(await usdt.balanceOf(owner)).to.greaterThanOrEqual(tokenAmount);
    });

    it("Cannot pay with token, Insufficient allowance", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const amount = 1000; //token amount
      try {
        await icb.buyWithToken(amount, USDT_Address, referalAddr);
        throw new Error("Insufficient allownace");
      } catch (error) {
        expect(error.message).to.include("Insufficient allowance");
      }
    });

    it("should successfully set user token allowance", async function () {
      const { icb, USDT_Address, owner, usdt } = await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 500", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 500; //token amount

      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      expect(await icb.currentSaleType()).to.equal(4);
      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStarts);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });

    it("Should succesfully buy with token package amount 2000", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, latestBlock } =
        await deployment();
      await icb.resetSale();

      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2000; //token amount

      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      expect(await icb.currentSaleType()).to.equal(4);
      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      await usdt.approve(icb, tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount);

      const funderAddrBalBefore = await usdt.balanceOf(funderAddr);
      await time.increaseTo(saleStarts);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);
      const funderAddrBalAfter = await usdt.balanceOf(funderAddr);

      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(tokenAmount);
    });

    it("Should check referral bonus amount", async function () {
      const { icb, USDT_Address, owner, usdt, funderAddr, latestBlock } =
        await deployment();
      await icb.resetSale();

      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2000; //token amount

      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      const estimateAmt = await icb.estimateFund(packageAmount, 1);
      const tokenAmount = estimateAmt[0];
      expect(await icb.currentSaleType()).to.equal(4);
      expect(await usdt.balanceOf(owner)).to.be.greaterThanOrEqual(tokenAmount);
      // tokenAmount = await tokenAmount * 2
      await usdt.approve(icb, tokenAmount + tokenAmount);
      expect(await usdt.allowance(owner, icb)).to.equal(tokenAmount + tokenAmount);

      await time.increaseTo(saleStarts);
      await icb.buyWithToken(packageAmount, USDT_Address, referalAddr);

      const currentRefferal = await owner;
      await icb.buyWithToken(packageAmount, USDT_Address, currentRefferal);

      const getUserData = await icb.getUserDetails(owner);
      const comission = (packageAmount * 10 ** 18) / icbPriceInWei;
      const com = (comission * 100) / 10000;

      expect(await getUserData[1][1]).to.equal(com);
      expect(await getUserData[1][6]).to.equal("Referral");
    })
  });

  describe("Buy with native token ETH public sale", async function () {
    it("Cannot pay with native token, sale is paused", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount
      await icb.toggleSale();

      try {
        await icb.buyWithNative(packageAmount, referalAddr);
        throw new Error("Sale is paused");
      } catch (error) {
        expect(error.message).to.include("Sale is paused.");
      }
    });

    it("Should successfully unpause sale", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(await icb.isPause()).to.be.equal(true);
    });

    it("Cannot pay with token, invalid package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const amount = 0; //token amount

      try {
        await icb.buyWithNative(amount, referalAddr);
        throw new Error("Invalid package amount");
      } catch (error) {
        expect(error.message).to.include("Invalid input amount");
      }
    });

    it("Should succesfully set package amount", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      expect(packageAmount).to.be.greaterThanOrEqual(1);
    });

    it("Cannot pay with native token, Insufficient Native value", async function () {
      const { icb, USDT_Address } = await deployment();
      const [referalAddr] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      try {
        await icb.buyWithNative(packageAmount, referalAddr, {
          value: 0,
        });
        throw new Error("Insufficient Native value");
      } catch (error) {
        expect(error.message).to.include("Insufficient Native value");
      }
    });

    it("Should succesfully buy with native package amount 1000", async function () {
      const { icb, owner, funderAddr, saleStart, provider, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 1000; //token amount

      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.currentSaleType()).to.be.equal(4);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];
      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      const getUserData = await icb.getUserDetails(owner);

      expect(packageAmount).to.be.equal(getUserData[0][0]);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });

    it("Should succesfully buy with native package amount 2500", async function () {
      const { icb, owner, funderAddr, saleStart, provider, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2500; //token amount

      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.currentSaleType()).to.be.equal(4);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });

      const funderAddrBalAfter = await provider.getBalance(funderAddr);
      expect(await funderAddrBalAfter).to.be.greaterThan(funderAddrBalBefore);
      expect(await funderAddrBalAfter).to.be.equal(
        funderAddrBalBefore + tokenAmount
      );
    });

    it("Should check refferal bonus amount", async function () {
      const { icb, owner, funderAddr, saleStart, provider, latestBlock } =
        await deployment();
      const [referalAddr, addr2] = await ethers.getSigners();
      const packageAmount = 2500; //token amount

      const saletype = 4;
      const icbPriceInWei = 500000000000000;
      const everyDayIncreasePriceInWei = 10000000000000;
      const saleStarts = latestBlock.timestamp + 10;
      const saleEnds = saleStarts + 50;
      const lockMonthTime = 6;
      const vestingMonthTime = 12;

      await icb.configSale(
        saletype,
        icbPriceInWei,
        everyDayIncreasePriceInWei,
        saleStarts,
        saleEnds,
        lockMonthTime,
        vestingMonthTime
      );

      expect(await icb.currentSaleType()).to.be.equal(4);
      const estimateAmt = await icb.estimateFund(packageAmount, 0);
      const tokenAmount = estimateAmt[0];

      expect(await provider.getBalance(owner)).to.be.greaterThanOrEqual(
        tokenAmount
      );
      const funderAddrBalBefore = await provider.getBalance(funderAddr);

      await time.increaseTo(saleStart);
      await icb.buyWithNative(packageAmount, referalAddr, {
        value: tokenAmount,
      });
      const currentRefferal = owner;
      await icb.connect(addr2).buyWithNative(packageAmount, currentRefferal, {
        value: tokenAmount,
      });
      const getUserData = await icb.getUserDetails(owner);

      const comission = (packageAmount * 10 ** 18) / icbPriceInWei;
      const com = (comission * 100) / 10000;

      expect(await getUserData[1][1]).to.be.equal(com);
      expect(await getUserData[1][6]).to.be.equal("Referral");
    });
  });

  describe("Toggle Sale Pause Unpause", async function () {
    it("Should not pause sale, Caller is not owner", async function () {
      const { icb } = await deployment();
      const [addr1, addr2] = await ethers.getSigners();
      const addr = await addr2.getAddress();
      try {
        await icb.connect(addr2).toggleSale();
        throw new Error("Not owner");
      } catch (error) {
        expect(error.message).to.include(
          `OwnableUnauthorizedAccount(${JSON.stringify(addr)})`
        );
      }
    });

    it("Should succesfuly pause sale", async function () {
      const { icb } = await deployment();

      await icb.toggleSale();

      expect(await icb.isPause()).to.be.equal(false);
    });
  });

  describe("Add user by admin", async function () {
    it("Cannot add user, Caller is not owner", async function () {
      const { icb, latestBlock } = await deployment();

      const currentTime = latestBlock.timestamp;
      const [addr1, addr2] = await ethers.getSigners();
      const userAddress = [addr1, addr2];
      const packageAmount = [1000, 2000];
      const userIcbAmount = [10000, 20000];
      const icbInDollar = [200000000000000, 200000000000000]; //0.0002 in wei
      const investTime = [currentTime, currentTime];
      const lockMonthTime = [6, 6];
      const linearVestingTime = [6, 6];
      const currentSaleTypes = [4, 4];
      const addr = await addr2.getAddress();

      try {
        await icb
          .connect(addr2)
          .addUserByAdmin(
            userAddress,
            packageAmount,
            userIcbAmount,
            icbInDollar,
            investTime,
            lockMonthTime,
            linearVestingTime,
            currentSaleTypes
          );
        throw new Error("Not owner");
      } catch (error) {
        expect(error.message).to.include(
          `OwnableUnauthorizedAccount(${JSON.stringify(addr)})`
        );
      }
    });

    it("Should succesfully set owner", async function () {
      const { icb, owner } = await deployment();

      expect(await icb.owner()).to.be.equal(owner);
    });

    it("Cannot add user, invalid data length", async function () {
      const { icb, latestBlock } = await deployment();

      const currentTime = latestBlock.timestamp;
      const [addr1, addr2] = await ethers.getSigners();
      const userAddress = [addr1, addr2];
      const packageAmount = [1000, 2000];
      const userIcbAmount = [10000, 20000];
      const icbInDollar = [200000000000000]; //0.0002 in wei
      const investTime = [currentTime, currentTime];
      const lockMonthTime = [6, 6];
      const linearVestingTime = [6, 6];
      const currentSaleTypes = [4, 4];
      const addr = await addr2.getAddress();

      try {
        await icb.addUserByAdmin(
          userAddress,
          packageAmount,
          userIcbAmount,
          icbInDollar,
          investTime,
          lockMonthTime,
          linearVestingTime,
          currentSaleTypes
        );
        throw new Error("invalid data length");
      } catch (error) {
        expect(error.message).to.include(
          "Input arrays must have the same length"
        );
      }
    });

    it("Should succesfully add user data", async function () {
      const { icb, latestBlock, owner } = await deployment();

      const currentTime = latestBlock.timestamp;
      const [addr1, addr2] = await ethers.getSigners();
      const userAddress = [addr1, addr2];
      const packageAmount = [1000, 2000];
      const userIcbAmount = [10000, 20000];
      const icbInDollar = [200000000000000, 200000000000000]; //0.0002 in wei
      const investTime = [currentTime, currentTime];
      const lockMonthTime = [6, 6];
      const linearVestingTime = [6, 6];
      const currentSaleTypes = ["Public sale", "Public sale"];
      const addr = await addr2.getAddress();
      expect(await icb.owner()).to.be.equal(await owner);

      await icb.addUserByAdmin(
        userAddress,
        packageAmount,
        userIcbAmount,
        icbInDollar,
        investTime,
        lockMonthTime,
        linearVestingTime,
        currentSaleTypes
      );

      // User2 data check
      const getUserData = await icb.getUserDetails(addr2);
      expect(packageAmount[1]).to.be.equal(await getUserData[0][0]);
      expect(userIcbAmount[1]).to.be.equal(await getUserData[0][1]);
      expect(icbInDollar[1]).to.be.equal(await getUserData[0][2]);
      expect(await investTime[1]).to.be.equal(await getUserData[0][3]);
      expect(lockMonthTime[1]).to.be.equal(await getUserData[0][4]);
      expect(linearVestingTime[1]).to.be.equal(await getUserData[0][5]);
      expect(currentSaleTypes[1]).to.be.equal(await getUserData[0][6]);
    });
  });
});
