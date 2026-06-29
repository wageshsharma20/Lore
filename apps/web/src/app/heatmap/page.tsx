import { getMockHeatmapData } from '@/lib/riskEngine';
import { HeatmapTreemap } from '@/components/HeatmapTreemap';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function HeatmapPage() {
  const data = getMockHeatmapData();

  const totalModules = data.length;
  const criticalSilos = data.filter(d => d.loneContributor).length;
  const avgRisk = Math.round(data.reduce((acc, d) => acc + d.overallRisk, 0) / totalModules);

  return (
    <main className="p-8 max-w-6xl mx-auto min-h-[80vh] flex flex-col justify-start">
      <div className="w-full mb-8">
        <h1 className="text-4xl font-bold mb-4">Risk Heatmap</h1>
        <p className="text-gray-500 text-lg">
          Visualizing codebase risk based on 6 architectural factors and knowledge silos.
        </p>
      </div>

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
        <div className="border rounded-lg overflow-hidden shadow-sm">
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
    </main>
  );
}
