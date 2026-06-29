'use client'; // Error components must be Client Components
 
import { useEffect } from 'react';
import { AlertCircle, ServerCrash } from 'lucide-react';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);
 
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="flex max-w-md flex-col items-center justify-center space-y-6 rounded-2xl border border-red-900/50 bg-red-950/20 p-8 text-center backdrop-blur-sm">
        <div className="rounded-full bg-red-900/50 p-4">
          <ServerCrash className="h-12 w-12 text-red-500" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight text-red-500">Backend Offline</h2>
          <p className="text-sm text-zinc-400">
            We couldn't connect to the FastAPI backend. Make sure Person A has started the server on port 8000!
          </p>
        </div>

        <div className="rounded-lg bg-black/50 p-4 w-full text-left font-mono text-xs text-red-400 overflow-x-auto border border-red-900/30">
            {error.message || "Failed to fetch from API"}
        </div>
 
        <button
          onClick={() => reset()}
          className="w-full rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
