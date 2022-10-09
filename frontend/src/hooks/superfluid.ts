import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useContractRead, useNetwork, useProvider } from 'wagmi';
import { Framework, IStream, PagedResult } from '@superfluid-finance/sdk-core';
import { DEFAULT_TOKEN_NAME, MUMBAI } from '../utils/constants';
import SuperToken from '@superfluid-finance/sdk-core/dist/module/SuperToken';
import { BigNumber, Contract, ContractInterface } from 'ethers';
import { formatEther } from 'ethers/lib/utils';

export const useSuperFluid = () => {
  const { chain } = useNetwork();
  const provider = useProvider();

  const [sf, setSf] = useState<Framework>();

  useEffect(() => {
    (async () => {
      if (!chain?.id) return;

      const resolverAddress = MUMBAI.RESOLVER_ADDRESS; //chain?.name === 'Hardhat' ? LOCAL_HOST_RESOLVER_ADDRESS : undefined;

      const params = {
        chainId: chain?.id,
        provider,
        resolverAddress,
      };
      const sf = await Framework.create(params);

      console.log('CREATING TOKEN');

      setSf(sf);
    })();
  }, [provider, chain]);

  return sf;
};

export const useSuperToken = ({ sf, tokenName }: { sf: Framework | undefined; tokenName: string }) => {
  const [superToken, setSuperToken] = useState<SuperToken>();
  useEffect(() => {
    if (!sf) return;
    (async () => {
      const superToken = await sf.loadSuperToken(tokenName);

      setSuperToken(superToken);
    })();
  }, [sf, tokenName]);

  return superToken;
};

export const useActiveLivePeerStreamId = () => {
  const { contractAddress, contractAbi } = useContext(SuperfluidContext);

  const { data } = useContractRead({
    addressOrName: contractAddress,
    contractInterface: contractAbi,
    functionName: 'activeStreamLivePeerId',
    watch: true,
  });

  console.log('datga', data);
  const result = data?.[0] as string;

  // if empty string, then assume not set and return null
  if (result === '') return null;

  return result;
};

export const useContractStreams = (pollInterval = 5000) => {
  const { sf, contractAddress } = useContext(SuperfluidContext);

  const [allStreams, setAllStreams] = useState<(IStream & { netFlow: number })[]>();
  const [activeStream, setActiveStream] = useState<IStream & { netFlow: number }>();

  const { address } = useAccount();

  const [youAreActiveBidder, setYouAreActiveBidder] = useState(false);

  useEffect(() => {
    const updateStreams = async () => {
      // TODO: single gql query
      const inputStreams = (
        await sf.query.listStreams({
          receiver: contractAddress,
        })
      ).items;

      const outputStreams = (
        await sf.query.listStreams({
          sender: contractAddress,
        })
      ).items;

      const netInputStreams = inputStreams
        .map((x) => {
          const outputStreamForInput = outputStreams.find((y) => x.sender === y.receiver);

          const netFlow = -+x.currentFlowRate + +(outputStreamForInput?.currentFlowRate || 0);

          console.log(+x.currentFlowRate, +(outputStreamForInput?.currentFlowRate || 0));

          return {
            ...x,
            netFlow,
          };
        })

        .sort((x) => x.netFlow);

      console.log(netInputStreams);

      const activeStream = netInputStreams.filter((x) => x.netFlow < 0)[0];

      const youAreActiveBidder = activeStream && activeStream?.sender.toLowerCase() === address?.toLowerCase();

      setAllStreams(netInputStreams);
      setActiveStream(activeStream);
      setYouAreActiveBidder(youAreActiveBidder);
    };

    const interval = setInterval(() => {
      updateStreams();
    }, pollInterval);

    return () => {
      clearInterval(interval);
    };
  }, [pollInterval, sf, contractAddress]);

  return { activeStream, allStreams, youAreActiveBidder };
};

export function toFlowPerMinuteAmount(amount: number) {
  if (typeof Number(amount) === 'number') {
    if (Number(amount) === 0) {
      return 0;
    }
    const amountInWei = BigNumber.from(amount);
    const monthlyAmount = formatEther(amountInWei.toString());
    const calculatedFlowRate = +monthlyAmount * 60 * 24 * 30;
    return calculatedFlowRate;
  }
}

export function toFlowPerMinute(amount: number) {
  const value = toFlowPerMinuteAmount(amount);

  return `${amount} ${DEFAULT_TOKEN_NAME}/minute`;
}

export type SuperfluidContextType = {
  sf: Framework;
  superToken: SuperToken;
  contractAddress: string;
  contractAbi: ContractInterface;
};

// @ts-ignore
export const SuperfluidContext = createContext<SuperfluidContextType>();
