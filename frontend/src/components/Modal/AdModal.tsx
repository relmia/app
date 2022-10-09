import { Button, CircularProgress, Dialog, DialogActions, DialogContent, Snackbar, TextField } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import { DEFAULT_TOKEN_NAME } from '../../utils/constants';
import { useSigner } from 'wagmi';
import { useCallback, useState } from 'react';
import { ICreateFlowParams } from '@superfluid-finance/sdk-core';
import { useSuperFluid, useSuperToken } from '../../hooks/superfluid';
import useTokenContractAddressAndAbi from '../../hooks/useTokenContractAddressAndAbi';
import { Alert } from '../Alert/Alert';

const AddModal = ({ setOpen, open }: { setOpen: any; open: boolean }): JSX.Element => {
  const sf = useSuperFluid();
  const superToken = useSuperToken({ sf, tokenName: DEFAULT_TOKEN_NAME });
  const [flowRate, setFlowRate] = useState('0');
  const [idVideo, setIdVideo] = useState(0);
  const [txOnGoing, setTxOnGoing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const contractAddress = useTokenContractAddressAndAbi();

  const { data: signer } = useSigner();

  const createNewFlow = useCallback(async () => {
    if (!superToken || !sf || !contractAddress || !signer) return;

    try {
      setTxOnGoing(true);
      const params: ICreateFlowParams = {
        receiver: contractAddress?.addressOrName,
        superToken: superToken.address,
        flowRate,
      };

      const createFlowOperation = sf.cfaV1.createFlow(params);
      const txn = await createFlowOperation.exec(signer);
      await txn.wait();
      setShowSuccess(true);
    } catch (e) {
      setShowError(true);
      console.error(e);
    } finally {
      setTxOnGoing(false);
    }
  }, [sf, superToken, contractAddress, signer]);

  return (
    <Dialog open={open} maxWidth={false} onClose={() => setOpen(false)} sx={{ px: 10 }}>
      <DialogTitle>{`Bid to Create a new Advertisement`}</DialogTitle>
      <DialogContent>
        <TextField
          value={flowRate}
          disabled={txOnGoing}
          onChange={(event) => {
            setFlowRate(event.target.value);
          }}
          autoFocus
          margin="dense"
          id="Amount"
          label="Amount"
          type="number"
          fullWidth
          variant="outlined"
        />
        <TextField
          disabled={txOnGoing}
          value={idVideo}
          onChange={(e) => {
            setIdVideo(+e.target.value);
          }}
          margin="dense"
          id="id"
          label="Livepeer ID"
          type="text"
          fullWidth
          variant="outlined"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={createNewFlow} variant="contained" disabled={txOnGoing}>
          {txOnGoing && <CircularProgress></CircularProgress>}
          Add
        </Button>
      </DialogActions>
      <Snackbar open={showSuccess} autoHideDuration={4000}>
        <Alert severity="success" sx={{ width: '100%' }}>
          Transaction confirmed
        </Alert>
      </Snackbar>
      <Snackbar open={showError} autoHideDuration={4000}>
        <Alert severity="error" sx={{ width: '100%' }}>
          There was an unexpected Error
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AddModal;
