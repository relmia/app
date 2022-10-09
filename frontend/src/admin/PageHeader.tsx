import { Box, Typography } from '@mui/material';

function PageHeader() {
  // const user = {
  //   name: 'Catherine Pike',
  //   avatar: '/static/images/avatars/1.jpg'
  // };

  return (
    <Box sx={{ textAlign: 'center' }}>
      <Typography variant="h3" component="h3" gutterBottom>
        Real-Time Billboard Auction
      </Typography>
    </Box>
  );
}

export default PageHeader;
