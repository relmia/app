// This is a script for deploying your contracts. You can adapt it to deploy
// yours, or create new ones.

import { Provider } from '@ethersproject/providers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const path = require('path');
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');

import { Framework } from '@superfluid-finance/sdk-core';
import { Contract } from 'ethers';
import { artifacts, ethers, network, web3 } from 'hardhat';

const errorHandler = (err: any) => {
  if (err) throw err;
};

async function deployLocalFramework(accounts: SignerWithAddress[]) {
  //deploy the framework
  console.log('DEPLOY FRAMEWORK');
  await deployFramework(errorHandler, {
    web3,
    from: accounts[0].address,
  });

  //deploy a fake erc20 token
  console.log('DEPLOY TEST TOKEN');
  await deployTestToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: accounts[0].address,
  });

  //deploy a fake erc20 wrapper super token around the fDAI token
  console.log('DEPLOY SUPER TOKEN');
  await deploySuperToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: accounts[0].address,
  });
}

const HARDHAT_CHAIN_ID = 31337;

async function getSuperToken(provider: Provider) {
  const sf = await Framework.create({
    chainId: HARDHAT_CHAIN_ID,
    provider,
    resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
    protocolReleaseVersion: 'test',
  });

  const daix = await sf.loadSuperToken('fDAIx');

  return daix;
}

async function main() {
  // This is just a convenience check
  const accounts = await ethers.getSigners();

  const [deployer] = accounts;

  if (network.name === 'localhost') {
    await deployLocalFramework([deployer]);
  }

  // ethers is available in the global scope
  const address = await deployer.getAddress();
  console.log('Deploying the contracts with the account:', address);

  console.log('Account balance:', (await deployer.getBalance()).toString());

  const App = await ethers.getContractFactory('TradeableCashflow');

  console.log('GET SUPER TOKEN');
  const daix = await getSuperToken(deployer.provider as Provider);

  const contract = await App.deploy(
    accounts[1].address,
    'TradeableCashflow',
    'TCF',
    '0xa513E6E4b8f2a923D98304ec87F64353C4D5C853',
    daix.address,
  );
  await contract.deployed();

  console.log('Contract address:', contract.address);

  // We also save the contract's artifacts and address in the frontend directory
  saveFrontendFiles(contract);
}

function saveFrontendFiles(contract: Contract) {
  const fs = require('fs');
  const contractsDir = path.join(__dirname, '..', 'frontend', 'src', 'contracts', network.name);

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(
    path.join(contractsDir, 'contract-address.json'),
    JSON.stringify({ Token: contract.address }, undefined, 2),
  );

  const TokenArtifact = artifacts.readArtifactSync('TradeableCashflow');

  fs.writeFileSync(path.join(contractsDir, 'TradeableCashflow.json'), JSON.stringify(TokenArtifact, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
