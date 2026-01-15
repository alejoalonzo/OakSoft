"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const AppKitButton = dynamic(
  () => import("@reown/appkit/react").then((m) => m.AppKitButton),
  { ssr: false }
);

export default function ConnectWalletButton() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return <AppKitButton />;
}
