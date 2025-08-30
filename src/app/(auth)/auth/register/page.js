"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

//hello
export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, age, gender }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Registration successful!");
        // Store user data in localStorage and redirect to settings
        localStorage.setItem("user", JSON.stringify(data.user));
        setTimeout(() => {
          router.push("/settings");
        }, 1000);
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
    <div>
      <div
        style={{ backgroundColor: "#FFC14F" }}
        className="fixed border-b-3 border-r-3 border-black-500 z-50"
      >
        <Link
          href="/"
          className="flex items-center space-x-2  backdrop-blur-sm px-4 py-2 transition-all duration-200"
        >
          <Image
            src="/commutuals-img-cropped.png"
            alt="Logo"
            width={150}
            height={150}
            className="mx-auto mb-2 mr-2"
          />
        </Link>
      </div>

      <div className="min-h-screen flex items-center justify-center px-4">
        <main className="w-full max-w-md">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-serif text-gray-900 mb-2">
              Create Account
            </h1>
            <p className="text-gray-500 font-serif text-lg">
              Join us to get started
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-white px-6 py-4 border-2 border-gray-400 rounded-2xl focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                //className="w-full px-0 py-4 text-gray-900 placeholder-gray-400 border-0 border-b border-gray-200 bg-transparent focus:border-gray-900 focus:outline-none transition-colors duration-200"
                className="w-full bg-white px-6 py-4 border-2 border-gray-400 rounded-2xl focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none transition-all duration-200 font-semibold"
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
                className="w-full bg-white px-6 py-4 border-2 border-gray-400 rounded-2xl focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none transition-all duration-200 font-semibold"
              />
            </div>
            <div className="flex gap-4 justify-center">
              <div>
                <input
                  type="number"
                  placeholder="Age"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                  min="18"
                  max="100"
                  className="w-full bg-white px-12 py-4 border-2 border-gray-400 rounded-2xl focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none transition-all duration-200 font-semibold"
                />
              </div>
              <div>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="w-full bg-white px-12 py-4 border-2 border-gray-400 rounded-2xl focus:ring-1 focus:ring-gray-400 focus:border-gray-400 focus:outline-none transition-all duration-200 font-semibold"
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              //className="w-full py-4 mt-8 bg-gray-900 text-white font-medium text-sm tracking-wide hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2"
              className="border-2 border-gray-600 text-gray-600 hover:text-gray-800 hover:bg-gray-50 font-medium py-2 px-4 rounded-2xl transition duration-200 ml-auto block"
              //
            >
              {loading ? "Creating..." : "Register"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-6 p-4 text-center text-sm ${
                message.includes("successful")
                  ? "text-green-600 font-serif underline text-xl"
                  : "text-red-600 font-serif underline text-xl"
              } rounded-lg`}
            >
              {message}
            </div>
          )}

          <div className="mt-8 text-center space-y-4">
            <Link
              href="/auth/sign-in"
              className="text-gray-600 font-serif hover:text-gray-900 underline text-lg transition-colors duration-200"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
