"use client";
import Link from "next/link";
import { useState } from "react";
//hello
export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Registration successful!");
        setEmail("");
        setPassword("");
      } else {
        setMessage(data.error || "Registration failed");
      }
    } catch (error) {
      setMessage("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <main className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-3xl font text-gray-900 mb-2">Create Account</h1>
          <p className="text-gray-500 text-sm">Join us to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              //className="w-full px-0 py-4 text-gray-900 placeholder-gray-400 border-0 border-b border-gray-200 bg-transparent focus:border-gray-900 focus:outline-none transition-colors duration-200"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              //className="w-full px-0 py-4 text-gray-900 placeholder-gray-400 border-0 border-b border-gray-200 bg-transparent focus:border-gray-900 focus:outline-none transition-colors duration-200"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            //className="w-full py-4 mt-8 bg-gray-900 text-white font-medium text-sm tracking-wide hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
            className="text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium py-2 px-4 rounded transition duration-200"
          >
            {loading ? "Creating..." : "Register"}
          </button>
        </form>

        {message && (
          <div
            className={`mt-6 p-4 text-center text-sm ${
              message.includes("successful")
                ? "text-green-600 bg-green-50"
                : "text-red-600 bg-red-50"
            } rounded-lg`}
          >
            {message}
          </div>
        )}

        <div className="mt-8 text-center space-y-4">
          <Link
            href="/auth/sign-in"
            className="text-gray-600 hover:text-gray-900 text-sm transition-colors duration-200"
          >
            Already have an account? Sign in
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link
            href="/"
            className="text-gray-400 hover:text-gray-600 text-xs transition-colors duration-200"
          >
            Back to Home
          </Link>
        </div>
      </main>
    </div>
  );
}
