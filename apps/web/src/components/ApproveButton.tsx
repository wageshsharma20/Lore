'use client';

import { useState } from 'react';
import { approveAndCommitAdr, rejectAdrDraft } from '@/actions/adr';
import { useRouter } from 'next/navigation';

export function ApproveButton({ draftId }: { draftId: string }) {
  const [loading, setLoading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const router = useRouter();

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

  const handleReject = async () => {
    if (!confirm('Are you sure you want to reject and delete this ADR draft?')) return;
    setRejecting(true);
    try {
      await rejectAdrDraft(draftId);
      router.push('/adrs');
    } catch (e: any) {
      alert(e.message);
      setRejecting(false);
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
    <div className="flex gap-2">
      <button 
        onClick={handleReject}
        disabled={loading || rejecting}
        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-50 transition-colors shadow-sm text-sm disabled:opacity-50"
      >
        {rejecting ? "Rejecting..." : "Reject"}
      </button>
      <button 
        onClick={handleApprove}
        disabled={loading || rejecting}
        className="bg-black text-white px-4 py-2 rounded-md font-medium hover:bg-gray-800 transition-colors shadow-sm text-sm disabled:opacity-50"
      >
        {loading ? "Generating PR..." : "Approve & Finalize"}
      </button>
    </div>
  );
}
