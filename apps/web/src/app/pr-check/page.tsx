'use client';

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from 'next/link';
import { getPrCheck } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { use, useEffect, useState } from "react";
import { HeartbeatLoader } from "@/components/ui/heartbeat-loader";

export default function PRCheckPage({ searchParams }: { searchParams: Promise<{ pr?: string }> }) {
  // We need to unwrap the Promise for searchParams in Next.js 15+ 
  // However, since we are in a client component, React.use() works well.
  const resolvedParams = use(searchParams);
  const pr = resolvedParams.pr;

  const { data: check, isLoading } = useQuery({
    queryKey: ['pr-check', pr],
    queryFn: () => getPrCheck(pr as string),
    enabled: !!pr,
    refetchInterval: 10000,
  });

  if (!pr) {
    return (
      <main className="p-8 max-w-2xl mx-auto min-h-[80vh] flex flex-col justify-center items-center text-center">
        <h1 className="text-3xl font-bold mb-4">PR Verification Status</h1>
        <p className="text-gray-500">Provide a ?pr= parameter to view results.</p>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="p-8 mx-36 min-h-[80vh] flex flex-col justify-center items-center text-center">
        <HeartbeatLoader />
        <p className="text-white/40 font-mono tracking-widest text-sm uppercase animate-pulse mt-6">Verifying PR architecture...</p>
      </main>
    );
  }

  if (!check) {
    return (
      <main className="p-8 max-w-2xl mx-auto min-h-[80vh] flex flex-col justify-center items-center text-center">
        <h1 className="text-3xl font-bold mb-4">PR Check Not Found</h1>
        <p className="text-gray-500">Could not find a PR check for PR #{pr}.</p>
      </main>
    );
  }

  const isBlocked = check.status === 'blocked';

  return (
    <main className="p-8 max-w-3xl mx-auto min-h-[80vh] flex flex-col justify-center items-center">
      <div className="w-full text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Lore PR Check</h1>
        <p className="text-gray-500 text-lg">Architectural integrity verification for PR #{pr}</p>
      </div>

      <Card className={`w-full overflow-hidden border-2 shadow-lg ${isBlocked ? 'border-red-400' : 'border-green-400'}`}>
        <div className={`px-6 py-4 flex items-center justify-between border-b ${isBlocked ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
          <div className="flex items-center gap-3">
            {isBlocked ? (
              <div className="w-10 h-10 bg-red-100 text-red-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              </div>
            ) : (
              <div className="w-10 h-10 bg-green-100 text-green-600 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
              </div>
            )}
            <div>
              <h2 className={`text-xl font-bold ${isBlocked ? 'text-red-800' : 'text-green-800'}`}>
                {isBlocked ? 'Architectural Conflict Detected' : 'All Checks Passed'}
              </h2>
              <p className={isBlocked ? 'text-red-600/80' : 'text-green-600/80'}>
                {isBlocked ? 'This PR violates an existing architectural decision.' : 'No architectural conflicts found.'}
              </p>
            </div>
          </div>
          <Badge variant="outline" className={`font-mono text-lg ${isBlocked ? 'border-red-300 text-red-700 bg-white' : 'border-green-300 text-green-700 bg-white'}`}>
            {isBlocked ? 'BLOCKED' : 'PASSED'}
          </Badge>
        </div>

        {isBlocked && (
          <CardContent className="p-8">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Original Decision Context</h3>
            
            <div className="bg-gray-50 border border-gray-200 p-6 relative">
              <div className="absolute -top-3 left-6 bg-white px-2 text-sm text-gray-500 font-medium">Historical Record</div>
              
              <p className="text-gray-800 text-lg leading-relaxed mb-6 font-medium">
                "{check.reason}"
              </p>
              
              {check.conflict_path && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 text-sm text-red-800 font-mono">
                  <div className="font-semibold mb-2">Conflict Path:</div>
                  {check.conflict_path}
                </div>
              )}

              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Decided by:</span>
                  <Badge variant="secondary" className="bg-gray-200 hover:bg-gray-200 text-gray-800 border-none shadow-sm">{check.author}</Badge>
                </div>
                <div className="w-1 h-1 bg-gray-300"></div>
                {check.original_decision_id !== "none" ? (
                  <Link href={`/decisions/${check.original_decision_id}`} className="text-blue-600 hover:underline">
                    View Full Decision
                  </Link>
                ) : (
                  <span className="text-gray-400">No original decision linked</span>
                )}
              </div>
            </div>

            <div className="mt-8 p-4 bg-amber-50 border border-amber-200 flex items-start gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600 mt-0.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <div>
                <p className="text-amber-800 font-medium">Action Required</p>
                <p className="text-amber-700/90 text-sm mt-1">To proceed with this PR, you must get sign-off from <b>{check.author}</b> or submit a superseding Architecture Decision Record (ADR).</p>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      
      <div className="mt-8">
        <Link href="/dashboard" className="text-gray-500 hover:text-black hover:underline transition-colors">
          &larr; Back to Dashboard
        </Link>
      </div>
    </main>
  );
}
