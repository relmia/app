import { Box, Button, Card, CardActions, CardHeader, Divider, IconButton, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

import MoreHorizTwoToneIcon from '@mui/icons-material/MoreHorizTwoTone';
import CommentTwoToneIcon from '@mui/icons-material/CommentTwoTone';
import ShareTwoToneIcon from '@mui/icons-material/ShareTwoTone';
import Text from '../../../../components/Text';
import AddModal from '../../../../components/Modal/AdModal';
import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import YoutubeEmbed from '../../../../components/Video/Embed';
import Balance from './Balance';
import { useSuperFluid, useSuperToken } from '../../../../hooks/superfluid';
import { DEFAULT_TOKEN_NAME } from '../../../../utils/constants';

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
      <Balance></Balance>
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

        <Box px={3} pb={2}>
          <Typography variant="h2" sx={{ pb: 1 }}>
            Metaverse Billboad
          </Typography>
        </Box>
        <YoutubeEmbed></YoutubeEmbed>
        <Divider />
        <CardActionsWrapper
          sx={{
            display: { xs: 'block', md: 'flex' },
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Button
              startIcon={<AddIcon />}
              variant="contained"
              onClick={() => {
                setOpen(true);
              }}
            >
              Add
            </Button>
            <Button startIcon={<CommentTwoToneIcon />} variant="outlined" sx={{ mx: 2 }}>
              Comment
            </Button>
            <Button startIcon={<ShareTwoToneIcon />} variant="outlined">
              Share
            </Button>
          </Box>
          <Box sx={{ mt: { xs: 2, md: 0 } }}>
            <Typography variant="subtitle2" component="span">
              <Text color="black">
                <b>485</b>
              </Text>{' '}
              reactions •{' '}
              <Text color="black">
                <b>63</b>
              </Text>{' '}
              comments
            </Typography>
          </Box>
        </CardActionsWrapper>
        <AddModal setOpen={setOpen} open={open}></AddModal>
      </Card>
    </>
  );
}

export default BillboardDashboard;