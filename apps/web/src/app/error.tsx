'use client';

import { useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";

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
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <Card className="max-w-md w-full border-red-200 bg-red-50 shadow-md">
        <CardContent className="pt-6 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
          </div>
          <h2 className="text-xl font-bold text-red-900 mb-2">Something went wrong!</h2>
          <p className="text-red-700/90 mb-6 text-sm">
            {error.message || "Failed to load data from the Lore backend. Is the Python server running?"}
          </p>
          <button
            onClick={() => reset()}
            className="bg-red-600 text-white px-4 py-2 font-medium hover:bg-red-700 transition-colors shadow-sm"
          >
            Try again
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
