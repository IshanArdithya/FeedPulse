import Link from "next/link";
import { AdminLoginForm } from "@/components/admin-login-form";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-5 flex items-center justify-center">
      <div className="w-full max-w-md">
        <section className="flex flex-col gap-4">
          <div className="panel-dark text-center">
            <p className="eyebrow text-white/60!">Sign in</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-white">
              Access the admin dashboard
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/70">
              Use the configured admin account to access filters, summaries, status
              updates, and AI re-analysis tools.
            </p>
          </div>
          <AdminLoginForm />
          <div className="text-center mt-2">
            <Button variant="text" size="sm" className="group" asChild>
              <Link className="flex items-center gap-2 font-medium" href="/">
                <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-1" /> 
                Back to Home Page
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
