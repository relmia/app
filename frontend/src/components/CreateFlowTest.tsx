import { Framework } from '@superfluid-finance/sdk-core';
import { debug } from 'console';
import { useEffect, useState } from 'react';
import { useAccount, useNetwork, useProvider } from 'wagmi';
import useTokenContractAddressAndAbi, { GetContractArgs } from '../hooks/useTokenContractAddressAndAbi';

const LOCAL_HOST_RESOLVER_ADDRESS = '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';

const CreateFlowInner = ({ getContractArgs: { chainId } }: { getContractArgs: GetContractArgs }) => {
  const [sf, setSf] = useState<Framework>();

  const provider = useProvider();

  const { chain } = useNetwork();

  const { address } = useAccount();

  useEffect(() => {
    (async () => {
      if (!chainId) return;

      const resolverAddress = chain?.name === 'hardhat' ? LOCAL_HOST_RESOLVER_ADDRESS : undefined;

      const sf = await Framework.create({
        chainId,
        provider,
        resolverAddress,
      });

      setSf(sf);
    })();
  }, [provider, chainId, chain]);

  const [daiAddress, setDaiAddress] = useState<string>();

  const [tokenAddress] = useState<string>('fDAIx');

  const [balance, setBalance] = useState<string>();

  useEffect(() => {
    if (!sf || !address || !provider) return;

    (async () => {
      const superToken = await sf.loadSuperToken('fDAIx');

      const balance = await superToken.balanceOf({
        account: address,
        providerOrSigner: provider,
      });

      setBalance(balance);
    })();
  }, [sf, address, provider]);

  return (
    <>
      <p>
        <label>Your address: {address}</label>
      </p>
      <p>
        <label>Token: {tokenAddress}</label>
      </p>
      <p>
        <label>Your balance: {balance}</label>
      </p>
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
