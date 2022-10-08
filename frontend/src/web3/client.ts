import { chain, createClient, configureChains } from "wagmi";

import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";

import { getDefaultWallets } from "@rainbow-me/rainbowkit";

// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const { chains, provider, webSocketProvider } = configureChains(
  [chain.hardhat, chain.goerli, chain.polygonMumbai],
  [
    alchemyProvider({ apiKey: import.meta.env.VITE_APP_ALCHEMY_ID }),
    publicProvider(),
  ],
);

const { connectors } = getDefaultWallets({
  appName: import.meta.env.VITE_APP_APP_NAME,
  chains,
});

// Set up client
const client = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

export { client, chains, chain, provider };
