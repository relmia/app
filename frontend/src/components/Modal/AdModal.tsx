import { Box, Dialog, Divider, Typography } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';

const AddModal = ({
  setOpen,
  open
}: {
  setOpen: any;
  open: boolean;
}): JSX.Element => {
  return (
    <Dialog
      open={open}
      maxWidth={false}
      onClose={() => setOpen(false)}
      sx={{ p: 2 }}
    >
      <DialogTitle>
        <Box alignItems="center" textAlign={'center'} sx={{ p: 1 }}>
          <Typography fontWeight={'bold'} fontSize={18}>
            {`Add your advertisement`}
          </Typography>
        </Box>
      </DialogTitle>
      <Divider />
    </Dialog>
  );
};

export default AddModal;
