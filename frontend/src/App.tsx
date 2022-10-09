import { useRoutes } from 'react-router-dom';
import router from '../src/router';
import { RainbowKitProvider } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';

import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';
import { WagmiConfig } from 'wagmi';

import { CssBaseline } from '@mui/material';
import ThemeProvider from './theme/ThemeProvider';
import { chains, client } from './web3/client';

function App() {
  const content = useRoutes(router);

  return (
    <ThemeProvider>
      <WagmiConfig client={client}>
        <RainbowKitProvider chains={chains}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline />
            {content}
          </LocalizationProvider>
        </RainbowKitProvider>
      </WagmiConfig>
    </ThemeProvider>
  );
}

export default App;
