"use client";

import { getDecisions } from "@/lib/api";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

export default function DecisionsList() {
  const { data: decisions = [], isLoading } = useQuery({
    queryKey: ['decisions'],
    queryFn: async () => getDecisions(),
    throwOnError: true,
  });

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Decision Explorer</h1>
      <p className="text-gray-500 mb-8">Browse all historical engineering decisions made by the team.</p>

      <div className="flex flex-col gap-4">
        {decisions.length === 0 && (
          <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-300">
            <h3 className="text-xl font-medium text-gray-700 mb-2">No decisions captured yet.</h3>
            <p className="text-gray-500">Merge a PR with a Jira reference to create your first memory.</p>
          </div>
        )}

        {decisions.map((decision) => (
          <Link href={`/decisions/${decision.id}`} key={decision.id}>
            <Card className="hover:border-black transition-colors cursor-pointer">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl hover:underline text-blue-600">
                      {decision.title}
                    </CardTitle>
                    <p className="text-sm text-gray-500 mt-1">
                      Made by <span className="font-semibold text-black">{decision.author}</span> on {decision.date}
                    </p>
                  </div>
                  <Badge variant="outline">{decision.decision_type}</Badge>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}