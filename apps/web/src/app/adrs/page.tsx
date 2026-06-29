import Link from "next/link";
import { getAdrs } from "@/lib/api";
import { getAdrDrafts } from "@/actions/adr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdrsPage() {
  let adrs: any[] = [];
  try {
    adrs = await getAdrs();
  } catch (e) {
    // If backend is offline, just show drafts
  }
  const drafts = await getAdrDrafts() as any[];
  
  // Merge drafts with approved ADRs
  const allAdrs = [...drafts, ...adrs];

  return (
    <main className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-start items-center">
      <div className="w-full mb-12">
        <h1 className="text-4xl font-bold mb-4">Architecture Decision Records</h1>
        <p className="text-gray-500 text-lg">Automatically generated and maintained by Lore.</p>
      </div>

      {allAdrs.length === 0 ? (
        <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg w-full">
          <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="12" x2="12" y1="18" y2="12"/><line x1="9" x2="15" y1="15" y2="15"/></svg>
          </div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">No ADRs Drafted Yet</h2>
          <p className="text-gray-500 text-lg leading-relaxed">Lore will auto-draft an ADR the next time a significant decision is merged.</p>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-4">
          {allAdrs.map((adr) => (
            <Link href={`/adrs/${adr.id}`} key={adr.id}>
              <Card className="hover:border-black transition-colors cursor-pointer w-full">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl hover:underline text-blue-600">
                        {adr.title}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        Auto-drafted by Lore (triggered by <span className="font-semibold text-black">{adr.author}</span>) on {adr.date}
                      </p>
                    </div>
                    <Badge variant={adr.status === "Approved" ? "default" : "secondary"}>
                      {adr.status}
                    </Badge>
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
