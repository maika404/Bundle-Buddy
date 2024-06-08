import Transfer from "./_transfer";
import { ParticleAuthModule, ParticleProvider } from "@biconomy/particle-auth"; // Adjusted import
import { Wallet, providers, ethers } from "ethers";
import {
  createSmartAccountClient,
  BiconomySmartAccountV2,
  PaymasterMode,
  LightSigner,
} from "@biconomy/account";
import { Fragment, useEffect, useRef, useState } from "react";
import React from "react";

export default function SmartWallet() {
  const [loading, setLoading] = useState(false);
  const [smartAccount, setSmartAccount] = useState<BiconomySmartAccountV2 | null>(null);
  const [smartAccountAddress, setSmartAccountAddress] = useState<string | null>(null);
  const [web3Provider, setWeb3Provider] = useState<ethers.providers.Web3Provider | null>(null);

  const particle = new ParticleAuthModule.ParticleNetwork({
    projectId: "971a2620-33ef-4194-91f2-eac12bbb28d9",
    clientKey: "cfGpbUsUpQIdHuwmYHjCdq4sp4wWj90zdQ1a5GhE",
    appId: "scG0UaCGKVnJVZIYqnJtgsS3zgBDg7PPSxoaCkPn",
    wallet: {
      displayWalletEntry: true,
      defaultWalletEntryPosition: ParticleAuthModule.WalletEntryPosition.BR,
    },
  });

  const particleProvider = new ParticleProvider(particle.auth);

  const chains = [
    {
      chainId: 80002,
      name: "Polygon Amoy",
      bundlerUrl: "https://bundler.biconomy.io/api/v2/80002/nJPK7B3ru.dd7f7861-190d-41bd-af80-6877f74b8f44",
      providerUrl: "https://polygon-amoy.g.alchemy.com/v2/LM5pilCLDwykTJMEltOgIxxf6ljjlb9t",
      biconomyPaymasterApiKey: "64pDhC-b5.8169304c-3645-4ad6-b3c3-c6e91ece7c4b",
      explorerUrl: "https://www.oklink.com/amoy/tx/",
    },
  ];

  const connect = async () => {
    try {
      setLoading(true);
      const userInfo = await particle.auth.login();
      console.log("Logged in user:", userInfo);
      const particleProvider = new ParticleProvider(particle.auth);
      const web3Provider = new ethers.providers.Web3Provider(particleProvider, "any");
      setWeb3Provider(web3Provider);

      const config = {
        biconomyPaymasterApiKey: chains[0].biconomyPaymasterApiKey,
        bundlerUrl: chains[0].bundlerUrl,
        rpcUrl: chains[0].providerUrl,
      };

      const smartAccount = await createSmartAccountClient({
        signer: web3Provider.getSigner() as LightSigner,
        bundlerUrl: config.bundlerUrl,
        biconomyPaymasterApiKey: config.biconomyPaymasterApiKey,
        rpcUrl: config.rpcUrl,
      });

      console.log("Biconomy Smart Account", smartAccount);
      setSmartAccount(smartAccount);
      const saAddress = await smartAccount.getAccountAddress();
      console.log("Smart Account Address", saAddress);
      setSmartAccountAddress(saAddress);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const logOut = async () => {
    try {
      await particle.auth.logout();
      console.log("Logout successful");
      setSmartAccount(null);
      setSmartAccountAddress(null);
      setWeb3Provider(null);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Fragment>
      {smartAccount && (
        <button
          onClick={logOut}
          className="absolute right-0 m-3 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-all hover:from-green-500 hover:to-blue-600"
        >
          Logout
        </button>
      )}

      <div className="m-auto flex h-screen flex-col items-center justify-center gap-10 bg-gray-950">
        <h1 className="text-4xl text-gray-50 font-bold tracking-tight lg:text-5xl">
          Welcome to Bundle Buddy!!
        </h1>

        {!smartAccount && !loading && (
          <button
            onClick={connect}
            className="mt-10 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-colors hover:from-green-500 hover:to-blue-600"
          >
            Login
          </button>
        )}

        {loading && <p>Loading account details...</p>}

        {smartAccount && web3Provider && (
          <Fragment>
            <p>Your smart account address is: {smartAccountAddress}</p>
            <Transfer smartAccount={smartAccount} web3Provider={web3Provider} />
          </Fragment>
        )}
      </div>
    </Fragment>
  );
}
