import { Button, Dialog, DialogActions, DialogContent, DialogContentText, TextField } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import { DEFAULT_TOKEN_NAME, MUMBAI } from '../../utils/constants';
import { useNetwork, useProvider, useSigner } from 'wagmi';
import { useCallback, useState } from 'react';
import { Framework, ICreateFlowParams } from '@superfluid-finance/sdk-core';
import { IFrameworkOptions } from '@superfluid-finance/sdk-core/dist/module/Framework';
import { useSuperFluid, useSuperToken } from '../../hooks/superfluid';
import useTokenContractAddressAndAbi from '../../hooks/useTokenContractAddressAndAbi';

const AddModal = ({ setOpen, open }: { setOpen: any; open: boolean }): JSX.Element => {
  const sf = useSuperFluid();
  const superToken = useSuperToken({ sf, tokenName: DEFAULT_TOKEN_NAME });

  const contractAddress = useTokenContractAddressAndAbi();

  const [flowRate, setFlowRate] = useState('1');
  const { data: signer } = useSigner();

  const createNewFlow = useCallback(async () => {
    if (!superToken || !sf || !contractAddress || !signer) return;

    try {
      const params: ICreateFlowParams = {
        receiver: contractAddress?.addressOrName,
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
  }, [sf, superToken, contractAddress, signer]);

  return (
    <Dialog open={open} maxWidth={false} onClose={() => setOpen(false)} sx={{ px: 10 }}>
      <DialogTitle>Bid to Create a new Advertisement</DialogTitle>
      <DialogContent>
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
