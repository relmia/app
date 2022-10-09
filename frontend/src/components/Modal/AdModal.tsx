import { Button, Dialog, DialogActions, DialogContent, DialogContentText, TextField } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import { BILLBOARD_CONTRACT_ADDRESS, DEFAULT_TOKEN_NAME, MUMBAI } from '../../utils/constants';
import { useNetwork, useProvider, useSigner } from 'wagmi';
import { useState } from 'react';
import { Framework } from '@superfluid-finance/sdk-core';
import { IFrameworkOptions } from '@superfluid-finance/sdk-core/dist/module/Framework';

const AddModal = ({ setOpen, open }: { setOpen: any; open: boolean }): JSX.Element => {
  const { chain } = useNetwork();
  const provider = useProvider();
  const [flowRate, setFlowRate] = useState('1');
  const { data: signer } = useSigner();

  const createNewFlow = async () => {
    const params: IFrameworkOptions = {
      chainId: Number(chain?.id),
      provider,
      resolverAddress: MUMBAI.RESOLVER_ADDRESS,
    };

    const sf = await Framework.create(params);

    const superToken = await sf.loadSuperToken(DEFAULT_TOKEN_NAME);
    try {
      const params = {
        receiver: BILLBOARD_CONTRACT_ADDRESS,
        superToken: superToken.address,
        flowRate,
      };

      console.log('signer', signer);
      const createFlowOperation = sf.cfaV1.createFlow(params);
      const txn = await createFlowOperation.exec(signer);
      await txn.wait();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Dialog open={open} maxWidth={false} onClose={() => setOpen(false)} sx={{ px: 10 }}>
      <DialogTitle>New advertisement</DialogTitle>
      <DialogContent>
        <DialogContentText>
          To subscribe to this website, please enter your email address here. We will send updates occasionally.
        </DialogContentText>
        <TextField autoFocus margin="dense" id="Amount" label="Amount" type="number" fullWidth variant="outlined" />
        <TextField margin="dense" id="id" label="Livepeer ID" type="text" fullWidth variant="outlined" />
      </DialogContent>
      <DialogActions>
        <Button onClick={createNewFlow} variant="contained">
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddModal;
