import {
  ErrorRounded,
  LocalConvenienceStoreOutlined,
} from "@mui/icons-material";
import {
  Button,
  Container,
  TextField,
  Typography,
  styled,
  Avatar,
  Link,
  Box,
  Grid,
  FormControlLabel,
  FormControl,
  InputLabel,
  Checkbox,
} from "@mui/material";
import React, { useEffect } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { LoadingButton } from "@mui/lab";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
// local imports...
import NavBar from "../../components/NavBar";

// service imports..
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import moment from "moment";

// MetaMask wallet connection

// smart-contract interaction -- for campaign creation..
import crowdHelp from "../../../utils/contract/crowdHelp";
import web3 from "../../../utils/web3";

// [block-chain] smart-contract related imports..
import { getAllSchemeTitles } from "../../../utils/getCampaigns";

const api_url = "http://localhost:4000/api/";

function FillCampaignDetails() {
  const navigate = useNavigate();
  const [walletAccount, setWalletAccount] = React.useState("");  // connected MetaMask address
  const [walletConnecting, setWalletConnecting] = React.useState(false);

  const [schemeTitles, setSchemeTitles] = React.useState([]);

  // On mount: check if wallet already connected + fetch scheme titles
  useEffect(() => {
    let ignore = false;
    const fetchData = async () => {
      const titles = await getAllSchemeTitles();
      if (!ignore) setSchemeTitles(titles);

      // Restore previously connected MetaMask account silently
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (!ignore && accounts[0]) setWalletAccount(accounts[0]);
      }
    };
    fetchData();

    // Listen for account changes
    if (window.ethereum) {
      const onChange = (accounts) => setWalletAccount(accounts[0] || "");
      window.ethereum.on("accountsChanged", onChange);
      return () => { ignore = true; window.ethereum.removeListener("accountsChanged", onChange); };
    }
    return () => { ignore = true; };
  }, []);

  // Connect MetaMask wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed! Please install it from https://metamask.io");
      return;
    }
    try {
      setWalletConnecting(true);
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAccount(accounts[0]);
    } catch (err) {
      console.error("Wallet connection rejected", err);
    } finally {
      setWalletConnecting(false);
    }
  };

  // hooks for getting form data..
  const {
    handleSubmit,
    register,
    control,
    formState: { isSubmitting, errors },
  } = useForm({
    mode: "onChange",
  });
  const [data, setData] = React.useState("");
  const [error, setError] = React.useState("");

  // hooks to handle acknowledgements..
  // hooks..
  const [responseMsg, setResponseMsg] = React.useState(""); // to display error messages.
  const [showResponse, setShowResponse] = React.useState(false); // To know whether error occured. ⁉ why not use length of error message
  const [responseSeverity, setResponseSeverity] = React.useState("error");

  // helpers..
  async function handleFilledCampaignDetails(data) {
    console.log("ABout to print data");
    console.log(data);
    console.log("deadline: " + data.deadlineDate + " " + data.deadlineTime);
    const timestamp = moment(
      data.deadlineDate + " " + data.deadlineTime,
      "YYYY-MM-DD HH:mm"
    ).valueOf();
    console.log(timestamp);
    console.log("timestamp printed");

    try {
      if (!window.ethereum) {
        setError("MetaMask is not installed. Please install it to proceed.");
        return;
      }

      console.log("Requesting accounts from MetaMask...");
      // Request MetaMask to reveal accounts (prompts popup if needed)
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (!accounts || accounts.length === 0) {
        setError("No wallet connected. Please connect MetaMask first.");
        return;
      }
      console.log("Connected account:", accounts[0]);

      // Convert timestamp from ms to s for Solidity
      const deadlineSeconds = Math.floor(timestamp / 1000);
      console.log("Converted deadline (seconds):", deadlineSeconds);

      // Create campaign by taking all the details..
      console.log("Sending createCampaign transaction...");
      await crowdHelp.methods
        .createCampaign(
          data.title,
          data.description,
          web3.utils.toWei(data.minContribAmount, "ether"),
          web3.utils.toWei(data.ethRaised, "ether"),
          deadlineSeconds,
          data.bannerUrl,
          parseInt(data.campaignSchemeId)
        )
        .send({
          from: accounts[0],
        });

      console.log("Campaign created successfully!");
      // After successful creation..
      navigate("/"); // navigate to home page
    } catch (err) {
      // upon error.. be on the same page and show the error.
      console.error("Error creating campaign:", err);
      setError(err.message || "An error occurred while creating the campaign.");
      setResponseMsg(err.message || "An error occurred.");
      setResponseSeverity("error");
      setShowResponse(true);
    } finally {
      console.log("Submission process finished.");
    }
  }

  const StyledDivLayout = styled("div")(({ theme }) => ({
    width: "auto",
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(2) * 2)]: {
      width: 600,
      marginLeft: "auto",
      marginRight: "auto",
    },
  }));

  const StyledDivPaper = styled("div")(({ theme }) => ({
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(3),
    padding: theme.spacing(2),
    [theme.breakpoints.up(600 + theme.spacing(3) * 2)]: {
      marginTop: theme.spacing(6),
      marginBottom: theme.spacing(6),
      padding: theme.spacing(3),
    },
  }));

  const StyledContainer = styled(Container)(({ theme }) => ({
    [theme.breakpoints.up("sm")]: {
      width: "80%",
    },
    [theme.breakpoints.down("sm")]: {
      width: "40%",
    },
  }));

  const handleClose = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setShowResponse(false);
  };

  return (
    <>
      <NavBar />
      <StyledContainer
        sx={{
          width: "80%",
        }}
      >
        <StyledDivLayout>
          <StyledDivPaper>
            <Typography
              variant="h5"
              textAlign={"center"}
              fontWeight="bold"
              sx={{ paddingBottom: 2.5 }}
            >
              Campaign Details
            </Typography>
            {/* Wallet connection banner */}
            {!walletAccount ? (
              <Alert
                sx={{ marginBottom: 2 }}
                severity="warning"
                action={
                  <LoadingButton
                    color="inherit"
                    size="small"
                    loading={walletConnecting}
                    loadingIndicator="Connecting..."
                    onClick={connectWallet}
                  >
                    Connect Wallet
                  </LoadingButton>
                }
              >
                Please connect your MetaMask wallet to create a campaign.
              </Alert>
            ) : (
              <Alert sx={{ marginBottom: 2 }} severity="success">
                Wallet connected: {walletAccount.substring(0, 10)}...{walletAccount.slice(-4)}
              </Alert>
            )}

            {/* For displaying errors.. */}
            {error && (
              <Alert sx={{ marginBottom: 2, marginTop: 2 }} severity="error">
                {error}
              </Alert>
            )}
            {errors.title ||
              errors.description ||
              errors.bannerUrl ||
              errors.minContribAmount ||
              errors.ethRaised ||
              errors.campaignSchemeId ||
              errors.walletAddress ||
              errors.deadlineDate ||
              errors.deadlineTime ? (
              <Alert sx={{ marginBottom: 2, marginTop: 2 }} severity="error">
                All fields are required
              </Alert>
            ) : null}

            <form
              autoComplete="on"
              onSubmit={handleSubmit(handleFilledCampaignDetails)}
            >
              <Grid
                container
                spacing={1.5}
                direction="row"
                justify="center"
                alignItems="stretch"
              >
                <Grid item xs={6} spacing={0}>
                  <Box display={"flex"} flexDirection="column" gap={2}>
                    <TextField
                      id="title"
                      {...register("title", { required: true })}
                      label="Campaign Title"
                      size="small"
                      fullWidth
                      disabled={isSubmitting}
                      variant="outlined"
                      helperText="About this campaign in 2-3 words"
                    />
                    <TextField
                      id="minContribAmount"
                      {...register("minContribAmount", { required: true })}
                      label="Minimum contribution amount"
                      size="small"
                      type="number"
                      inputProps={{
                        min: 0,
                        step: 0.00001,
                      }}
                      fullWidth
                      variant="outlined"
                      helperText="How much minimum amount you are expecting from backers?"
                      disabled={isSubmitting}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Grid styl={{ height: "70%" }}>
                    <TextField
                      id="description"
                      name="description"
                      {...register("description", { required: true })}
                      label="Campaign Description"
                      size="small"
                      multiline
                      rows={4.3}
                      fullWidth
                      helperText="Help people know about this campaign. Keep it simple and short."
                      disabled={isSubmitting}
                    />
                  </Grid>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="ethRaised"
                    {...register("ethRaised", { required: true })}
                    label="Goal (ETH)"
                    fullWidth
                    size="small"
                    type="number"
                    helperText="Amount to be raised"
                    inputProps={{
                      // min: 0.00000001,
                      step: 0.00001,
                    }}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    id="bannerUrl"
                    {...register("bannerUrl", { required: true })}
                    label="Banner Image URL"
                    type="url"
                    size="small"
                    fullWidth
                    title="This image will be shown as a banner"
                    helperText="Preferably from unsplash.com, flaticon.com, pexels.com."
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Box sx={{ padding: 0, margin: 0 }}>
                    <Typography variant="caption" color="GrayText">
                      Campaign ends at
                    </Typography>
                    <Box display={"flex"} flexDirection="row" gap={2}>
                      <TextField
                        id="deadlineDate"
                        {...register("deadlineDate", { required: true })}
                        type={"date"}
                        inputProps={{
                          min: `${new Date(
                            new Date().getTime() + 1 * 1 * 60 * 60 * 1000 // +1 day
                          )
                            .toJSON()
                            .slice(0, 10)}`,
                        }}
                        size="small"
                        disabled={isSubmitting}
                      />
                      <TextField
                        id="deadlineTime"
                        {...register("deadlineTime", { required: true })}
                        type={"time"}
                        size="small"
                        disabled={isSubmitting}
                      />
                    </Box>
                    <Typography variant="caption" color="GrayText">
                      Please set a reasonable range, neither too short nor too
                      long.
                    </Typography>
                  </Box>
                  <Box sx={{ paddingTop: 0, marginTop: 2 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="campaignSchemeId-label">Funding Scheme</InputLabel>
                      <Controller
                        name="campaignSchemeId"
                        control={control}
                        defaultValue={0}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            labelId="campaignSchemeId-label"
                            label="Funding Scheme"
                            disabled={isSubmitting}
                          >
                            <MenuItem value={0}>All or Nothing</MenuItem>
                            <MenuItem value={1}>Half Goal Withdraw</MenuItem>
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Box>

                </Grid>

                <Grid item xs={12} sm={6}>
                  {/* Just to be aligned with the date&time. */}
                  <Typography variant="caption">&nbsp;</Typography>
                  <TextField
                    required
                    id="walletAddress"
                    name="walletAddress"
                    label="Wallet Address (MetaMask)"
                    fullWidth
                    value={walletAccount}
                    inputProps={{
                      readOnly: "read-only",
                    }}
                    title="MetaMask account — read only"
                    size="small"
                    helperText="Auto-filled from connected MetaMask wallet."
                    disabled={isSubmitting}
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        required
                        color="secondary"
                        name="acceptConditions"
                        value="yes"
                      />
                    }
                    label="I/We understand that, once these fields are set cannot be updated."
                  />
                </Grid>
              </Grid>
              <LoadingButton
                type="submit"
                loading={isSubmitting}
                variant="contained"
                color="success"
                disabled={isSubmitting}
              >
                Create Campaign
              </LoadingButton>
            </form>
          </StyledDivPaper>
        </StyledDivLayout>
      </StyledContainer>
      <Snackbar
        open={showResponse}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert onClose={handleClose} severity={responseSeverity}>
          {responseMsg}
        </Alert>
      </Snackbar>
    </>
  );
}

export default FillCampaignDetails;
