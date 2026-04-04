import { DashboardClient } from "@/components/dashboard-client";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#f5f2e9_0%,_#edf3f7_100%)] px-6 py-10">
      <div className="mx-auto max-w-7xl">
        <DashboardClient />
      </div>
    </main>
  );
}
