"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getFeedbackList,
  getFeedbackSummary,
  reanalyzeFeedback,
  updateFeedbackStatus,
} from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/auth";
import type {
  FeedbackCategory,
  FeedbackItem,
  FeedbackListResponse,
  FeedbackStatus,
  FeedbackSummaryResponse,
} from "@/types";

const categories: Array<FeedbackCategory | "All"> = [
  "All",
  "Bug",
  "Feature Request",
  "Improvement",
  "Other",
];

const statuses: Array<FeedbackStatus | "All"> = [
  "All",
  "New",
  "In Review",
  "Resolved",
];

export function DashboardClient() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackListResponse | null>(
    null,
  );
  const [summary, setSummary] = useState<FeedbackSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    category: "All",
    status: "All",
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  useEffect(() => {
    const storedToken = getAdminToken();

    if (!storedToken) {
      router.replace("/admin");
      return;
    }

    setToken(storedToken);
  }, [router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadDashboard() {
      const currentToken = token as string;
      setIsLoading(true);
      setError(null);
      setSummaryError(null);

      try {
        const query = new URLSearchParams({
          page: String(filters.page),
          limit: "10",
          category: filters.category,
          status: filters.status,
          search: filters.search,
          sortBy: filters.sortBy,
          sortOrder: filters.sortOrder,
        });

        const [feedbackResult, summaryResult] = await Promise.allSettled([
          getFeedbackList(currentToken, query),
          getFeedbackSummary(currentToken),
        ]);

        if (feedbackResult.status === "rejected") {
          throw feedbackResult.reason;
        }

        setFeedbackData(feedbackResult.value.data);

        if (summaryResult.status === "fulfilled") {
          setSummary(summaryResult.value.data);
        } else {
          setSummary(null);
          setSummaryError(
            summaryResult.reason instanceof Error
              ? summaryResult.reason.message
              : "Weekly summary is temporarily unavailable.",
          );
        }
      } catch (loadError) {
        const message =
          loadError instanceof Error
            ? loadError.message
            : "Dashboard loading failed";
        setError(message);

        if (message.toLowerCase().includes("token")) {
          clearAdminToken();
          router.replace("/admin");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void loadDashboard();
  }, [filters, router, token]);

  async function handleStatusChange(
    item: FeedbackItem,
    status: FeedbackStatus,
  ) {
    if (!token) return;

    try {
      await updateFeedbackStatus(token, item._id, status);
      setFeedbackData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry._id === item._id ? { ...entry, status } : entry,
              ),
            }
          : current,
      );
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Status update failed",
      );
    }
  }

  async function handleReanalyze(item: FeedbackItem) {
    if (!token) return;

    try {
      const response = await reanalyzeFeedback(token, item._id);
      setFeedbackData((current) =>
        current
          ? {
              ...current,
              items: current.items.map((entry) =>
                entry._id === item._id ? response.data : entry,
              ),
            }
          : current,
      );
    } catch (reanalyzeError) {
      setError(
        reanalyzeError instanceof Error
          ? reanalyzeError.message
          : "Re-analysis failed",
      );
    }
  }

  if (isLoading) {
    return <div className="panel">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="notice notice-error">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Admin Dashboard</p>
          <h1 className="text-3xl font-semibold text-[var(--ink)]">
            Feedback intelligence
          </h1>
        </div>
        <button
          className="button-secondary"
          onClick={() => {
            clearAdminToken();
            router.push("/admin");
          }}
          type="button"
        >
          Log out
        </button>
      </div>

      {feedbackData ? (
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard
            label="Total feedback"
            value={String(feedbackData.stats.totalFeedback)}
          />
          <StatCard
            label="Open items"
            value={String(feedbackData.stats.openItems)}
          />
          <StatCard
            label="Avg. priority"
            value={String(feedbackData.stats.averagePriority)}
          />
          <StatCard label="Top tag" value={feedbackData.stats.mostCommonTag} />
        </div>
      ) : null}

      {summary ? (
        <section className="panel space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="eyebrow">Last 7 days</p>
              <h2 className="text-xl font-semibold text-[var(--ink)]">
                AI trend summary
              </h2>
            </div>
            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1 text-sm font-medium text-[var(--ink)]">
              {summary.feedbackCount} items
            </span>
          </div>
          <p className="text-[var(--muted-strong)]">{summary.summary}</p>
          <div className="flex flex-wrap gap-2">
            {summary.themes.map((theme) => (
              <span className="tag" key={theme.theme}>
                {theme.theme} ({theme.count})
              </span>
            ))}
          </div>
        </section>
      ) : summaryError ? (
        <section className="notice notice-error">
          Summary unavailable: {summaryError}
        </section>
      ) : null}

      <section className="panel space-y-4">
        <div className="grid gap-3 md:grid-cols-5">
          <label className="field">
            <span>Category</span>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  category: event.target.value,
                }))
              }
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  status: event.target.value,
                }))
              }
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>
          <label className="field md:col-span-2">
            <span>Search</span>
            <input
              value={filters.search}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  page: 1,
                  search: event.target.value,
                }))
              }
              placeholder="Search by title or AI summary"
            />
          </label>
          <label className="field">
            <span>Sort</span>
            <select
              value={`${filters.sortBy}:${filters.sortOrder}`}
              onChange={(event) => {
                const [sortBy, sortOrder] = event.target.value.split(":");
                setFilters((current) => ({ ...current, sortBy, sortOrder }));
              }}
            >
              <option value="date:desc">Newest first</option>
              <option value="date:asc">Oldest first</option>
              <option value="priority:desc">Highest priority</option>
              <option value="priority:asc">Lowest priority</option>
              <option value="sentiment:asc">Sentiment A-Z</option>
              <option value="sentiment:desc">Sentiment Z-A</option>
            </select>
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="text-sm uppercase tracking-[0.18em] text-[var(--muted)]">
              <tr>
                <th className="pb-3">Title</th>
                <th className="pb-3">Category</th>
                <th className="pb-3">Sentiment</th>
                <th className="pb-3">Priority</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Created</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbackData?.items.map((item) => (
                <tr className="border-t border-white/60" key={item._id}>
                  <td className="py-4 pr-4">
                    <div className="space-y-1">
                      <p className="font-semibold text-[var(--ink)]">
                        {item.title}
                      </p>
                      <p className="text-sm text-[var(--muted-strong)]">
                        {item.ai_summary ?? item.description}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 pr-4">{item.category}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`badge badge-${(item.ai_sentiment ?? "neutral").toLowerCase()}`}
                    >
                      {item.ai_sentiment ?? "Pending"}
                    </span>
                  </td>
                  <td className="py-4 pr-4">{item.ai_priority ?? "-"}</td>
                  <td className="py-4 pr-4">
                    <select
                      className="table-select"
                      value={item.status}
                      onChange={(event) =>
                        handleStatusChange(
                          item,
                          event.target.value as FeedbackStatus,
                        )
                      }
                    >
                      {statuses
                        .filter((status) => status !== "All")
                        .map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                    </select>
                  </td>
                  <td className="py-4 pr-4">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(new Date(item.createdAt))}
                  </td>
                  <td className="py-4">
                    <button
                      className="button-tertiary"
                      onClick={() => handleReanalyze(item)}
                      type="button"
                    >
                      Re-run AI
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {feedbackData ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--muted-strong)]">
              Page {feedbackData.pagination.page} of{" "}
              {feedbackData.pagination.totalPages}
            </p>
            <div className="flex gap-2">
              <button
                className="button-secondary"
                disabled={feedbackData.pagination.page === 1}
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page - 1,
                  }))
                }
                type="button"
              >
                Previous
              </button>
              <button
                className="button-secondary"
                disabled={
                  feedbackData.pagination.page >=
                  feedbackData.pagination.totalPages
                }
                onClick={() =>
                  setFilters((current) => ({
                    ...current,
                    page: current.page + 1,
                  }))
                }
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="panel">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">{value}</p>
    </article>
  );
}
