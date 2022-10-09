import { Box, Card, CardActions, CardHeader, Divider, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';

import MoreHorizTwoToneIcon from '@mui/icons-material/MoreHorizTwoTone';
import AddModal from '../components/Modal/AdModal';
import { useContext, useState } from 'react';
import {
  SuperfluidContext,
  toFlowPerMinute,
  useContractStreams,
  useSuperFluid,
  useSuperToken,
} from '../hooks/superfluid';
import { DEFAULT_TOKEN_NAME } from '../utils/constants';
import useTokenContractAddressAndAbi from '../hooks/useTokenContractAddressAndAbi';
import { useAccount } from 'wagmi';
import CardFlow from './CardFlow';

const CardActionsWrapper = styled(CardActions)(
  ({ theme }) => `
     background: ${theme.colors.alpha.black[5]};
     padding: ${theme.spacing(3)};
`,
);

const InfoDebug = () => {
  const { allStreams, activeStream, youAreActiveBidder } = useContractStreams();

  const { contractAddress } = useContext(SuperfluidContext);

  const { address } = useAccount();

  if (!allStreams) return <p>loading...</p>;

  return (
    <>
      <h2>Active Stream </h2>
      {activeStream && (
        <>
          <p>
            flowRate: {toFlowPerMinute(activeStream.netFlow)} | from: {activeStream.sender}
          </p>
          {youAreActiveBidder && (
            <p>
              <b>You are the highest bidder</b>
            </p>
          )}
          {!youAreActiveBidder && (
            <p>
              Place a bid greater than {activeStream.sender}'s to replace the ad with yours <br />
              ToDo: button to place bid
            </p>
          )}
        </>
      )}
      {!activeStream && <p>There is no active stream</p>}
    </>
  );
};

function BillboardDashboard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <CardFlow></CardFlow>
      {/* <InfoDebug /> */}
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

function BillboardDashboardWrapper() {
  const sf = useSuperFluid();
  const superToken = useSuperToken({ sf, tokenName: DEFAULT_TOKEN_NAME });

  const contractAddress = useTokenContractAddressAndAbi();

  if (!sf || !superToken || !contractAddress) return null;

  return (
    <SuperfluidContext.Provider
      value={{
        sf,
        superToken,
        contractAddress: contractAddress.addressOrName,
        contractAbi: contractAddress.abi,
      }}
    >
      <BillboardDashboard></BillboardDashboard>
    </SuperfluidContext.Provider>
  );
}

export default BillboardDashboardWrapper;
