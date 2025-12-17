"use client";

// src/features/loan/hooks/useSendCollateral.js
// Purpose: Trigger the connected wallet UI (extension popup or WalletConnect mobile)
// to sign/approve and send the collateral transfer.

import { useCallback } from "react";

// AppKit hooks (multichain namespaces: eip155, solana, bip122)
import { useAppKitAccount, useAppKitProvider } from "@reown/appkit/react";

// EVM (ethers v6)
import { BrowserProvider, Contract } from "ethers";

// Solana
import { useAppKitConnection } from "@reown/appkit-adapter-solana/react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";

const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
];

/**
 * @param {Object} p
 * @param {"EVM"|"SOL"|"BTC"|"TON"} p.chain
 * @param {string} p.recipient        // CoinRabbit collateral deposit address
 * @param {string} p.amountAtomic     // wei / lamports / sats (string)
 * @param {"native"|"erc20"} [p.assetType]  // EVM only
 * @param {string} [p.tokenAddress]         // EVM only (required if erc20)
 */
export function useSendCollateral() {
  // Accounts per namespace (so we don't assume MetaMask; works with any connected wallet)
  const evmAccount = useAppKitAccount({ namespace: "eip155" });
  const solAccount = useAppKitAccount({ namespace: "solana" });
  const btcAccount = useAppKitAccount({ namespace: "bip122" });

  // Providers per namespace
  const { walletProvider: evmWalletProvider } = useAppKitProvider("eip155");
  const { walletProvider: solWalletProvider } = useAppKitProvider("solana");
  const { walletProvider: btcWalletProvider } = useAppKitProvider("bip122");

  // Solana RPC connection
  const { connection } = useAppKitConnection();

  const sendCollateral = useCallback(
    async p => {
      if (!p?.recipient) throw new Error("Missing recipient");
      if (!p?.amountAtomic || BigInt(p.amountAtomic) <= 0n) {
        throw new Error("Invalid amountAtomic");
      }

      // -------- EVM (native or ERC20) --------
      if (p.chain === "EVM") {
        if (!evmAccount?.isConnected)
          throw new Error("EVM wallet not connected");
        if (!evmWalletProvider) throw new Error("EVM walletProvider missing");

        // This is what triggers wallet confirmation UI (any EVM wallet via AppKit)
        const provider = new BrowserProvider(evmWalletProvider);
        const signer = await provider.getSigner();

        if (p.assetType === "erc20") {
          if (!p.tokenAddress) throw new Error("Missing tokenAddress (ERC20)");
          const token = new Contract(p.tokenAddress, ERC20_ABI, signer);
          const tx = await token.transfer(p.recipient, BigInt(p.amountAtomic));
          return { txId: tx.hash };
        }

        const tx = await signer.sendTransaction({
          to: p.recipient,
          value: BigInt(p.amountAtomic), // wei
        });

        return { txId: tx.hash };
      }

      // -------- SOLANA (native SOL transfer) --------
      if (p.chain === "SOL") {
        if (!solAccount?.isConnected || !solAccount?.address) {
          throw new Error("Solana wallet not connected");
        }
        if (!connection) throw new Error("Solana connection missing");
        if (!solWalletProvider)
          throw new Error("Solana walletProvider missing");

        const from = new PublicKey(solAccount.address);
        const to = new PublicKey(p.recipient);

        const { blockhash } = await connection.getLatestBlockhash();

        const lamportsBig = BigInt(p.amountAtomic);
        if (lamportsBig > BigInt(Number.MAX_SAFE_INTEGER)) {
          throw new Error("Lamports amount too large for JS number");
        }

        const tx = new Transaction({
          feePayer: from,
          recentBlockhash: blockhash,
        }).add(
          SystemProgram.transfer({
            fromPubkey: from,
            toPubkey: to,
            lamports: Number(lamportsBig),
          })
        );

        // Triggers Solana wallet UI to sign+send
        const signature = await solWalletProvider.sendTransaction(
          tx,
          connection
        );
        return { txId: signature };
      }

      // -------- BITCOIN (send sats) --------
      if (p.chain === "BTC") {
        if (!btcAccount?.isConnected)
          throw new Error("Bitcoin wallet not connected");
        if (!btcWalletProvider?.sendTransfer) {
          throw new Error("Bitcoin walletProvider missing sendTransfer()");
        }

        // Triggers BTC wallet UI
        const txid = await btcWalletProvider.sendTransfer({
          recipient: p.recipient,
          amount: String(p.amountAtomic), // satoshis
        });

        return { txId: String(txid) };
      }

      // -------- TON --------
      // AppKit React hooks currently expose eip155/solana/bip122 providers.
      if (p.chain === "TON") {
        throw new Error(
          "TON sending not wired here yet (use TonConnect / your TON provider)"
        );
      }

      throw new Error(`Unsupported chain: ${p.chain}`);
    },
    [
      evmAccount?.isConnected,
      solAccount?.isConnected,
      solAccount?.address,
      btcAccount?.isConnected,
      evmWalletProvider,
      solWalletProvider,
      btcWalletProvider,
      connection,
    ]
  );

  return { sendCollateral };
}
