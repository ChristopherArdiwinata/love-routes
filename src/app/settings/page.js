"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

const AVAILABLE_INTERESTS = [
  "Reading",
  "Movies",
  "Music",
  "Sports",
  "Gaming",
  "Travel",
  "Cooking",
  "Photography",
  "Art",
  "Dancing",
  "Hiking",
  "Fitness",
  "Technology",
  "Fashion",
  "Food",
  "Animals",
  "Nature",
  "Science",
  "History",
  "Writing",
  "Volunteering",
  "Shopping",
  "Meditation",
  "Yoga",
  "Swimming",
  "Running",
  "Cycling",
  "Board Games",
  "Gardening",
  "DIY Projects",
];

export default function Settings() {
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [availableInterests] = useState(AVAILABLE_INTERESTS);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user") || "{}");
    setUser(userData);
    setSelectedInterests(userData.interests || []);
  }, []);

  const handleInterestToggle = (interest) => {
    setSelectedInterests((prev) => {
      if (prev.includes(interest)) {
        return prev.filter((i) => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };

  const handleSaveInterests = async () => {
    if (!user?.email) {
      setMessage("Please sign in to update interests");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/user/interests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          interests: selectedInterests,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Interests updated successfully!");
        const updatedUser = { ...user, interests: selectedInterests };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        // Redirect to maps after 1 second
        setTimeout(() => {
          router.push("/dashboard");
        }, 1000);
      } else {
        setMessage(data.error || "Failed to update interests");
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
          href="/dashboard"
          className="flex items-center space-x-2  backdrop-blur-sm px-4 py-2 transition-all duration-200"
        >
          <Image
            src="/commutuals-img-cropped.png"
            alt="Logo"
            width={100}
            height={100}
            className="mx-auto mb-2 mr-2"
          />
        </Link>
      </div>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4">
          <div className="max-w-4xl mx-auto flex justify-between items-center">
            <h1 className="text-black-600 px-6 py-2 rounded-md text-xl font-medium transition-colors">
              Settings
            </h1>
            <div className="flex gap-4">
              <Link
                href="/"
                className="ptext-black-600 hover:text-gray-700 hover:underline cursor-pointer px-6 py-2 rounded-md text-xl font-medium transition-colors"
              >
                Sign Out
              </Link>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto p-6">
          <div className="rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-6">Your Interests</h2>
            <p className="text-black-600 mb-6">
              Select your interests to help us find better matches and
              recommendations. You can select multiple interests.
            </p>

            <div className="mb-6">
              <h3 className="font-medium mb-4">
                Selected: {selectedInterests.length} interest
                {selectedInterests.length !== 1 ? "s" : ""}
              </h3>

              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 p-4 bg-blue-50 rounded-lg">
                  {selectedInterests.map((interest) => (
                    <span
                      key={interest}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded-full flex items-center gap-2"
                    >
                      {interest}
                      <button
                        onClick={() => handleInterestToggle(interest)}
                        className="text-blue-200 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-4">Available Interests</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableInterests
                  .filter((interest) => !selectedInterests.includes(interest))
                  .map((interest) => (
                    <button
                      key={interest}
                      onClick={() => handleInterestToggle(interest)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 hover:border-gray-400 transition-colors text-left"
                    >
                      + {interest}
                    </button>
                  ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSaveInterests}
                disabled={loading}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? "Saving..." : "Save Interests"}
              </button>

              <button
                onClick={() => setSelectedInterests([])}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Clear All
              </button>
            </div>

            {message && (
              <p
                className={`mt-4 ${
                  message.includes("successfully")
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {message}
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
