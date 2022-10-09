import '@nomicfoundation/hardhat-toolbox';
import '@nomiclabs/hardhat-ethers';
import '@typechain/hardhat';
import '@nomiclabs/hardhat-web3';

// Go to https://www.alchemyapi.io, sign up, create
// a new App in its dashboard, and replace "KEY" with its key
const ALCHEMY_API_KEY = '7JOHPLbiPe75KZ3OBykXYwjZiHwcmX2x';

// Replace this private key with your Goerli account private key
// To export your private key from Metamask, open Metamask and
// go to Account Details > Export Private Key
// Beware: NEVER put real Ether into testing accounts
const GOERLI_PRIVATE_KEY = '59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

const MUMBAI_PRIVATE_KEY = '58c6bc1fb4d7a68d43122502988395cc08b6ca0a1afb6c55879f8b0526261adf';

module.exports = {
  solidity: '0.8.14',
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      chainId: 5,
      accounts: [GOERLI_PRIVATE_KEY],
    },
    mumbai: {
      url: `https://polygon-mumbai.g.alchemy.com/v2/XkBbuhgXbMKQITu6j04r9S_B-6d96ep4`,
      accounts: [MUMBAI_PRIVATE_KEY],
      chainId: 80001,
    },
  },
};
