// components/WalletBadge.jsx
"use client";

import { useAppKitAccount } from "@reown/appkit/react";

function formatAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function WalletBadge() {
  const { address, isConnected } = useAppKitAccount({ namespace: "eip155" });

  if (!isConnected || !address) return null;

  return (
    <span className="px-2 py-1 rounded-full bg-gray-800 text-gray-100 border border-white/10 text-xs">
      {formatAddress(address)}
    </span>
  );
}
