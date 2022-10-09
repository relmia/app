import { useEffect } from 'react';
import { useNetwork, useProvider } from 'wagmi';
import { Framework } from '@superfluid-finance/sdk-core';
import { MUMBAI } from '../utils/constants';
import SuperToken from '@superfluid-finance/sdk-core/dist/module/SuperToken';

export const useSuperFluid = ({ tokenName }: { tokenName: string }) => {
  const { chain } = useNetwork();
  const provider = useProvider();

  let sf: Framework = {} as unknown as Framework;
  let superToken: SuperToken = {} as unknown as SuperToken;

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
      superToken = await sf.loadSuperToken(tokenName);
    })();
  }, [provider, chain, tokenName]);

  return [sf, provider, chain, superToken, tokenName];
};
