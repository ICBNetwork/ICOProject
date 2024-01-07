require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
require("@nomicfoundation/hardhat-verify");


/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks:{
    rinkby : {
      url : process.env.TESTNET_ALCHEMY_RPC_URL, // you can use other RPC url as well
      accounts:[process.env.TESTNET_PRIVATE_KEY], 
    },
    etherscan: {
      apiKey: process.env.ETHERSCAN_API_KEY,
    },
  },
};
