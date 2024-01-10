// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import './ICBNetworkPrivateSale.sol';
import './ICBNetworkPublicSale.sol';
import './ICBNetworkPreSale.sol';

contract ICBNetworkICO{
    ICBNetworkPrivateSale public _privateSale;
    ICBNetworkPreSale _one_presale;
    ICBNetworkPreSale _two_presale;
    ICBNetworkPublicSale _public_sale;

    constructor(address privateSaleContractOwner, address funderWallet, address usdtAddress, address usdcAddress){
        _privateSale = new ICBNetworkPrivateSale(privateSaleContractOwner,funderWallet,usdtAddress, usdcAddress);
      
    }

    
}