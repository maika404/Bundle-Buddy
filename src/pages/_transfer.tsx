import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  BiconomySmartAccountV2,
  PaymasterMode,
} from "@biconomy/account";
import React from "react";

const USDC_CONTRACT_ADDRESS = "0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582"; // Replace with the actual USDC contract address


export default function Transfer({ 
  smartAccount, 
  web3Provider 
}: { 
  smartAccount: BiconomySmartAccountV2;
  web3Provider: ethers.providers.Web3Provider;
}) {
  const [smartContractAddress, setSmartContractAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState(0);
  const [recipient, setRecipient] = useState("");

  const ERC20ABI = [
    {
      inputs: [
        { internalType: "address", name: "to", type: "address" },
        { internalType: "uint256", name: "amount", type: "uint256" },
      ],
      name: "transfer",
      outputs: [{ internalType: "bool", name: "", type: "bool" }],
      stateMutability: "nonpayable",
      type: "function",
    },
    {
      inputs: [],
      name: "decimals",
      outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
      stateMutability: "view",
      type: "function",
    },
  ];

  useEffect(() => {
    const getSmartContractAddress = async () => {
      const address = await smartAccount.getAccountAddress();
      setSmartContractAddress(address);
    };
    getSmartContractAddress();
  }, [smartAccount]);

  const transfer = async () => {
    try {
      setIsLoading(true);

      const tokenContract = new ethers.Contract(USDC_CONTRACT_ADDRESS, ERC20ABI, web3Provider.getSigner());

      const decimals = await tokenContract.decimals();
      const amountInLowestUnit = ethers.utils.parseUnits("1.2", decimals);

      const populatedTransferTxn = await tokenContract.populateTransaction.transfer(recipient, amountInLowestUnit);


      const tx = {
        to: USDC_CONTRACT_ADDRESS,
        data: populatedTransferTxn.data,
        value: 0,
      };

      const userOpResponse = await smartAccount.sendTransaction(tx, {
        paymasterServiceData: { mode: PaymasterMode.SPONSORED },
      });

      const { transactionHash } = await userOpResponse.waitForTxHash();
      console.log("Transaction Hash", transactionHash);

      const userOpReceipt = await userOpResponse.wait();
      if (userOpReceipt.success === 'true') {
        console.log("UserOp receipt", userOpReceipt);
        console.log("Transaction receipt", userOpReceipt.receipt);
        window.alert("Transaction successful!");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <p className="text-sm">Your smart account address is: {smartContractAddress}</p>
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <div>
          <p>Transfer tokens from your account to another:</p>
          <div className="mt-5 flex w-auto flex-col gap-2">
            <input
              className="rounded-xl border-2 p-1 text-gray-500"
              type="text"
              placeholder="Enter address"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
            <input
              className="rounded-xl border-2 p-1 text-gray-500"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
            <button
              className="w-32 rounded-lg bg-gradient-to-r from-green-400 to-blue-500 px-4 py-2 font-medium transition-all hover:from-green-500 hover:to-blue-600"
              onClick={transfer}
            >
              Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
