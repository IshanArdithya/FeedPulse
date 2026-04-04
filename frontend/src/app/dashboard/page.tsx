import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-white px-5 py-5 md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <DashboardClient />
      </div>
    </main>
  );
}
