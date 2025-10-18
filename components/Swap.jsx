"use client";

import { useAccount } from "wagmi"; 
import { SwapWidget } from "@relayprotocol/relay-kit-ui";
import { openConnectModal } from "../providers/AppProviders";

export default function SwapColumn({ onSellTokenChange }) {

  const onConnectWallet = () => {
    openConnectModal(); 
  };

  //multi wallets
  const { address } = useAccount();
  const linkedWallets = address ? [{ vm: "evm", address }] : [];

  return (
    <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
      {/* SwapWidget multichain: without chain lock or fixed tokens */}
      <SwapWidget
        supportedWalletVMs={["evm"]}
        onConnectWallet={onConnectWallet}
        onError={(err) => console.warn("SwapWidget error:", err)}
        multiWalletSupportEnabled
        linkedWallets={linkedWallets}
        onSetPrimaryWallet={() => {}}      
        onLinkNewWallet={onConnectWallet}
        onFromTokenChange={(t) => onSellTokenChange?.(t)} //listening if SELL makes a change    
        //disablePasteWalletAddressOption={false} 
      />
    </div>
  );
}
