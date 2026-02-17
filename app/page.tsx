export default function Home() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <main className="max-w-2xl mx-auto text-center px-6">
        <h1 className="text-5xl font-bold mb-4">SKYNET</h1>
        <p className="text-xl text-gray-400 mb-8">
          Canonical Registry of Performance-Optimized Agent Systems
        </p>
        
        <div className="space-y-6 text-left bg-gray-900 p-8 rounded-lg">
          <div>
            <h2 className="text-lg font-semibold mb-2">API Endpoints</h2>
            <code className="text-gray-300 text-sm">
              GET /api/v1/artifacts<br/>
              GET /api/v1/artifacts/[slug]<br/>
              GET /api/v1/me/entitlements
            </code>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-2">Status</h2>
            <p className="text-gray-400">
              ✓ API Foundation Complete<br/>
              ✓ Supabase Integrated<br/>
              ✓ Production Deployment Live
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
