// scripts/deploy.js
const { ethers } = require("hardhat");

async function main() {
    const MyToken = await ethers.getContractFactory("ICBNetworkToken");
    const myToken = await MyToken.deploy("1000000000000000000000000000"); // Initial supply of 1 billion tokens
    await myToken.deployed();

    console.log("Token deployed to:", myToken.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });