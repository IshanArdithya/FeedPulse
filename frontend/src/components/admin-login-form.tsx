"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/lib/api";
import { setAdminToken } from "@/lib/auth";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { toast } from "sonner";

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    try {
      const response = await loginAdmin({ email, password });
      setAdminToken(response.data.token);
      toast.success("Welcome back, Admin!");
      router.push("/dashboard");
    } catch (loginError) {
      toast.error(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="panel space-y-6 p-6 md:p-7" onSubmit={handleSubmit}>
      <div>
        <p className="eyebrow">Credential check</p>
        <h3 className="mt-2 text-2xl font-semibold tracking-tight text-(--ink)">
          Sign in to continue
        </h3>
      </div>

      <Field label="Admin email">
        <Input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="admin@feedpulse.com"
        />
      </Field>

      <Field label="Password">
        <Input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="••••••••"
        />
      </Field>

      <div className="surface-rule pt-5">
        <Button className="w-full" disabled={isLoading} type="submit">
          {isLoading ? "Signing in..." : "Access dashboard"}
        </Button>
      </div>
    </form>
  );
}
