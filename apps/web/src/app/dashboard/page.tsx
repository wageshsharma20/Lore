"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getSummary, getDecisions } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncButton } from "@/components/SyncButton"; 
import { HeartbeatLoader } from "@/components/ui/heartbeat-loader";

function MemoryModeToggle() {
  return (
    <div className="flex items-center bg-white/5 backdrop-blur-md p-1 border border-white/10 text-sm font-medium shadow-xl">
      <div className="px-3 py-1.5 bg-primary/20 text-primary-foreground flex items-center gap-2 border border-primary/30 shadow-[0_0_15px_rgba(168,85,247,0.4)]">
        <div className="w-2 h-2 bg-primary animate-pulse"></div>
        Cloud
      </div>
      <div className="px-3 py-1.5 text-muted-foreground cursor-not-allowed hover:text-white transition-colors">
        On-Premise
      </div>
    </div>
  );
}

function OnboardingChecklist() {
  return (
    <div className="mb-12 bg-white/5 backdrop-blur-xl border border-white/10 p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 blur-3xl"></div>
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Welcome to Lore! Let's get you set up.</h2>
      <div className="space-y-4 relative z-10">
        <div className="flex items-center gap-4 group">
          <div className="w-4 h-4 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
          <p className="text-lg text-gray-200 group-hover:text-white transition-colors"><span className="font-semibold">Step 1:</span> Start the Lore backend <span className="text-sm text-emerald-400 ml-2">(Done!)</span></p>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-4 h-4 bg-white/20"></div>
          <p className="text-lg text-gray-400 group-hover:text-gray-200 transition-colors"><span className="font-semibold">Step 2:</span> Connect GitHub App</p>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-4 h-4 bg-white/20"></div>
          <p className="text-lg text-gray-400 group-hover:text-gray-200 transition-colors"><span className="font-semibold">Step 3:</span> Connect Slack Bot</p>
        </div>
        <div className="flex items-center gap-4 group">
          <div className="w-4 h-4 bg-white/20"></div>
          <p className="text-lg text-gray-400 group-hover:text-gray-200 transition-colors"><span className="font-semibold">Step 4:</span> Merge your first PR with a Jira ticket!</p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: summary, isLoading: loadingSummary, isError: errorSummary } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    refetchInterval: 10000,
  });

  const { data: decisions, isLoading: loadingDecisions, isError: errorDecisions } = useQuery({
    queryKey: ['decisions'],
    queryFn: getDecisions,
    refetchInterval: 10000,
  });

  if (loadingSummary || loadingDecisions) {
    return (
      <main className="p-8 mx-36 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <HeartbeatLoader />
          <p className="text-muted-foreground animate-pulse font-mono tracking-widest text-sm uppercase">Loading backend data...</p>
        </div>
      </main>
    );
  }

  if (errorSummary || errorDecisions || !summary || !decisions) {
    return (
      <main className="p-8 mx-36 min-h-screen flex items-center justify-center">
        <div className="p-6 bg-destructive/10 border border-destructive/20 text-center max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Backend Connection Error</h2>
          <p className="text-sm text-destructive/80 mb-4">
            Could not connect to the FastAPI backend. This explicitly demonstrates React Query's error boundary protecting the UI from a silent crash!
          </p>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-destructive text-destructive-foreground text-sm hover:bg-destructive/90 transition-colors">
            Retry Connection
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="p-8 mx-36 min-h-screen relative">
      {/* Background Mesh Gradient */}
      <div className="fixed inset-0 z-[-1] bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
      
      {/* 👈 We put the Title and the Button side-by-side using Flexbox */}
      <div className="flex justify-between items-center mb-12 mt-8">
        <h1 className="text-5xl font-['Arial'] font-bold tracking-tight text-white">Lore: Engineering Historian</h1>
        <div className="flex items-center gap-4">
          <MemoryModeToggle />
          <SyncButton />
        </div>
      </div>

      {decisions.length === 0 && <OnboardingChecklist />}
      
      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <Card className="bg-white/5 backdrop-blur-md border-white/10 hover:bg-white/10 transition-colors shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-gray-400 uppercase tracking-wider">Total Decisions</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black text-white">{summary.total_decisions}</p></CardContent>
        </Card>
        <Card className="bg-destructive/10 backdrop-blur-md border-destructive/30 hover:bg-destructive/20 transition-colors shadow-[0_0_15px_rgba(220,38,38,0.15)]">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-destructive-foreground uppercase tracking-wider">Knowledge Silos (At Risk!)</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black text-destructive-foreground drop-shadow-md">{summary.red_silos}</p></CardContent>
        </Card>
        <Card className="bg-amber-500/10 backdrop-blur-md border-amber-500/30 hover:bg-amber-500/20 transition-colors shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-amber-500 uppercase tracking-wider">Stale Decisions</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black text-amber-500 drop-shadow-md">{summary.yellow_warnings}</p></CardContent>
        </Card>
        <Card className="bg-emerald-500/10 backdrop-blur-md border-emerald-500/30 hover:bg-emerald-500/20 transition-colors shadow-lg">
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-emerald-500 uppercase tracking-wider">Healthy Modules</CardTitle></CardHeader>
          <CardContent><p className="text-4xl font-black text-emerald-500 drop-shadow-md">{summary.green_healthy}</p></CardContent>
        </Card>
      </section>

      {/* Recent Decisions */}
      <section>
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <span className="w-2 h-8 bg-primary"></span>
          Recent Decisions
        </h2>
        <div className="flex flex-col gap-4">
          {decisions.map((decision) => (
            <Link href={`/decisions/${decision.id}`} key={decision.id}>
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 hover:border-primary/50 hover:bg-white/10 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl hover:shadow-primary/5 cursor-pointer group">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">{decision.title}</CardTitle>
                      <p className="text-sm text-gray-400 mt-2">
                        Made by <span className="font-medium text-gray-200 bg-white/10 px-2 py-0.5 mx-1">{decision.author}</span> on {decision.date}
                      </p>
                    </div>
                    <Badge variant="secondary" className="bg-primary/20 text-primary-foreground border-primary/30 group-hover:bg-primary group-hover:text-white transition-colors">{decision.decision_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-1">What was decided</h3>
                    <p className="text-gray-200 leading-relaxed">{decision.what}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-400 uppercase tracking-wider mb-1">The Reason</h3>
                    <p className="italic text-gray-400 border-l-2 border-white/20 pl-4 py-1 leading-relaxed">"{decision.reason}"</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}