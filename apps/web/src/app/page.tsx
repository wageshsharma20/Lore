import Link from "next/link";
import { getSummary, getDecisions } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SyncButton } from "@/components/SyncButton"; // 👈 We imported your new button!

function MemoryModeToggle() {
  return (
    <div className="flex items-center bg-gray-100 p-1 rounded-lg border border-gray-200 text-sm font-medium">
      <div className="px-3 py-1.5 bg-white rounded-md shadow-sm text-black flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
        Cloud
      </div>
      <div className="px-3 py-1.5 text-gray-500 cursor-not-allowed">
        On-Premise
      </div>
    </div>
  );
}

function OnboardingChecklist() {
  return (
    <div className="mb-12 bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
      <h2 className="text-2xl font-bold mb-6">Welcome to Lore! Let's get you set up.</h2>
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-green-500"></div>
          <p className="text-lg text-gray-700"><span className="font-semibold">Step 1:</span> Start the Lore backend <span className="text-sm text-gray-400 ml-2">(Done!)</span></p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
          <p className="text-lg text-gray-700"><span className="font-semibold">Step 2:</span> Connect GitHub App</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
          <p className="text-lg text-gray-700"><span className="font-semibold">Step 3:</span> Connect Slack Bot</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 rounded-full bg-gray-300"></div>
          <p className="text-lg text-gray-700"><span className="font-semibold">Step 4:</span> Merge your first PR with a Jira ticket!</p>
        </div>
      </div>
    </div>
  );
}

export default async function Dashboard() {
  const summary = await getSummary();
  const decisions = await getDecisions();
  return (
    <main className="p-8 max-w-5xl mx-auto">
      {/* 👈 We put the Title and the Button side-by-side using Flexbox */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Lore: Engineering Historian</h1>
        <div className="flex items-center gap-4">
          <MemoryModeToggle />
          <SyncButton />
        </div>
      </div>

      {decisions.length === 0 && <OnboardingChecklist />}
      
      {/* Summary Cards */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-gray-500">Total Decisions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{summary.total_decisions}</p></CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-red-600">Knowledge Silos (At Risk!)</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-red-600">{summary.red_silos}</p></CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-600">Stale Decisions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-yellow-600">{summary.yellow_warnings}</p></CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-green-600">Healthy Modules</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold text-green-600">{summary.green_healthy}</p></CardContent>
        </Card>
      </section>

      {/* Recent Decisions */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Recent Decisions</h2>
        <div className="flex flex-col gap-4">
          {decisions.map((decision) => (
            <Link href={`/decisions/${decision.id}`} key={decision.id}>
              <Card className="hover:border-black transition-colors cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl hover:underline text-blue-600">{decision.title}</CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Made by <span className="font-semibold text-black">{decision.author}</span> on {decision.date}
                      </p>
                    </div>
                    <Badge variant="secondary">{decision.decision_type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4">
                    <h3 className="font-semibold text-sm text-gray-700">What was decided:</h3>
                    <p>{decision.what}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-gray-700">Why (The Reason):</h3>
                    <p className="italic text-gray-600">"{decision.reason}"</p>
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