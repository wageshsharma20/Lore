export default function HeatmapPage() {
  return (
    <main className="p-8 max-w-4xl mx-auto min-h-[80vh] flex flex-col justify-center items-center">
      <div className="p-12 text-center bg-gray-50 border border-dashed border-gray-300 rounded-lg w-full max-w-2xl">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">No Knowledge Data Available</h2>
        <p className="text-gray-500 text-lg">Connect your GitHub repo to start tracking knowledge distribution.</p>
      </div>
    </main>
  );
}
