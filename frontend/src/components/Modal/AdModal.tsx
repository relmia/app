import { Button, CircularProgress, Dialog, DialogActions, DialogContent, Snackbar, TextField } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import { DEFAULT_TOKEN_NAME } from '../../utils/constants';
import { useSigner } from 'wagmi';
import { useCallback, useContext, useState } from 'react';
import { ICreateFlowParams } from '@superfluid-finance/sdk-core';
import { SuperfluidContext, useSuperFluid, useSuperToken } from '../../hooks/superfluid';
import useTokenContractAddressAndAbi from '../../hooks/useTokenContractAddressAndAbi';
import { Alert } from '../Alert/Alert';
import { defaultAbiCoder } from '@ethersproject/abi';

function encodeLivePeerIdUserData(livePeerId: string) {
  return defaultAbiCoder.encode(['string'], [livePeerId]);
}

const AddModal = ({ setOpen, open }: { setOpen: (open: boolean) => void; open: boolean }): JSX.Element => {
  const [flowRate, setFlowRate] = useState('0');
  const [livePeerId, setLivePeerId] = useState('');
  const [txOnGoing, setTxOnGoing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  const { contractAddress, sf, superToken } = useContext(SuperfluidContext);

  const { data: signer } = useSigner();

  const createNewFlow = useCallback(async () => {
    if (!signer) return;

    try {
      setTxOnGoing(true);
      const params: ICreateFlowParams = {
        receiver: contractAddress,
        superToken: superToken.address,
        flowRate,
        userData: encodeLivePeerIdUserData(livePeerId),
      };

      const createFlowOperation = sf.cfaV1.createFlow(params);
      const txn = await createFlowOperation.exec(signer);
      await txn.wait();
      setShowSuccess(true);

      setOpen(false);
    } catch (e) {
      setShowError(true);
      console.error(e);
    } finally {
      setTxOnGoing(false);
    }
  }, [sf, superToken, contractAddress, signer, livePeerId, flowRate]);

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
          value={livePeerId}
          onChange={(e) => {
            setLivePeerId(e.target.value);
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
      <Snackbar open={showSuccess} autoHideDuration={3000}>
        <Alert
          severity="success"
          sx={{ width: '100%' }}
          onClose={() => {
            setShowSuccess(false);
          }}
        >
          Transaction confirmed
        </Alert>
      </Snackbar>
      <Snackbar
        open={showError}
        autoHideDuration={3000}
        onClose={() => {
          setShowError(false);
        }}
      >
        <Alert severity="error" sx={{ width: '100%' }}>
          There was an unexpected Error
        </Alert>
      </Snackbar>
    </Dialog>
  );
};

export default AddModal;
