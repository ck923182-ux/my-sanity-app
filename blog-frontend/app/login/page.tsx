
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "../../lib/auth-client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        setError("Invalid email or password.");
        return;
      }

      router.replace("/agent");
      router.refresh();
    } catch {
      setError("Unable to log in. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md space-y-5 rounded-xl bg-white p-8 shadow"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Admin Login
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Sign in to access the administration dashboard.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="username"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            className="w-full rounded-lg border px-3 py-2 outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
