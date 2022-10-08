/* eslint-disable no-undef */

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/src/signers';
import { Contract, Signer } from 'ethers';
import { WrapperSuperToken } from '@superfluid-finance/sdk-core/dist/module/SuperToken';

import { Framework } from '@superfluid-finance/sdk-core';

const { assert } = require('chai');

// TODO BUILD A HARDHAT PLUGIN AND REMOVE WEB3 FROM THIS
const { ethers, web3 } = require('hardhat');

const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');

// This is only used in the set up, and these are the only functions called in this script.
const daiABI = [
  'function mint(address to,uint256 amount) returns (bool)',
  'function approve(address,uint256) returns (bool)',
];

const provider = web3;

let accounts: SignerWithAddress[];

let sf: Framework;
let dai: Contract;
let daix: WrapperSuperToken;
let superSigner: Signer;
let TradeableCashflow: Contract;

const chainId = 31337;

const errorHandler = (err: unknown) => {
  if (err) throw err;
};

before(async function () {
  //get accounts from hardhat
  accounts = await ethers.getSigners();

  //deploy the framework
  await deployFramework(errorHandler, {
    web3,
    from: accounts[0].address,
  });

  //deploy a fake erc20 token
  await deployTestToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: accounts[0].address,
  });

  //deploy a fake erc20 wrapper super token around the fDAI token
  await deploySuperToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: accounts[0].address,
  });

  console.log('RESOLVER ADDRESS', process.env.RESOLVER_ADDRESS);

  //initialize the superfluid framework...put custom and web3 only bc we are using hardhat locally
  sf = await Framework.create({
    chainId,
    provider,
    resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
    protocolReleaseVersion: 'test',
  });

  superSigner = sf.createSigner({
    signer: accounts[0],
    provider: provider,
  });

  //use the framework to get the super toen
  daix = (await sf.loadSuperToken('fDAIx')) as WrapperSuperToken;

  //get the contract object for the erc20 token
  let daiAddress = daix.underlyingToken?.address;
  dai = new ethers.Contract(daiAddress, daiABI, accounts[0]);
});

beforeEach(async function () {
  let App = await ethers.getContractFactory('TradeableCashflow', accounts[0]);
  TradeableCashflow = await App.deploy(
    accounts[1].address,
    'TradeableCashflow',
    'TCF',
    sf.settings.config.hostAddress,
    daix.address,
  );

  await dai.connect(accounts[0]).mint(accounts[0].address, ethers.utils.parseEther('1000'));

  await dai.connect(accounts[0]).approve(daix.address, ethers.utils.parseEther('1000'));

  const daixUpgradeOperation = daix.upgrade({
    amount: ethers.utils.parseEther('1000'),
  });

  await daixUpgradeOperation.exec(accounts[0]);

  const daiBal = await daix.balanceOf({
    account: accounts[0].address,
    providerOrSigner: accounts[0],
  });
  console.log('daix bal for acct 0: ', daiBal);
});

describe('sending flows', async function () {
  it('Case #1 - Alice sends a flow', async () => {
    const aliceAddress = accounts[0];
    const ownerAddress = accounts[1].address;

    const aliceFlowRate = '100000000';

    const createFlowOperation = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
    });

    const txn = await createFlowOperation.exec(aliceAddress);

    await txn.wait();

    const appFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: TradeableCashflow.address,
      providerOrSigner: superSigner,
    });

    const ownerFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: ownerAddress,
      providerOrSigner: superSigner,
    });

    assert.equal(ownerFlowRate, aliceFlowRate, 'owner not receiving 100% of flowRate');

    assert.equal(appFlowRate, 0, 'App flowRate not zero');
  });

  it('Case #2 - Alice upates flows to the contract', async () => {
    const aliceAddress = accounts[0];

    const aliceFlowRate = '100000000';

    const createFlowOperation = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
    });

    const txn = await createFlowOperation.exec(aliceAddress);

    await txn.wait();

    const newAliceFlowRate = '200000000';

    const updateFlowOperation = sf.cfaV1.updateFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: '200000000',
    });

    const updateFlowTxn = await updateFlowOperation.exec(aliceAddress);

    await updateFlowTxn.wait();

    const updatedOwnerFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: accounts[1].address,
      providerOrSigner: superSigner,
    });

    const appFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: TradeableCashflow.address,
      providerOrSigner: superSigner,
    });

    assert.equal(updatedOwnerFlowRate, newAliceFlowRate, 'owner not receiving correct updated flowRate');

    assert.equal(appFlowRate, 0, 'App flowRate not zero');
  });

  it('Case 3: Owners flow should be same after a new flow (minor than the actual) has created ', async () => {
    const aliceAcct = accounts[0];
    const jamesAcct = accounts[2];
    const ownerAcct = accounts[1];

    console.log(accounts[2].address);

    const daixTransferOperation = daix.transfer({
      receiver: jamesAcct.address,
      amount: ethers.utils.parseEther('500'),
    });

    await daixTransferOperation.exec(aliceAcct);

    const account2Balance = await daix.balanceOf({
      account: jamesAcct.address,
      providerOrSigner: superSigner,
    });

    console.log('account 2 balance ', account2Balance);

    const aliceFlowRate = '120000000';

    const jamesFlowRate = '100000000';

    const aliceOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
    });

    const aliceOpTx = await aliceOp.exec(aliceAcct);

    await aliceOpTx.wait();

    const initialOwnerFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: ownerAcct.address,
      providerOrSigner: superSigner,
    });

    const jamesOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: jamesFlowRate,
    });

    const jamesOpTx = await jamesOp.exec(jamesAcct);

    await jamesOpTx.wait();

    const appFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: TradeableCashflow.address,
      providerOrSigner: superSigner,
    });

    const updatedOnwerFlowRate2 = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: ownerAcct.address,
      providerOrSigner: superSigner,
    });

    assert.equal(initialOwnerFlowRate, updatedOnwerFlowRate2, 'owner flow is not the same as at the beginning');

    assert.equal(appFlowRate, 0, 'App flowRate not zero');
  });

  it('Case 4: new flow should override existing flow if it is greater than existing flow', async () => {
    const aliceAcct = accounts[0];
    const jamesAcct = accounts[2];
    const ownerAcct = accounts[1];

    console.log(accounts[2].address);

    const daixTransferOperation = daix.transfer({
      receiver: jamesAcct.address,
      amount: ethers.utils.parseEther('500'),
    });

    await daixTransferOperation.exec(aliceAcct);

    const account2Balance = await daix.balanceOf({
      account: jamesAcct.address,
      providerOrSigner: superSigner,
    });

    console.log('account 2 balance ', account2Balance);

    const aliceFlowRate = '120000000';

    const jamesFlowRate = '150000000';

    const aliceOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
    });

    const aliceOpTx = await aliceOp.exec(aliceAcct);

    await aliceOpTx.wait();

    const jamesOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: jamesFlowRate,
    });

    const jamesOpTx = await jamesOp.exec(jamesAcct);

    await jamesOpTx.wait();

    const appFlowRate = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: TradeableCashflow.address,
      providerOrSigner: superSigner,
    });

    const updatedOnwerFlowRate2 = await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: ownerAcct.address,
      providerOrSigner: superSigner,
    });

    assert.equal(updatedOnwerFlowRate2, jamesFlowRate, 'owner flow is not the same as at the james flow rate');

    assert.equal(appFlowRate, 0, 'App flowRate not zero');
  });
});
