import { ChangeEvent, useCallback, useContext, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardHeader,
  Divider,
  Grid,
  IconButton,
  lighten,
  styled,
  Tooltip,
  Typography,
} from '@mui/material';
import DeleteTwoToneIcon from '@mui/icons-material/DeleteTwoTone';
import YoutubeEmbed from '../components/Video/Embed';
import OpenSeaIcon from '../components/ButtonsNFT/OpenSea';
import FlatPagePlayer from '../billboardDisplays/FlatPagePlayer';
import {
  SuperfluidContext,
  toFlowPerMinute,
  useContractReceiver,
  useContractStreams,
  useSuperFluid,
} from '../hooks/superfluid';

const AvatarAddWrapper = styled(Avatar)(
  ({ theme }) => `
        background: ${theme.colors.alpha.black[5]};
        color: ${theme.colors.primary.main};
        width: ${theme.spacing(8)};
        height: ${theme.spacing(8)};
`,
);

const CardLogo = styled('img')(
  ({ theme }) => `
      border: 1px solid ${theme.colors.alpha.black[30]};
      border-radius: ${theme.general.borderRadius};
      padding: ${theme.spacing(1)};
      margin-right: ${theme.spacing(2)};
      background: ${theme.colors.alpha.white[100]};
`,
);

const CardAddAction = styled(Card)(
  ({ theme }) => `
        border: ${theme.colors.primary.main} dashed 1px;
        height: 100%;
        color: ${theme.colors.primary.main};
        box-shadow: none;
        
        .MuiCardActionArea-root {
          height: 100%;
          justify-content: center;
          align-items: center;
          display: flex;
        }
        
        .MuiTouchRipple-root {
          opacity: .2;
        }
        
        &:hover {
          border-color: ${theme.colors.alpha.black[100]};
        }
`,
);

const IconButtonError = styled(IconButton)(
  ({ theme }) => `
     background: ${theme.colors.error.lighter};
     color: ${theme.colors.error.main};
     padding: ${theme.spacing(0.5)};

     &:hover {
      background: ${lighten(theme.colors.error.lighter, 0.4)};
     }
`,
);

const CardCc = styled(Card)(
  ({ theme }) => `
     border: 1px solid ${theme.colors.alpha.black[30]};
     background: ${theme.colors.alpha.black[5]};
     box-shadow: none;
`,
);

const BillboardToken = '0';

function AdFlow() {
  const data = {
    savedCards: 7,
  };

  const { allStreams, activeStream, youAreActiveBidder } = useContractStreams();

  const receiverResult = useContractReceiver();

  const [selectedValue, setSelectedValue] = useState('a');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  const { contractAddress } = useContext(SuperfluidContext);

  const viewOnOpenSea = useCallback(() => {
    const openSeaUrl = `https://testnets.opensea.io/assets/goerli/mumbai/${contractAddress}/${BillboardToken}`;

    window.location.href = openSeaUrl;
  }, [contractAddress]);

  const handleDelete = () => {};

  if (!allStreams) return <p>loading...</p>;

  return (
    <Card>
      <Box p={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <CardCc sx={{ px: 2, pt: 2, pb: 1 }}>
              <Box display="flex" alignItems="center">
                <Box>
                  <Typography variant="h3" fontWeight="normal">
                    {activeStream && <>flowRate: {toFlowPerMinute(activeStream.netFlow)}</>}
                    {!activeStream && <>No active stream</>}
                  </Typography>
                  <Typography variant="subtitle2">
                    {` xDai / min: `}
                    <Typography component="span" color="text.primary">
                      {activeStream?.sender}
                    </Typography>
                  </Typography>
                </Box>
              </Box>
              <Box pt={3} display="flex" alignItems="center" justifyContent="space-between">
                <Tooltip arrow title="Remove this card">
                  <IconButtonError onClick={() => handleDelete()}>
                    <DeleteTwoToneIcon fontSize="small" />
                  </IconButtonError>
                </Tooltip>
              </Box>
            </CardCc>
          </Grid>
          <Grid item xs={12} sm={4}>
            <CardCc sx={{ px: 2, pt: 2, pb: 1 }}>
              <FlatPagePlayer />
            </CardCc>
          </Grid>
          <Grid item xs={12} sm={4}>
            <CardCc sx={{ px: 2, pt: 2, pb: 1 }}>
              <Box display="flex" alignItems="center">
                <Box>
                  <Typography variant="h3" fontWeight="normal">
                    46342923292992
                  </Typography>
                  <Typography variant="subtitle2">
                    {` xDai / seg: `}
                    <Typography component="span" color="text.primary">
                      200
                    </Typography>
                  </Typography>
                </Box>
              </Box>
              <Box pt={3} display="flex" alignItems="center" justifyContent="space-between">
                <Tooltip arrow title="Remove this card">
                  <IconButtonError onClick={() => handleDelete()}>
                    <DeleteTwoToneIcon fontSize="small" />
                  </IconButtonError>
                </Tooltip>
              </Box>
            </CardCc>
          </Grid>
        </Grid>
        <Grid container spacing={3} sx={{ mt: 0.01 }}>
          <Grid item xs={12} sm={4}></Grid>
          <Grid item xs={12} sm={2}>
            <Button variant={'text'} sx={{ background: '#FAFDFF' }}>
              <Typography fontSize={13}>{`Place an Ad`}</Typography>
            </Button>
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              startIcon={<OpenSeaIcon size={44}></OpenSeaIcon>}
              variant={'text'}
              sx={{ background: '#FAFDFF' }}
              onClick={viewOnOpenSea}
            >
              <Typography fontSize={13}>{`Buy on Open Sea`}</Typography>
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}></Grid>
        </Grid>
      </Box>
    </Card>
  );
}

export default AdFlow;
