const CharitySpace = artifacts.require("./CharitySpace.sol");
const CharitySpaceToken = artifacts.require("./CharitySpaceToken.sol");
const accounts = require("../accounts");

module.exports = function(deployer) {
  deployer.deploy(CharitySpace, accounts.donationsAddress)
    .then(function() {
      return deployer.deploy(CharitySpaceToken, CharitySpace.address, accounts.teamAddress, accounts.advisorsAddress, accounts.bountyAddress, accounts.companyAddress)
    })
    .then(function() {
      return CharitySpace.deployed();
    })
    .then(function(instance) {
      return instance.setup(CharitySpaceToken.address);
    })
    .then(function() {
      console.log('deployed');
    });
};