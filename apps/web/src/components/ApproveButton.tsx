'use client';

import { useState } from 'react';
import { approveAndCommitAdr } from '@/actions/adr';

export function ApproveButton({ draftId }: { draftId: string }) {
  const [loading, setLoading] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);

  const handleApprove = async () => {
    setLoading(true);
    try {
      // The draftId in Redis is "adr_draft_XYZ", but the helper expects the raw ID without the prefix, or maybe with it?
      // Wait, in adr.ts, the ID passed to getAdrDraft is used like `adr:draft:${draftId}`.
      // And in generateAdrDraft, draftId is set to `adr_draft_${decisionId}`.
      // So draftId here is exactly `adr_draft_${decisionId}`.
      const url = await approveAndCommitAdr(draftId);
      setPrUrl(url);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (prUrl) {
    return (
      <a 
        href={prUrl} 
        target="_blank" 
        rel="noreferrer"
        className="bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-500 transition-colors shadow-sm text-sm"
      >
        View Pull Request
      </a>
    );
  }

  return (
    <button 
      onClick={handleApprove}
      disabled={loading}
      className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm disabled:opacity-50"
    >
      {loading ? "Generating PR..." : "Approve & Finalize"}
    </button>
  );
}
