"use client";

import { useAuth } from "@/providers/AuthProvider";

export default function UserDisplay() {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  // Extract username from email (part before @)
  const displayName = user.email?.split("@")[0] || "User";

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-primary-500/30 rounded-lg">
      <div className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></div>
      <span className="text-white text-sm font-medium">
        {displayName}
      </span>
    </div>
  );
}
