import { alpha, Avatar, Box, Divider, lighten, Stack, styled, useTheme } from '@mui/material';
// import { SidebarContext } from '../../../contexts/SidebarContext';
import Web3Login from '../../../web3/Web3Login';

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
        height: ${theme.header.height};
        color: ${theme.header.textColor};
        padding: ${theme.spacing(0, 2)};
        right: 0;
        z-index: 6;
        background-color: ${alpha(theme.header.background, 0.95)};
        backdrop-filter: blur(3px);
        position: fixed;
        justify-content: space-between;
        width: 100%;
      
`,
);

function Header() {
  // const { sidebarToggle, toggleSidebar } = useContext(SidebarContext);
  const theme = useTheme();

  const LogoApp = () => (
    <Avatar variant={'square'} alt="Relmia" src="/static/images/logo.png" sx={{ width: 250, height: 70, ml: 10 }} />
  );

  return (
    <HeaderWrapper
      display="flex"
      alignItems="center"
      sx={{
        boxShadow:
          theme.palette.mode === 'dark'
            ? `0 1px 0 ${alpha(
                lighten(theme.colors.primary.main, 0.7),
                0.15,
              )}, 0px 2px 8px -3px rgba(0, 0, 0, 0.2), 0px 5px 22px -4px rgba(0, 0, 0, .1)`
            : `0px 2px 8px -3px ${alpha(theme.colors.alpha.black[100], 0.2)}, 0px 5px 22px -4px ${alpha(
                theme.colors.alpha.black[100],
                0.1,
              )}`,
      }}
    >
      <Stack direction="row" divider={<Divider orientation="vertical" flexItem />} alignItems="center" spacing={2}>
        <LogoApp></LogoApp>
      </Stack>
      <Box display="flex" alignItems="center">
        {/* <HeaderButtons /> */}
        <Web3Login />
        <Box
          component="span"
          sx={{
            ml: 2,
            display: { lg: 'none', xs: 'inline-block' },
          }}
        >
          {/* <Tooltip arrow title="Toggle Menu">
            <IconButton color="primary" onClick={toggleSidebar}>
              {!sidebarToggle ? <MenuTwoToneIcon fontSize="small" /> : <CloseTwoToneIcon fontSize="small" />}
            </IconButton>
          </Tooltip> */}
        </Box>
      </Box>
    </HeaderWrapper>
  );
}

export default Header;
