import { useEffect, useMemo, useState } from 'react';
import { chain } from 'wagmi';
import { useAccount } from 'wagmi';
import localHostAddress from '../contracts/localhost/contract-address.json';
import goerliHostAddress from '../contracts/goerli/contract-address.json';
import mumbaiHostAddress from '../contracts/mumbai/contract-address.json';
import contractAbi from '../contracts/mumbai/TradeableCashflow.json';
import { ContractInterface } from 'ethers';

export type GetContractArgs = {
  /** Contract address or ENS name */
  addressOrName: string;
  /** Contract interface or ABI */
  chainId: number;
  abi: ContractInterface;
};

const getContractAddressAndAbi = (chainId: number | undefined): GetContractArgs | null => {
  if (!chainId) return null;

  if (chainId === chain.hardhat.id) {
    return {
      addressOrName: localHostAddress.Token,
      chainId,
      abi: contractAbi.abi,
    };
  }

  if (chainId === chain.goerli.id) {
    return {
      addressOrName: goerliHostAddress.Token,
      chainId,
      abi: contractAbi.abi,
    };
  }

  if (chainId === chain.polygonMumbai.id) {
    return {
      addressOrName: mumbaiHostAddress.Token,
      chainId,
      abi: contractAbi.abi,
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

      const addressAndAbi = getContractAddressAndAbi(chainId);

      setContractArgs(addressAndAbi);
    })();
  }, [activeConnector, isConnected]);

  return contractArgs;
};

export default useTokenContractAddressAndAbi;
