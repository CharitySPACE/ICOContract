/* global artifacts, assert */

const getBalance = require('./utils').getBalance;
const CharitySpace = artifacts.require('CharitySpace');
const CharitySpaceToken = artifacts.require('CharitySpaceToken');


contract('CharitySpace', function (accounts) {
  const owner = accounts[0],
        teamAddress = accounts[2],
        advisorsAddress = accounts[3],
        bountyAddress = accounts[4],
        companyAddress = accounts[5],
        donationsAddress = accounts[6],
        address = accounts[7];

  it('start: != owner shouldn\'t start contract', async () => {
    return CharitySpace.deployed()
      .then(instance => {
        return instance.start({from: address});
      })
      .then(tx => {
        assert.equal(tx.cumulativeGasUsed, tx.gasUsed, "!= owner start contract!!!"); //not working after fork -> rewrite to check 'status' field != 0//Pawel
      });
  });
  
  it('setup: owner shouldn\'t setup contract twice', async () => {
    return CharitySpace.deployed()
      .then(instance => {
        return instance.setup(address, {from: owner});
      })
      .then(tx => {
        assert.equal(tx.cumulativeGasUsed, tx.gasUsed, "owner setup contract twice!!!");
      });
  });
  
  it('start: owner should start contract', async () => {
    let meta;
    let now;
    return CharitySpace.deployed()
      .then(instance => {
        meta = instance;
        return instance.start({from: owner});
      })
      .then(x => {
        now = Date.now() / 1000;
        return meta.started.call();
      })
      .then(started => {
        assert.equal(started, true);
        return meta.live.call();
      })
      .then(live => {
        assert.equal(live, true);
        return meta.startDate.call();
      })
      .then(startDate => {
        assert.isAbove(startDate, now - 120, "startDate is not close to now (above now - 120) |startDate: " + startDate);
        assert.isBelow(startDate, now + 120, "startDate is not close to now (below now + 120) |startDate: " + startDate);
        return meta.endDate.call();
      })
      .then(endDate => {
        let lasts = 2592000 + 7200 ;//30days + 2h
        assert.isAbove(endDate, now + lasts - 120, "endDate is not close to now (above now + lasts - 120) |endDate: " + endDate);
        assert.isBelow(endDate, now + lasts + 120, "endDate is not close to now (below now + lasts + 120) |endDate: " + endDate);
        return meta.preIcoEndDate.call();
      })
      .then(preIcoEndDate => {
        let lasts = 604800 ;//7days
        assert.isAbove(preIcoEndDate, now + lasts - 120, "preIcoEndDate is not close to now (above now + lasts - 120) |preIcoEndDate: " + preIcoEndDate);
        assert.isBelow(preIcoEndDate, now + lasts + 120, "preIcoEndDate is not close to now (below now + lasts + 120) |preIcoEndDate: " + preIcoEndDate);
      });
  });
  
  it('donate: should receive 7eth donate in pre-ico period', async () => {
    let donationsBalance;
    return getBalance(donationsAddress)
      .then(balance => {
        donationsBalance = balance;
        return CharitySpace.deployed();
      })
      .then(instance => {
        return instance.receiveDonation({from: address, value: web3.toWei('7', 'Ether')});
      })
      .then(tx => {
        return CharitySpaceToken.deployed();
      })
      .then(instance => {
        return instance.balanceOf(address);
      })
      .then(tokens => {
        let expectedTokens = web3.toBigNumber(web3.toWei('10000', 'Ether'));
        assert.equal(tokens.toString(10), expectedTokens.toString(10), "tokens ("+tokens+") not equal to expectedTokens ("+expectedTokens+")");
        return getBalance(donationsAddress);
      })
      .then(balance => {
        let newBalance = donationsBalance.plus(web3.toBigNumber(web3.toWei('7', 'Ether')));
        assert.equal(balance.toString(10), newBalance.toString(10), "balance not equals. Where is donation value?!");
      });
  });
  
  it('donate: should receive 1750eth donate, 1743eth in pre-ico period and 7eth in tier1', async () => {
    let donationsBalance;
    return getBalance(donationsAddress)
      .then(balance => {
        donationsBalance = balance;
        return CharitySpace.deployed();
      })
      .then(instance => {
        return instance.receiveDonation({from: address, value: web3.toWei('1750', 'Ether')});
      })
      .then(tx => {
        return CharitySpaceToken.deployed();
      })
      .then(instance => {
        return instance.balanceOf(address);
      })
      .then(tokens => {
        let lastDonateExpectedTokens = web3.toBigNumber(web3.toWei('10000', 'Ether'));
        let expectedTokensFromPreIco = web3.toBigNumber(web3.toWei('2490000', 'Ether'));
        let expectedTokensFromTier1 = web3.toBigNumber(web3.toWei('7000', 'Ether'));
        let expectedTokens = lastDonateExpectedTokens.plus(expectedTokensFromPreIco).plus(expectedTokensFromTier1);
        assert.equal(tokens.toString(10), expectedTokens.toString(10), "tokens ("+tokens+") not equal to expectedTokens ("+expectedTokens+")");
        return getBalance(donationsAddress);
      })
      .then(balance => {
        let newBalance = donationsBalance.plus(web3.toBigNumber(web3.toWei('1750', 'Ether')));
        assert.equal(balance.toString(10), newBalance.toString(10), "balance not equals. Where is donation value?!");
      });
  });
  
  it('manuallyConfirmDonation: != owner shouldn\'t call function', async () => {
    return CharitySpace.deployed()
      .then(instance => {
        return instance.manuallyConfirmDonation(address, web3.toWei('1', 'Ether'), 1, 'BTC', 'fa1082ed6e2c7a7ffeb45265061a5581ad5dc536dd5735abc3530a45283381f1', {from: address});
      })
      .then(tx => {
        assert.equal(tx.cumulativeGasUsed, tx.gasUsed, "!= owner can run manuallyConfirmDonation method");
      });
  });
  
  it('manuallyConfirmDonation: donator should receive 1000*10^18 CHT', async () => {
    let meta;
    return CharitySpace.deployed()
      .then(instance => {
        meta = instance;
        return instance.manuallyConfirmDonation(address, web3.toWei('1000', 'Ether'), 1000, 'BTC', 'fa1082ed6e2c7a7ffeb45265061a5581ad5dc536dd5735abc3530a45283381f1', {from: owner});
      })
      .then(tx => {
        return CharitySpaceToken.deployed();
      })
      .then(instance => {
        return instance.balanceOf(address);
      })
      .then(tokens => {
        let firstDonateExpectedTokens = web3.toBigNumber(web3.toWei('10000', 'Ether'));
        let lastExpectedTokensFromPreIco = web3.toBigNumber(web3.toWei('2490000', 'Ether'));
        let lastExpectedTokensFromTier1 = web3.toBigNumber(web3.toWei('7000', 'Ether'));
        let expectedTokensFromTier1 = web3.toBigNumber(web3.toWei('1000', 'Ether'));
        let expectedTokens = firstDonateExpectedTokens.plus(lastExpectedTokensFromPreIco).plus(lastExpectedTokensFromTier1).plus(expectedTokensFromTier1);
        assert.equal(tokens.toString(10), expectedTokens.toString(10), "tokens ("+tokens+") not equal to expectedTokens ("+expectedTokens+")");
        return meta.tiers.call(0);
      })
      .then(tier0 => {
        let [ tokens, tokensSold, price ] = tier0;
        assert.equal(tokensSold.toString(10), tokens.toString(10), "tokens from pre-ico haven't been sold");
        return meta.tiers.call(1);
      })
      .then(tier1 => {
        let [ tokens, tokensSold, price ] = tier1;
        let lastExpectedTokensFromTier1 = web3.toBigNumber(web3.toWei('7000', 'Ether'));
        let expectedTokensFromTier1 = web3.toBigNumber(web3.toWei('1000', 'Ether'));
        let expectedTokens = lastExpectedTokensFromTier1.plus(expectedTokensFromTier1);
        assert.equal(tokensSold.toString(10), expectedTokens.toString(10), "tokens from tier1 haven't been sold properly");
      });
  });

});
