/*
The Crowdsale contract.
.*/

import "./CharitySpaceToken.sol";

pragma solidity ^0.4.17;

contract CharitySpace {
  
  struct Tier {
    uint256 tokens;
    uint256 tokensSold;
    uint256 price;
  }
  
  // Events
  event ReceivedETH(address addr, uint value);
  event ReceivedBTC(address addr, uint value, string txid);
  event ReceivedBCH(address addr, uint value, string txid);
  event ReceivedLTC(address addr, uint value, string txid);
  
  // Public variables
  CharitySpaceToken public charitySpaceToken;
  address public owner;
  address public donationsAddress;
  uint public startDate;
  uint public endDate;
  uint public preIcoEndDate;
  uint256 public tokensSold = 0;
  bool public setuped = false;
  bool public started = false;
  bool public live = false;
  uint public preIcoMaxLasts = 7 days;
  // Ico tiers variables
  Tier[] public tiers;
  
  // Alt currencies hash
  bytes32 private btcHash = keccak256('BTC');
  bytes32 private bchHash = keccak256('BCH');
  
  // Interceptors
  modifier onlyBy(address a) {
    require(msg.sender == a); 
    _;
  }
  
  modifier respectTimeFrame() {
    require((now > startDate) && (now < endDate));
    _;
  }
  
  function CharitySpace(address _donationsAddress) public {
    owner = msg.sender;
    donationsAddress = _donationsAddress; //address where eth's are holded
  }
  
  function setup(address _charitySpaceToken) public onlyBy(owner) {
    require(started == false);
    require(setuped == false);
    charitySpaceToken = CharitySpaceToken(_charitySpaceToken);
    Tier memory preico = Tier(2500000 * 10**18, 0, 0.0007 * 10**18);
    Tier memory tier1 = Tier(3000000 * 10**18, 0, 0.001 * 10**18);
    Tier memory tier2 = Tier(3500000 * 10**18, 0, 0.0015 * 10**18);
    Tier memory tier3 = Tier(7000000 * 10**18, 0, 0.002 * 10**18);
    tiers.push(preico);
    tiers.push(tier1);
    tiers.push(tier2);
    tiers.push(tier3);
    setuped = true;
  }
  
  // Start CharitySPACE ico!
  function start() public onlyBy(owner) {
    require(started == false);
		startDate = now;            
		endDate = now + 30 days + 2 hours; // ico duration + backup time
    preIcoEndDate = now + preIcoMaxLasts;
    live = true;
    started = true;
  }
  
  function end() public onlyBy(owner) {
    require(started == true);
    require(live == true);
    require(now > endDate);
    charitySpaceToken.destroyUnsoldTokens();
    live = false;
    started = true;
  }
  
  function receiveDonation() public payable respectTimeFrame {
    uint256 _value = msg.value;
    uint256 _tokensToTransfer = 0;
    require(_value > 0);
    
    uint256 _tokens = 0;
    if(preIcoEndDate > now) {
      _tokens = _value * 10**18 / tiers[0].price;
      if((tiers[0].tokens - tiers[0].tokensSold) < _tokens) {
        _tokens = (tiers[0].tokens - tiers[0].tokensSold);
        _value -= ((_tokens * tiers[0].price) / 10**18);
      } else {
        _value = 0;
      }
      tiers[0].tokensSold += _tokens;
      _tokensToTransfer += _tokens;
    }
    if(_value > 0) {
      for (uint i = 1; i < tiers.length; ++i) {
        if(_value > 0 && (tiers[i].tokens > tiers[i].tokensSold)) {
          _tokens = _value * 10**18 / tiers[i].price;
          if((tiers[i].tokens - tiers[i].tokensSold) < _tokens) {
            _tokens = (tiers[i].tokens - tiers[i].tokensSold);
            _value -= ((_tokens * tiers[i].price) / 10**18);
          } else {
            _value = 0;
          }
          tiers[i].tokensSold += _tokens;
          _tokensToTransfer += _tokens;
        }
      }
    }
    
    assert(_tokensToTransfer > 0);
    assert(_value == 0);  // Yes, you can't donate 100000 ETH and receive all tokens.
    
    tokensSold += _tokensToTransfer;
    
    assert(charitySpaceToken.transfer(msg.sender, _tokensToTransfer));
    assert(donationsAddress.send(msg.value));
    
    ReceivedETH(msg.sender, msg.value);
  }
  
  // Confirm donation in BTC, BCH (BCC), LTC, DASH
  // All donation has txid from foregin blockchain. In the end of ico we transfer all donations to single address (will be written down on project site) for each block chain. You may easly check that this method was used only to confirm real transactions.
  function manuallyConfirmDonation(address donatorAddress, uint256 tokens, uint256 altValue, string altCurrency, string altTx) public onlyBy(owner) respectTimeFrame {
    uint256 _remainingTokens = tokens;
    uint256 _tokens = 0;
    
    if(preIcoEndDate > now) {
       if((tiers[0].tokens - tiers[0].tokensSold) < _remainingTokens) {
        _tokens = (tiers[0].tokens - tiers[0].tokensSold);
      } else {
        _tokens = _remainingTokens;
      }
      tiers[0].tokensSold += _tokens;
      _remainingTokens -= _tokens;
    }
    if(_remainingTokens > 0) {
      for (uint i = 1; i < tiers.length; ++i) {
        if(_remainingTokens > 0 && (tiers[i].tokens > tiers[i].tokensSold)) {
          if ((tiers[i].tokens - tiers[i].tokensSold) < _remainingTokens) {
            _tokens = (tiers[i].tokens - tiers[i].tokensSold);
          } else {
            _tokens = _remainingTokens;
          }
          tiers[i].tokensSold += _tokens;
          _remainingTokens -= _tokens;
        }
      }
    }
    
    assert(_remainingTokens == 0); //to no abuse method when no tokens available. 
    tokensSold += tokens;
    assert(charitySpaceToken.transfer(donatorAddress, tokens));
    
    bytes32 altCurrencyHash = keccak256(altCurrency);
    if(altCurrencyHash == btcHash) {
      ReceivedBTC(donatorAddress, altValue, altTx);
    } else if(altCurrencyHash == bchHash) {
      ReceivedBCH(donatorAddress, altValue, altTx);
    } else {
      ReceivedLTC(donatorAddress, altValue, altTx);
    }
  }
  
  function () public payable respectTimeFrame {
    receiveDonation();
  }
}