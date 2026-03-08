import * as React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  styled,
  Button,
  Box,
  Menu,
  MenuItem,
  Chip,
} from "@mui/material";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ListItemIcon from "@mui/material/ListItemIcon";
import PersonIcon from "@mui/icons-material/Person";
import CreateIcon from "@mui/icons-material/Create";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import LogoutIcon from "@mui/icons-material/Logout";
import { LoadingButton } from "@mui/lab";

import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";

const StyledToolbar = styled(Toolbar)({
  display: "flex",
  justifyContent: "space-between",
});

const UserActions = styled("div")(({ theme }) => ({
  display: "none",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  padding: "0 10px",
  borderRadius: theme.shape.borderRadius,
  [theme.breakpoints.up("sm")]: {
    display: "flex",
  },
}));

function NavBar() {
  const [account, setAccount] = useState(null);          // connected wallet address
  const [connecting, setConnecting] = useState(false);   // loading state for connect button
  const [menuAnchor, setMenuAnchor] = useState(null);   // profile menu anchor

  const navigate = useNavigate();
  const { currentUserCredentials, signout } = useAuth();

  // Restore previously connected account on mount
  useEffect(() => {
    if (!window.ethereum) return;

    // If already authorized, get accounts silently
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) setAccount(accounts[0]);
      });

    // Listen for account changes (user switches wallet)
    const handleAccountsChanged = (accounts) => {
      setAccount(accounts.length > 0 ? accounts[0] : null);
    };
    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
    };
  }, []);

  // Connect MetaMask wallet
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install it from https://metamask.io");
      return;
    }
    try {
      setConnecting(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      setAccount(accounts[0]);
    } catch (err) {
      console.error("Wallet connection rejected:", err);
    } finally {
      setConnecting(false);
    }
  }, []);

  // Disconnect (just clears local state — MetaMask doesn't have a true disconnect API)
  const disconnectWallet = useCallback(() => {
    setAccount(null);
    setMenuAnchor(null);
  }, []);

  const handleSignout = async () => {
    try {
      await signout();
      navigate("/sign-in");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <AppBar position="sticky" sx={{ bgcolor: "#EFEFEF" }}>
      <StyledToolbar>
        {/* Logo */}
        <Typography
          variant="h6"
          sx={{ display: { xs: "none", sm: "block" }, color: "#717171" }}
        >
          CrowdHelp
        </Typography>
        <StorefrontIcon sx={{ display: { xs: "block", sm: "none" } }} />

        <UserActions>
          {/* Create Campaign button */}
          <Button
            variant="outlined"
            startIcon={<CreateIcon />}
            onClick={() => navigate("/create-campaign")}
          >
            Create Campaign
          </Button>

          {/* Wallet connect / account display */}
          {account ? (
            <>
              <Chip
                icon={<AccountBalanceWalletIcon />}
                label={account.substring(0, 6) + "..." + account.slice(-4)}
                variant="outlined"
                color="success"
                onClick={(e) => setMenuAnchor(e.currentTarget)}
                sx={{ cursor: "pointer", fontFamily: "monospace" }}
              />
              <Menu
                anchorEl={menuAnchor}
                open={Boolean(menuAnchor)}
                onClose={() => setMenuAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem onClick={() => { navigate("/profile"); setMenuAnchor(null); }}>
                  <ListItemIcon><PersonIcon fontSize="small" /></ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={disconnectWallet}>
                  <ListItemIcon><AccountBalanceWalletIcon fontSize="small" /></ListItemIcon>
                  Disconnect Wallet
                </MenuItem>
                {currentUserCredentials && (
                  <MenuItem onClick={handleSignout}>
                    <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
                    Sign Out
                  </MenuItem>
                )}
              </Menu>
            </>
          ) : (
            <LoadingButton
              variant="contained"
              loading={connecting}
              loadingIndicator="Connecting..."
              startIcon={<AccountBalanceWalletIcon />}
              onClick={connectWallet}
              color="primary"
            >
              Connect Wallet
            </LoadingButton>
          )}
        </UserActions>
      </StyledToolbar>
    </AppBar>
  );
}

export default NavBar;
