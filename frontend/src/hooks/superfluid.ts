import { createContext, useContext, useEffect, useState } from 'react';
import { useAccount, useNetwork, useProvider } from 'wagmi';
import { Framework, IStream, PagedResult } from '@superfluid-finance/sdk-core';
import { MUMBAI } from '../utils/constants';
import SuperToken from '@superfluid-finance/sdk-core/dist/module/SuperToken';
import { Contract } from 'ethers';

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

export const useContractStreams = (pollInterval = 5000) => {
  const { sf, contractAddress } = useContext(SuperfluidContext);

  const [allStreams, setAllStreams] = useState<(IStream & { netFlow: number })[]>();
  const [activeStream, setActiveStream] = useState<IStream & { netFlow: number }>();

  const { address } = useAccount();

  const [youAreActiveBidder, setYouAreActiveBidder] = useState(false);

  useEffect(() => {
    (async () => {
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

      const activeStream = netInputStreams.filter((x) => x.netFlow > 0)[0];

      const youAreActiveBidder = activeStream && activeStream?.sender.toLowerCase() === address?.toLowerCase();

      setAllStreams(netInputStreams);
      setActiveStream(activeStream);
      setYouAreActiveBidder(youAreActiveBidder);
    })();
  }, [pollInterval, sf]);

  return { activeStream, allStreams, youAreActiveBidder };
};

export type SuperfluidContextType = {
  sf: Framework;
  superToken: SuperToken;
  contractAddress: string;
};

// @ts-ignore
export const SuperfluidContext = createContext<SuperfluidContextType>();
