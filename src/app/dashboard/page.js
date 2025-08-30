import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="min-h-screen p-8">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <Link 
          href="/"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          Sign Out
        </Link>
      </header>
      
      <main className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4">Welcome to Love Routes!</h2>
          <p className="text-gray-600 mb-6">You're successfully signed in to your dashboard hehe.</p>
          
          <div className="flex gap-4">
            <Link 
              href="/maps"
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Explore Maps
            </Link>
            <Link 
              href="/settings"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Settings
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}