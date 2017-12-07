/*
This Token Contract implements the standard token functionality (https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20-token-standard.md) 
as well as the following OPTIONAL extras intended for use by humans.
.*/

import "./StandardToken.sol";

pragma solidity ^0.4.17;

contract CharitySpaceToken is StandardToken {

  /* Public variables of the token */
  string public name;                   //fancy name: eg Simon Bucks
  uint8 public decimals;                //How many decimals to show. ie. There could 1000 base units with 3 decimals. Meaning 0.980 SBX = 980 base units. It's like comparing 1 wei to 1 ether.
  string public symbol;                 //An identifier: eg SBX

  address public owner;
  address private icoAddress;

  function CharitySpaceToken(address _icoAddress, address _teamAddress, address _advisorsAddress, address _bountyAddress, address _companyAddress) public {
      totalSupply =  20000000 * 10**18;                    // Update total supply 20.000.000 CHT
      uint256 publicSaleSupply = 16000000 * 10**18;        // Update public sale supply 16.000.000 CHT
      uint256 teamSupply = 1500000 * 10**18;               // Update charitySPACE team supply 1.500.000 CHT
      uint256 advisorsSupply = 700000 * 10**18;            // Update projects advisors supply 700.000 CHT
      uint256 bountySupply = 800000 * 10**18;              // Update projects bounty program supply 800.000 CHT
      uint256 companySupply = 1000000 * 10**18;            // Update charitySPACE company supply 1.000.000 CHT
      name = "charityTOKEN";
      decimals = 18;
      symbol = "CHT";
      
      balances[_icoAddress] = publicSaleSupply;
      Transfer(0, _icoAddress, publicSaleSupply);
      
      balances[_teamAddress] = teamSupply;
      Transfer(0, _teamAddress, teamSupply);
      
      balances[_advisorsAddress] = advisorsSupply;
      Transfer(0, _advisorsAddress, advisorsSupply);
      
      balances[_bountyAddress] = bountySupply;
      Transfer(0, _bountyAddress, bountySupply);
      
      balances[_companyAddress] = companySupply;
      Transfer(0, _companyAddress, companySupply);
      
      owner = msg.sender;
      icoAddress = _icoAddress;
  }

  function destroyUnsoldTokens() public {
    require(msg.sender == icoAddress || msg.sender == owner);
    uint256 value = balances[icoAddress];
    totalSupply -= value;
    balances[icoAddress] = 0;
  }
}