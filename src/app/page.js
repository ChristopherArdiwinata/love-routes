import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="text-center">
        <h1 className="text-4xl font-bold mb-8">Love Routes</h1>
        <p className="text-lg text-gray-600 mb-8">Thisis skeleteon app part</p>
        
        <div className="flex gap-4 justify-center">
          <Link 
            href="/auth/sign-in"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
          <Link 
            href="/auth/register"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
