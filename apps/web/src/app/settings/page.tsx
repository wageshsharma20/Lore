export default function SettingsPage() {
  const integrations = [
    {
      name: "GitHub",
      description: "Connect to auto-extract context from Pull Requests and Issues.",
      connected: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
      )
    },
    {
      name: "Slack",
      description: "Connect the @Lore bot to answer architecture questions in channel.",
      connected: true,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
      )
    },
    {
      name: "Jira",
      description: "Map architecture decisions directly to project tickets.",
      connected: false,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      )
    }
  ];

  return (
    <main className="p-8 mx-36 min-h-[80vh]">
      <div className="mb-10 border-b border-white/10 pb-8">
        <h1 className="text-3xl font-['Arial'] font-bold mb-2 text-white">Settings</h1>
        <p className="text-white/40">Manage your workspace integrations and preferences.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold mb-6 text-white">Integrations</h2>
        
        <div className="space-y-4">
          {integrations.map((integration) => (
            <div key={integration.name} className="flex items-center justify-between p-6 bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/5 border border-white/10 text-white/60">
                  {integration.icon}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{integration.name}</h3>
                  <p className="text-white/40 text-sm mt-1">{integration.description}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                {integration.connected ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 bg-emerald-500"></span>
                    Connected
                  </span>
                ) : (
                  <span className="text-sm font-medium text-white/30">Not connected</span>
                )}
                
                <button 
                  className={`px-4 py-2 font-medium text-sm transition-colors ${
                    integration.connected 
                      ? 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white' 
                      : 'bg-[#0052ff] text-white hover:bg-[#0052ff]/80'
                  }`}
                >
                  {integration.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
