"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Sign in successful!");
        localStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setMessage(data.error || "Sign in failed");
      }
    } catch (error) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <main className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-serif text-gray-900 mb-2">Sign In</h1>
          <p className="text-gray-500 font-serif text-sm">Welcome back</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-6 py-4 border-2 border-gray-400 rounded-2xl focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none transition-all duration-200 font-semibold"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-6 py-4 border-2 border-gray-400 rounded-2xl focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none transition-all duration-200 font-semibold"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="border-2 border-gray-600 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium py-2 px-4 rounded transition duration-200 ml-auto block"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes("successful") ? "text-green-600" : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/auth/register"
            className="text-gray-600 font-serif hover:text-gray-900 underline text-sm transition-colors duration-200"
          >
            Don't have an account? Register
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-gray-400 font-serif hover:text-gray-600 underline text-xs transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
