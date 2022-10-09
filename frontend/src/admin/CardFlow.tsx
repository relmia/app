import { ChangeEvent, useCallback, useContext, useEffect, useState } from 'react';
import { Avatar, Box, Button, Card, Grid, IconButton, lighten, styled, Tooltip, Typography } from '@mui/material';
import OpenSeaIcon from '../components/ButtonsNFT/OpenSea';
import StopCircleIcon from '@mui/icons-material/StopCircle';
import FlatPagePlayer from '../billboardDisplays/FlatPagePlayer';
import { SuperfluidContext, toFlowPerMinute, useContractReceiver, useContractStreams } from '../hooks/superfluid';
import AddModal from '../components/Modal/AdModal';
import { useProvider } from 'wagmi';
import { DEFAULT_TOKEN_NAME } from '../utils/constants';

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

const BillboardToken = '1';

function AdFlow() {
  const data = {
    savedCards: 7,
  };

  const { allStreams, activeStream, youAreActiveBidder } = useContractStreams();

  const [senderBalance, setSenderBalance] = useState<string>();
  const [receiverBalance, setReceiverBalance] = useState<string>();

  const { superToken } = useContext(SuperfluidContext);

  const provider = useProvider();

  useEffect(() => {
    if (!provider) return;
    const sender = activeStream?.sender;

    if (sender) {
      const update = async () => {
        const balance = await superToken.balanceOf({
          account: sender,
          providerOrSigner: provider,
        });

        setSenderBalance(balance);
      };

      const interval = setInterval(() => {
        update();
      }, 1000);

      return () => {
        clearInterval(interval);
      };
    } else {
      setSenderBalance(undefined);
    }
  }, [activeStream?.sender, provider]);

  const receiverResult = useContractReceiver();

  useEffect(() => {
    if (!provider) return;
    const receiver = receiverResult?.receiver;

    if (receiver) {
      const update = async () => {
        const balance = await superToken.balanceOf({
          account: receiver,
          providerOrSigner: provider,
        });

        setReceiverBalance(balance);
      };

      const interval = setInterval(() => {
        update();
      }, 2500);

      return () => {
        clearInterval(interval);
      };
    } else {
      setSenderBalance(undefined);
    }
  }, [activeStream?.sender, provider]);

  const [selectedValue, setSelectedValue] = useState('a');

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedValue(event.target.value);
  };

  const { contractAddress } = useContext(SuperfluidContext);

  const viewOnOpenSea = useCallback(() => {
    const openSeaUrl = `https://testnets.opensea.io/assets/mumbai/${contractAddress}/${BillboardToken}`;

    window.location.href = openSeaUrl;
  }, [contractAddress]);

  const [placeBidOPen, setPlaceBidOpen] = useState(false);

  const handleStop = useCallback(() => {}, []);

  if (!allStreams) return <p>loading...</p>;

  return (
    <>
      <Card>
        <Box p={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <CardCc sx={{ px: 2, pt: 2, pb: 1 }}>
                <Box display="flex" alignItems="center">
                  <Box>
                    <Typography variant="h2" fontWeight="normal">
                      Active add hoster
                    </Typography>
                    <Typography variant="h3" fontWeight="normal">
                      {activeStream && senderBalance && (
                        <>{`${senderBalance} ${DEFAULT_TOKEN_NAME} --> ${toFlowPerMinute(-activeStream.netFlow)}`}</>
                      )}
                      {!activeStream && <>No active stream</>}
                    </Typography>
                    <Typography variant="subtitle2">
                      <Typography component="span" color="text.primary">
                        active ad creator: {activeStream?.sender}
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
                <Box pt={3} display="flex" alignItems="center" justifyContent="space-between">
                  {youAreActiveBidder && (
                    <>
                      <Tooltip arrow title="Stop your ad">
                        <IconButtonError onClick={() => handleStop()}>
                          <StopCircleIcon fontSize="small" />
                        </IconButtonError>
                      </Tooltip>
                    </>
                  )}
                  {!youAreActiveBidder && !receiverResult?.youAreReceiver && (
                    <>
                      <Button
                        variant={'text'}
                        sx={{ background: '#FAFDFF' }}
                        onClick={(e) => {
                          e.preventDefault();
                          setPlaceBidOpen(true);
                        }}
                      >
                        <Typography fontSize={13}>{`Place an Ad`}</Typography>
                      </Button>
                    </>
                  )}
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
                    <Typography variant="h2" fontWeight="normal">
                      Billboard NFT Owner
                    </Typography>
                    <Typography variant="h3" fontWeight="normal">
                      {activeStream?.netFlow && receiverBalance && (
                        <>{`${toFlowPerMinute(-activeStream.netFlow)} --> ${receiverBalance} ${DEFAULT_TOKEN_NAME}`}</>
                      )}
                      {!receiverResult && 'loading...'}
                    </Typography>
                    <Typography variant="subtitle2">
                      <Typography component="span" color="text.primary">
                        {receiverResult && `Owner: ${receiverResult.receiver}`}
                      </Typography>
                    </Typography>
                  </Box>
                </Box>
                <Box pt={3} display="flex" alignItems="center" justifyContent="space-between">
                  {receiverResult?.youAreReceiver && 'You are the owner of this billboard NFT'}
                </Box>
              </CardCc>
            </Grid>
          </Grid>
          <Grid container spacing={3} sx={{ mt: 0.01 }}>
            <Grid item xs={12} sm={4}></Grid>
            <Grid item xs={12} sm={4}>
              <Button
                fullWidth={true}
                startIcon={<OpenSeaIcon size={44}></OpenSeaIcon>}
                variant={'outlined'}
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
      <AddModal setOpen={setPlaceBidOpen} open={placeBidOPen}></AddModal>
      {/*     <CreateFlowTest />*/}
    </>
  );
}

export default AdFlow;
