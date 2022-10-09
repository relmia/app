import { createContext, useEffect, useState } from 'react';
import { useNetwork, useProvider } from 'wagmi';
import { Framework } from '@superfluid-finance/sdk-core';
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

export const useCurrentBidInfo = ({ sf, token }: { sf: Framework | undefined; token: SuperToken | undefined }) => {};

export type SuperfluidContextType = {
  sf: Framework;
  superToken: SuperToken;
  contractAddress: string;
};

export const SuperfluidContext = createContext<SuperfluidContextType | null>(null);
