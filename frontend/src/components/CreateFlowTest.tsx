import { TransactionResponse } from '@ethersproject/providers';
import { Framework, SuperToken } from '@superfluid-finance/sdk-core';
import { BigNumber } from 'ethers';
import { formatEther } from 'ethers/lib/utils';
import { useCallback, useEffect, useState } from 'react';
import { useAccount, useNetwork, useProvider, useSigner } from 'wagmi';
import { useSuperFluid, useSuperToken } from '../hooks/superfluid';
import useTokenContractAddressAndAbi, { GetContractArgs } from '../hooks/useTokenContractAddressAndAbi';

function calculateFlowRate(amount: any) {
  if (typeof Number(amount) !== 'number' || isNaN(Number(amount)) === true) {
    alert('You can only calculate a flowRate based on a number');
    return;
  } else if (typeof Number(amount) === 'number') {
    if (Number(amount) === 0) {
      return 0;
    }
    const amountInWei = BigNumber.from(amount);
    const monthlyAmount = formatEther(amountInWei.toString());
    // @ts-ignore
    const calculatedFlowRate = monthlyAmount * 3600 * 24 * 30;
    return calculatedFlowRate;
  }
}

const CreateFlowInner = ({
  getContractArgs: { chainId, addressOrName: contractAddress },
}: {
  getContractArgs: GetContractArgs;
}) => {
  const sf = useSuperFluid();

  const superToken = useSuperToken({
    sf,
    tokenName: 'fDAIx',
  });

  const provider = useProvider();

  const { address } = useAccount();

  const { data: signer } = useSigner();

  const [tokenName] = useState<string>('fDAIx');

  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!sf || !address || !provider || !superToken) return;

    (async () => {
      const balance = await superToken.balanceOf({
        account: address,
        providerOrSigner: provider,
      });

      setBalance(formatEther(balance));
    })();
  }, [sf, address, provider, superToken]);

  const [flowToContract, setFlowToContract] = useState<string>();

  useEffect(() => {
    if (!sf || !address || !contractAddress || !superToken) return;
    (async () => {
      const flow = await sf.cfaV1.getFlow({
        superToken: superToken.address,
        sender: address,
        receiver: contractAddress,
        providerOrSigner: provider,
      });

      setFlowToContract(formatEther(flow.flowRate));
    })();
  }, [sf, address, contractAddress, provider, superToken]);

  const [flowRate, setFlowRate] = useState('1');

  const [flowRateDisplay, setFlowRateDisplay] = useState('');

  const [creatingNewFlow, setCreatingNewFlow] = useState(false);

  const [tx, setTx] = useState<TransactionResponse>();

  const createNewFlow = useCallback(() => {
    if (!sf || !superToken || !provider || !signer) return;

    (async () => {
      setCreatingNewFlow(true);
      setTx(undefined);
      try {
        const params = {
          receiver: contractAddress,
          superToken: superToken.address,
          flowRate,
        };
        const createFlowOperation = sf.cfaV1.createFlow(params);
        const txn = await createFlowOperation.exec(signer);

        await txn.wait();

        setTx(tx);
      } finally {
        setCreatingNewFlow(false);
      }
    })();
  }, [flowRate, sf, contractAddress, superToken, signer]);

  return (
    <>
      <p>
        <label>Your address: {address}</label>
      </p>
      <p>
        <label>Token: {tokenName}</label>
      </p>
      <p>
        <label>Your balance: {balance !== undefined ? balance : 'fetching...'}</label>
      </p>
      <p>
        <label>Your flow to this contract: {flowToContract !== undefined ? flowToContract : 'fetching...'}</label>
      </p>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createNewFlow();
        }}
      >
        <legend>Set flow amount to this contract</legend>
        <p>
          <label htmlFor="flowAmount">Flow Amount</label>
          <br />
          <input
            type="number"
            value={flowRate}
            step="1"
            onChange={(e) => {
              setFlowRate(e.target.value);

              const newFlowRateDisplay = calculateFlowRate(e.target.value);
              // @ts-ignore
              setFlowRateDisplay(newFlowRateDisplay.toString());
            }}
          />
        </p>
        <p>
          <input type="submit" value="Set new Amount" disabled={creatingNewFlow} />
          {tx ? `Transaction submitted: ${tx}` : null}
        </p>
      </form>
    </>
  );
};

const CreateFlowTest = () => {
  const contractAddressAndAbi = useTokenContractAddressAndAbi();

  if (!contractAddressAndAbi) return <h3>Missing abi</h3>;

  return (
    <>
      <CreateFlowInner getContractArgs={contractAddressAndAbi} />
    </>
  );
};

export default CreateFlowTest;
