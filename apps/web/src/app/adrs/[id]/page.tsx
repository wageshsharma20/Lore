import { getAdr } from "@/lib/api";
import { getAdrDraft } from "@/actions/adr";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ApproveButton } from "@/components/ApproveButton";

export default async function AdrDetailPage({ params }: { params: { id: string } }) {
  let adr: any = null;
  
  if (params.id.startsWith("adr_draft_")) {
    adr = await getAdrDraft(params.id);
  } else {
    adr = await getAdr(params.id);
  }

  if (!adr) {
    return (
      <main className="p-8 max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">ADR not found</h1>
        <Link href="/adrs" className="text-blue-600 hover:underline">
          &larr; Back to all ADRs
        </Link>
      </main>
    );
  }

  return (
    <main className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link href="/adrs" className="text-blue-600 hover:underline text-sm">
          &larr; Back to all ADRs
        </Link>
      </div>

      <div className="flex justify-between items-start mb-8 border-b pb-8">
        <div>
          <h1 className="text-4xl font-bold mb-4">{adr.title}</h1>
          <p className="text-gray-500">
            Auto-drafted by Lore (triggered by <span className="font-semibold text-black">{adr.author}</span>) on {adr.date}
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <Badge variant={adr.status === "Approved" ? "default" : "secondary"} className="text-sm px-3 py-1">
            {adr.status}
          </Badge>
          {adr.status === "Draft" && (
            <ApproveButton draftId={params.id} />
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 flex gap-4 rounded-t-lg">
          <button className="text-black font-semibold border-b-2 border-black pb-1">Markdown Editor</button>
          <button className="text-gray-400 hover:text-gray-600">Preview</button>
        </div>
        <textarea 
          className="w-full h-96 p-6 outline-none text-gray-800 font-mono text-sm leading-relaxed rounded-b-lg resize-y bg-gray-50/30 focus:bg-white transition-colors"
          defaultValue={adr.content}
        />
      </div>
    </main>
  );
}
