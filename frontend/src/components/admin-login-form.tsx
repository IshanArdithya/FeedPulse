"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { setAdminToken } from "@/lib/auth";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await loginAdmin({ email, password });
      setAdminToken(response.data.token);
      router.push("/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="panel space-y-6 p-6 md:p-7" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Credential check</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--ink)]">
          Sign in to continue
        </h3>
      </div>

      <label className="field">
        <span>Admin email</span>
        <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
        />
      </label>

      {error ? <div className="notice notice-error">{error}</div> : null}

      <div className="surface-rule pt-5">
        <button className="button-primary w-full" disabled={isLoading} type="submit">
        {isLoading ? "Signing in..." : "Access dashboard"}
        </button>
      </div>
    </form>
  );
}
