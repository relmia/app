/* eslint-disable no-undef */

import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/src/signers';
import { Contract, Signer } from 'ethers';
import { WrapperSuperToken } from '@superfluid-finance/sdk-core/dist/module/SuperToken';

import { Framework } from '@superfluid-finance/sdk-core';

import { assert } from 'chai';
import { defaultAbiCoder } from '@ethersproject/abi';

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

let aliceAcct: SignerWithAddress;
let ownerAcct: SignerWithAddress;
let jamesAcct: SignerWithAddress;

const chainId = 31337;

const errorHandler = (err: unknown) => {
  if (err) throw err;
};

before(async function () {
  //get accounts from hardhat
  accounts = await ethers.getSigners();

  aliceAcct = accounts[0];
  ownerAcct = accounts[1];
  jamesAcct = accounts[2];

  //deploy the framework
  await deployFramework(errorHandler, {
    web3,
    from: aliceAcct.address,
  });

  //deploy a fake erc20 token
  await deployTestToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: aliceAcct.address,
  });

  //deploy a fake erc20 wrapper super token around the fDAI token
  await deploySuperToken(errorHandler, [':', 'fDAI'], {
    web3,
    from: aliceAcct.address,
  });

  //initialize the superfluid framework...put custom and web3 only bc we are using hardhat locally
  sf = await Framework.create({
    chainId,
    provider,
    resolverAddress: process.env.RESOLVER_ADDRESS, //this is how you get the resolver address
    protocolReleaseVersion: 'test',
  });

  superSigner = sf.createSigner({
    signer: aliceAcct,
    provider: provider,
  });

  //use the framework to get the super toen
  daix = (await sf.loadSuperToken('fDAIx')) as WrapperSuperToken;

  //get the contract object for the erc20 token
  let daiAddress = daix.underlyingToken?.address;
  dai = new ethers.Contract(daiAddress, daiABI, accounts[0]);
});

describe('sending flows', async function () {
  let TradeableCashflow: Contract;

  async function getOwnerFlowRate() {
    const result = await sf.cfaV1.getFlow({
      superToken: daix.address,
      receiver: ownerAcct.address,
      sender: TradeableCashflow.address,
      providerOrSigner: superSigner,
    });

    return result.flowRate;
  }

  async function getAppFlowRate() {
    return await sf.cfaV1.getNetFlow({
      superToken: daix.address,
      account: TradeableCashflow.address,
      providerOrSigner: superSigner,
    });
  }

  async function getAliceFlowRate() {
    return (
      await sf.cfaV1.getFlow({
        receiver: TradeableCashflow.address,
        sender: aliceAcct.address,
        providerOrSigner: superSigner,
        superToken: daix.address,
      })
    ).flowRate;
  }

  async function getCurrentLivePeerId() {
    const result = await TradeableCashflow.functions.activeStreamLivePeerId();

    return result as string | undefined;
  }

  function encodeLivePeerIdUserData(livePeerId: string) {
    return defaultAbiCoder.encode(['string'], [livePeerId]);
  }

  beforeEach(async function () {
    let App = await ethers.getContractFactory('TradeableCashflow', accounts[0]);
    TradeableCashflow = await App.deploy(
      ownerAcct.address,
      'TradeableCashflow',
      'TCF',
      sf.settings.config.hostAddress,
      daix.address,
    );

    await dai.connect(aliceAcct).mint(aliceAcct.address, ethers.utils.parseEther('1000'));

    await dai.connect(aliceAcct).approve(daix.address, ethers.utils.parseEther('1000'));

    const daixUpgradeOperation = daix.upgrade({
      amount: ethers.utils.parseEther('1000'),
    });

    await daixUpgradeOperation.exec(accounts[0]);
  });

  it('Case #1 - Alice creates a flow', async () => {
    const aliceFlowRate = '100000000';

    const initialLivePeerId = await getCurrentLivePeerId();

    const livePeerId = 'alice-live-peer-id';

    assert.equal(initialLivePeerId, '');

    const createFlowOperation = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
      userData: encodeLivePeerIdUserData(livePeerId),
    });

    const txn = await createFlowOperation.exec(aliceAcct);

    await txn.wait();

    const appFlowRate = await getAppFlowRate();
    const ownerFlowRate = await getOwnerFlowRate();

    assert.equal(ownerFlowRate, aliceFlowRate, 'owner not receiving 100% of flowRate');

    assert.equal(appFlowRate, '0', 'App flowRate not zero');

    assert.equal(await getCurrentLivePeerId(), livePeerId, 'live peer id didnt save');
  });

  it('Case #2 - Alice upates flows to the contract', async () => {
    const aliceFlowRate = '100000000';

    const livePeerId = 'alice-live-peer-id';

    const createFlowOperation = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
      userData: encodeLivePeerIdUserData(livePeerId),
    });

    const initialOwnerFlowRate = await getOwnerFlowRate();

    const txn = await createFlowOperation.exec(aliceAcct);

    await txn.wait();

    const newAliceFlowRate = '200000000';

    const updateFlowOperation = sf.cfaV1.updateFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: newAliceFlowRate,
      userData: encodeLivePeerIdUserData(livePeerId),
    });

    const updateFlowTxn = await updateFlowOperation.exec(aliceAcct);

    await updateFlowTxn.wait();

    const appFlowRate = await getAppFlowRate();
    const ownerFlowRate = (+(await getOwnerFlowRate()) - +initialOwnerFlowRate).toString();

    assert.equal(ownerFlowRate, newAliceFlowRate, 'owner not receiving correct updated flowRate');
    assert.equal(appFlowRate, '0', 'App flowRate not zero');

    assert.equal(await getCurrentLivePeerId(), livePeerId, 'live peer id didnt save');
  });

  it('Case 3: Owners flow should be same after a new flow (less than the exiting) has created ', async () => {
    const daixTransferOperation = daix.transfer({
      receiver: jamesAcct.address,
      amount: ethers.utils.parseEther('500'),
    });

    await daixTransferOperation.exec(aliceAcct);

    const aliceFlowRate = '120000000';
    const jamesFlowRate = '100000000';

    const aliceLivePeerId = 'alice-live-peer-id';
    const jamesLivePeerId = 'james-live-peer-id';

    const aliceOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
      userData: encodeLivePeerIdUserData(aliceLivePeerId),
    });

    const aliceOpTx = await aliceOp.exec(aliceAcct);

    await aliceOpTx.wait();

    const initialOwnerFlowRate = await getOwnerFlowRate();

    const jamesOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: jamesFlowRate,
      userData: encodeLivePeerIdUserData(jamesLivePeerId),
    });

    let errorOccured = false;

    try {
      const jamesOpTx = await jamesOp.exec(jamesAcct);

      await jamesOpTx.wait();
    } catch (e) {
      errorOccured = true;
    }

    assert.equal(errorOccured, true, 'Expected an error to have occureed');

    const appFlowRate = await getAppFlowRate();
    const updatedOnwerFlowRate2 = await getOwnerFlowRate();

    assert.equal(initialOwnerFlowRate, updatedOnwerFlowRate2, 'owner flow is not the same as at the beginning');

    assert.equal(appFlowRate, '0', 'App flowRate not zero');

    assert.equal(await getCurrentLivePeerId(), aliceLivePeerId, 'live peer id should not have changed');
  });

  it('Case 4: new flow should override existing flow if it is greater than existing flow', async () => {
    const daixTransferOperation = daix.transfer({
      receiver: jamesAcct.address,
      amount: ethers.utils.parseEther('500'),
    });

    await daixTransferOperation.exec(aliceAcct);

    const aliceFlowRate = '12000000';
    const jamesFlowRate = '15000000';

    const aliceLivePeerId = 'alice-live-peer-id';
    const jamesLivePeerId = 'james-live-peer-id';

    const aliceOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: aliceFlowRate,
      userData: encodeLivePeerIdUserData(aliceLivePeerId),
    });

    const aliceOpTx = await aliceOp.exec(aliceAcct);

    await aliceOpTx.wait();

    const updatedAliceFlowRate = await getAliceFlowRate();

    // assert.equal(updatedAliceFlowRate, aliceFlowRate, 'alice flow differed');
    // assert.equal(updatedAliceFlowRate, await getOwnerFlowRate(), 'alice rate diff than owner');
    assert.equal(await getAppFlowRate(), '0', 'App flowRate not zero');

    const jamesOp = sf.cfaV1.createFlow({
      receiver: TradeableCashflow.address,
      superToken: daix.address,
      flowRate: jamesFlowRate,
      userData: encodeLivePeerIdUserData(jamesLivePeerId),
    });

    const jamesOpTx = await jamesOp.exec(jamesAcct);

    await jamesOpTx.wait();

    const appFlowRate = await getAppFlowRate();
    const updatedOnwerFlowRate2 = await getOwnerFlowRate();

    assert.equal(updatedOnwerFlowRate2, jamesFlowRate, 'owner flow is not the same as at the james flow rate');

    assert.equal(appFlowRate, '0', 'App flowRate not zero');
    assert.equal(await getCurrentLivePeerId(), jamesLivePeerId, 'live peer id should have changed');

    const deleteOp = sf.cfaV1.deleteFlow({
      receiver: TradeableCashflow.address,
      sender: jamesAcct.address,
      superToken: daix.address,
    });

    const deleteOpTx = await deleteOp.exec(jamesAcct);

    await deleteOpTx.wait();

    const jamesFlow = await sf.cfaV1.getNetFlow({
      account: jamesAcct.address,
      providerOrSigner: superSigner,
      superToken: daix.address,
    });

    assert.equal(jamesFlow, '0', 'james flow should be 0');

    assert.equal(await getAppFlowRate(), '0', 'App flowRate not zero');
    assert.equal(await getOwnerFlowRate(), '0', 'Onwer flowRate not zero');
    assert.equal(await getCurrentLivePeerId(), '', 'live peer id should have been cleared after deletion');
  });
});
