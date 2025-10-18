// components/Swap.jsx
"use client";

import { useAccount } from "wagmi"; 
import { SwapWidget } from "@relayprotocol/relay-kit-ui";
import { openConnectModal } from "../providers/AppProviders";

export default function SwapColumn({ onSellTokenChange, onBuyTokenChange }) {

  const onConnectWallet = () => {
    try {
      openConnectModal(); 
    } catch (error) {
      console.error("Error opening connect modal:", error);
    }
  };

  //multi wallets
  const { address } = useAccount();
  const linkedWallets = address ? [{ vm: "evm", address }] : [];

  const handleSwapError = (error) => {
    console.warn("SwapWidget error:", error);
    
    // Check for common 400 errors
    if (error?.response?.status === 400) {
      console.error("❌ 400 Bad Request Error:");
      console.error("- Request:", error?.config?.url);
      console.error("- Data:", error?.config?.data);
      console.error("- Message:", error?.message);
      
      // Common causes of 400 errors in DeFi
      if (error?.config?.url?.includes('relay')) {
        console.error("🔧 This might be a RelayKit configuration issue:");
        console.error("1. Check if WalletConnect Project ID is properly set");
        console.error("2. Ensure proper chain configuration");
        console.error("3. Verify wallet connection status");
      }
    }
  };

  return (
    <div className="w-fit bg-gray-800 rounded-xl border border-white/10 p-4 space-y-3">
      {/* SwapWidget multichain: without chain lock or fixed tokens */}
      <SwapWidget
        supportedWalletVMs={["evm"]}
        onConnectWallet={onConnectWallet}
        onError={handleSwapError}
        multiWalletSupportEnabled
        linkedWallets={linkedWallets}
        onSetPrimaryWallet={() => {}}      
        onLinkNewWallet={onConnectWallet}
        onFromTokenChange={(t) => onSellTokenChange?.(t)} //listening if SELL makes a change    
        onToTokenChange={(t) => onBuyTokenChange?.(t)} //listening if BUY makes a change
        //disablePasteWalletAddressOption={false} 
      />
    </div>
  );
}
