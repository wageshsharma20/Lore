"use client";

import { useState } from "react";
import { triggerGitHubSync } from "@/lib/api";

export function SyncButton() {
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      await triggerGitHubSync();
      alert("✅ Sync triggered! Person A's AI pipeline is analyzing GitHub PRs...");
    } catch (error) {
      alert("⚠️ Backend not running! (But in production, this would trigger the AI pipeline)");
    }
    setLoading(false);
  }

  return (
    <button 
      onClick={handleSync}
      disabled={loading}
      className="bg-black text-white px-5 py-2 font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors shadow-sm"
    >
      {loading ? "Syncing..." : "Sync with GitHub"}
    </button>
  );
}