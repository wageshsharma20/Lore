"use client";

import { useQuery } from "@tanstack/react-query";
import { getMockHeatmapData } from '@/lib/riskEngine';
import { HeatmapTreemap } from '@/components/HeatmapTreemap';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HeartbeatLoader } from "@/components/ui/heartbeat-loader";

export default function HeatmapPage() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['heatmapData'],
    queryFn: async () => getMockHeatmapData(),
  });

  const totalModules = data.length;
  const criticalSilos = data.filter(d => d.loneContributor).length;
  const avgRisk = totalModules > 0 ? Math.round(data.reduce((acc, d) => acc + d.overallRisk, 0) / totalModules) : 0;

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-[80vh] flex flex-col justify-start">
      <div className="w-full mb-8">
        <h1 className="text-4xl font-['Arial'] font-bold mb-4 text-white">Risk Heatmap</h1>
        <p className="text-gray-500 text-lg">
          Visualizing codebase risk based on 6 architectural factors and knowledge silos.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-6">
          <HeartbeatLoader />
          <p className="text-white/40 font-mono tracking-widest text-sm uppercase animate-pulse">Calculating Codebase Risk Metrics...</p>
        </div>
      ) : totalModules === 0 ? (
        <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-300 w-full">
          <div className="w-16 h-16 bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Knowledge Data Available</h2>
          <p className="text-gray-500 text-lg">Connect your GitHub repo to start tracking knowledge distribution.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Monitored Modules</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{totalModules}</div>
          </CardContent>
        </Card>
        <Card className={criticalSilos > 0 ? "border-red-200 bg-red-50" : ""}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600 flex items-center gap-2">
              Critical Silos 🚨
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-700">{criticalSilos}</div>
            <p className="text-xs text-red-600 mt-1">Modules with a lone contributor</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Average Risk Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">{avgRisk}%</div>
          </CardContent>
        </Card>
      </div>

      <Card className="w-full mb-12 shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="bg-gray-50 border-b">
          <CardTitle>Knowledge Distribution Treemap</CardTitle>
          <p className="text-sm text-gray-500">
            Box size = Module size. Color = Risk Score. Solid red boxes indicate a Knowledge Silo.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          <HeatmapTreemap data={data} />
        </CardContent>
      </Card>

      <div className="w-full">
        <h2 className="text-2xl font-bold mb-4">Module Breakdown</h2>
        <div className="border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm bg-white">
            <thead className="bg-gray-100 text-gray-600 border-b">
              <tr>
                <th className="p-4 font-semibold">Module Name</th>
                <th className="p-4 font-semibold">Risk Score</th>
                <th className="p-4 font-semibold">Silo Status</th>
                <th className="p-4 font-semibold">Code Churn</th>
                <th className="p-4 font-semibold">Complexity</th>
                <th className="p-4 font-semibold">Test Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map(mod => (
                <tr key={mod.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 font-medium text-gray-900">{mod.name}</td>
                  <td className="p-4">
                    <span className={`font-bold ${mod.overallRisk >= 80 ? 'text-red-600' : mod.overallRisk >= 50 ? 'text-orange-600' : 'text-green-600'}`}>
                      {mod.overallRisk}%
                    </span>
                  </td>
                  <td className="p-4">
                    {mod.loneContributor ? (
                      <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 shadow-none border-red-200">
                        Yes ({mod.loneContributor})
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 shadow-none border-green-200">
                        Healthy
                      </Badge>
                    )}
                  </td>
                  <td className="p-4">{mod.factors.codeChurn}%</td>
                  <td className="p-4">{mod.factors.complexity}%</td>
                  <td className="p-4">{mod.factors.testCoverage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </main>
  );
}
