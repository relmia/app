import { useEffect } from 'react';
import { useNetwork, useProvider } from 'wagmi';
import { Framework, SuperToken } from '@superfluid-finance/sdk-core';

const LOCAL_HOST_RESOLVER_ADDRESS = '0x4A679253410272dd5232B3Ff7cF5dbB88f295319';

export const useSuperFluid = () => {
  const { chain } = useNetwork();

  const provider = useProvider();

  useEffect(() => {
    (async () => {
      if (!chain?.id) return;

      const resolverAddress = chain?.name === 'Hardhat' ? LOCAL_HOST_RESOLVER_ADDRESS : undefined;

      const params = {
        chainId: chain?.id,
        provider,
        resolverAddress, //, //: process.env.RESOLVER_ADDRESS,
      };

      const sf = await Framework.create(params);

      console.log('CREATING TOKEN');

      const superToken = await sf.loadSuperToken(tokenName);

      setSuperToken(superToken);

      setSf(sf);
    })();
  }, [provider, chain, tokenName]);
};
