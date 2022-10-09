import { Box, Card, CardActions, CardHeader, Divider, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

import MoreHorizTwoToneIcon from '@mui/icons-material/MoreHorizTwoTone';
import AddModal from '../../../../components/Modal/AdModal';
import { useState } from 'react';
import { useSuperFluid, useSuperToken } from '../../../../hooks/superfluid';
import { DEFAULT_TOKEN_NAME } from '../../../../utils/constants';
import CardFlow from '../../../../components/CardFlow/CardFlow';

const CardActionsWrapper = styled(CardActions)(
  ({ theme }) => `
     background: ${theme.colors.alpha.black[5]};
     padding: ${theme.spacing(3)};
`,
);

function BillboardDashboard() {
  const [open, setOpen] = useState(false);
  const sf = useSuperFluid();
  const token = useSuperToken({ sf, tokenName: DEFAULT_TOKEN_NAME });

  return (
    <>
      <CardFlow></CardFlow>
      <Box sx={{ p: 2 }}></Box>
      <Card>
        <CardHeader
          action={
            <IconButton color="primary">
              <MoreHorizTwoToneIcon fontSize="medium" />
            </IconButton>
          }
          titleTypographyProps={{ variant: 'h4' }}
          subheaderTypographyProps={{ variant: 'subtitle2' }}
        />

        <Divider />
        <AddModal setOpen={setOpen} open={open}></AddModal>
      </Card>
    </>
  );
}

export default BillboardDashboard;
