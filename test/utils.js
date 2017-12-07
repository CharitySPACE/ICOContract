const promisify = (inner) =>
  new Promise((resolve, reject) =>
    inner((err, res) => {
      if (err) { reject(err) }
      resolve(res);
    })
  );

  
module.exports = {
  getBalance: (account, at) => promisify(cb => web3.eth.getBalance(account, at, cb))
};