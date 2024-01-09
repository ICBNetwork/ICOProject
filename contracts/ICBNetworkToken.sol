// contracts/MyToken.sol
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ICBNetworkToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("ICBNetwork", "ICB") {
        _mint(msg.sender, initialSupply);
    }
}