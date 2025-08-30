import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <main className="text-center">
        <p className="text-lg font-serif text-gray-600 mb-8">
          Welcome to Love Routes!
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/sign-in"
            className="border-2 border-gray-600 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium py-2 px-4 rounded transition duration-200 ml-auto block"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="border-2 border-gray-600 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium py-2 px-4 rounded transition duration-200 ml-auto block"
          >
            Register
          </Link>
        </div>
      </main>
    </div>
  );
}
