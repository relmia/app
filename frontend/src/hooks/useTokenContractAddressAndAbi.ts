import { useEffect, useMemo, useState } from 'react';
import { chain } from 'wagmi';
import { useAccount } from 'wagmi';
import localHostAddress from '../contracts/localhost/contract-address.json';
import localHostContract from '../contracts/localhost/Token.json';
import goerliHostAddress from '../contracts/goerli/contract-address.json';
import goerilHostContract from '../contracts/goerli/Token.json';
import { ContractInterface } from 'ethers';

export type GetContractArgs = {
  /** Contract address or ENS name */
  addressOrName: string;
  /** Contract interface or ABI */
  contractInterface: ContractInterface;
  /** Signer or provider to attach to contract */
};

const getContractAddressAndAbi = (chainId: number | undefined): GetContractArgs | null => {
  if (!chainId) return null;

  if (chainId === chain.hardhat.id) {
    return {
      addressOrName: localHostAddress.Token,
      contractInterface: localHostContract.abi,
    };
  }

  if (chainId === chain.goerli.id) {
    return {
      addressOrName: goerliHostAddress.Token,
      contractInterface: goerilHostContract.abi,
    };
  }

  throw new Error('invalid chain id');
};

const useTokenContractAddressAndAbi = () => {
  const { connector: activeConnector, isConnected } = useAccount();

  const [contractArgs, setContractArgs] = useState<GetContractArgs | null>(null);

  useEffect(() => {
    (async () => {
      const chainId = await activeConnector?.getChainId();

      if (!chainId) return;

      console.log({ chainId });
      const addressAndAbi = getContractAddressAndAbi(chainId);

      setContractArgs(addressAndAbi);
    })();
  }, [activeConnector, isConnected]);

  return contractArgs;
};

export default useTokenContractAddressAndAbi;
