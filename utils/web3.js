import Web3 from "web3";

let web3;

if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
    // MetaMask is installed — use it
    web3 = new Web3(window.ethereum);
} else {
    // Fallback to local Hardhat node
    web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:8545"));
}

export default web3;

