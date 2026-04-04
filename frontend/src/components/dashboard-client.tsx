"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getFeedbackList,
  getFeedbackSummary,
  refreshFeedbackSummary,
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
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    page: 1,
    category: "All",
    status: "All",
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  });

  async function loadSummary(tokenValue: string) {
    const response = await getFeedbackSummary(tokenValue);
    setSummary(response.data);
    return response.data;
  }

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

    async function loadFeedback() {
      const currentToken = token as string;
      setIsLoading(true);
      setError(null);

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

        const feedbackResponse = await getFeedbackList(currentToken, query);
        setFeedbackData(feedbackResponse.data);
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

    void loadFeedback();
  }, [filters, router, token]);

  useEffect(() => {
    if (!token) {
      return;
    }

    let pollingTimeout: ReturnType<typeof setTimeout> | undefined;

    async function fetchSummary() {
      const currentToken = token as string;
      setIsSummaryLoading(true);
      setSummaryError(null);

      try {
        const summaryData = await loadSummary(currentToken);

        if (summaryData.isRefreshing) {
          pollingTimeout = setTimeout(() => {
            void fetchSummary();
          }, 2500);
        }
      } catch (loadError) {
        setSummary(null);
        setSummaryError(
          loadError instanceof Error
            ? loadError.message
            : "Weekly summary is temporarily unavailable.",
        );
      } finally {
        setIsSummaryLoading(false);
      }
    }

    void fetchSummary();

    return () => {
      if (pollingTimeout) {
        clearTimeout(pollingTimeout);
      }
    };
  }, [token]);

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

  async function handleRefreshSummary() {
    if (!token) {
      return;
    }

    setSummaryError(null);

    try {
      const response = await refreshFeedbackSummary(token);

      if (response.data.started || response.data.alreadyRefreshing) {
        setIsSummaryLoading(false);

        const summaryData = await loadSummary(token);

        if (summaryData.isRefreshing) {
          const poll = async () => {
            const nextSummary = await loadSummary(token);

            if (nextSummary.isRefreshing) {
              setTimeout(() => {
                void poll();
              }, 2500);
            }
          };

          setTimeout(() => {
            void poll();
          }, 2500);
        }
      }
    } catch (refreshError) {
      setSummaryError(
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh summary.",
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
      <section className="panel grid gap-6 p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <span className="mono-kicker">Admin dashboard</span>
            <span className="mono-kicker">Review workspace</span>
          </div>
          <div className="space-y-4">
            <p className="eyebrow">Feedback intelligence</p>
            <h1 className="text-4xl font-semibold tracking-tight text-[var(--ink)] md:text-5xl">
              Review signals, not just submissions.
            </h1>
            <p className="subheading max-w-2xl">
              Filter feedback, review AI interpretation, move items through the
              workflow, and spot what keeps appearing across the last week of
              product input.
            </p>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-4">
          <div className="metric-card-dark">
            <p className="eyebrow !text-white/60">Session</p>
            <p className="mt-3 text-2xl font-semibold text-white">
              Product review mode
            </p>
            <p className="mt-2 text-sm leading-7 text-white/70">
              You are signed in with admin access and can update status or rerun AI analysis.
            </p>
          </div>
          <button
            className="button-secondary w-fit"
            onClick={() => {
              clearAdminToken();
              router.push("/admin");
            }}
            type="button"
          >
            Log out
          </button>
        </div>
      </section>

      {feedbackData ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            tone="dark"
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
        </section>
      ) : null}

      {isSummaryLoading && !summary ? (
        <section className="panel-dark space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow !text-white/60">Last 7 days</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                Generating summary...
              </h2>
            </div>
            <span className="mono-kicker !border-white/15 !text-white/70">
              Preparing AI snapshot
            </span>
          </div>
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full bg-white/10" />
            <div className="h-4 w-11/12 rounded-full bg-white/10" />
            <div className="h-4 w-10/12 rounded-full bg-white/10" />
          </div>
        </section>
      ) : summary ? (
        <section className="panel-dark space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="eyebrow !text-white/60">Last 7 days</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">
                AI trend summary
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mono-kicker !border-white/15 !text-white/70">
                {summary.feedbackCount} items analyzed
              </span>
              {summary.isRefreshing ? (
                <span className="mono-kicker !border-white/15 !text-white/70">
                  Refreshing...
                </span>
              ) : null}
              {summary.isStale && !summary.isRefreshing ? (
                <span className="mono-kicker !border-white/15 !text-white/70">
                  Stale
                </span>
              ) : null}
            </div>
          </div>
          <p className="max-w-5xl text-sm leading-8 text-white/78 md:text-base">
            {summary.summary || "A stored summary is not available yet."}
          </p>
          <div className="flex flex-wrap gap-2">
            {summary.themes.map((theme) => (
              <span
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/78"
                key={theme.theme}
              >
                {theme.theme} ({theme.count})
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 surface-rule pt-5">
            <div className="text-sm text-white/65">
              {summary.lastRefreshStatus === "failed"
                ? "Couldn’t refresh, showing the last available summary."
                : summary.isRefreshing
                  ? "Generating an updated summary in the background."
                  : summary.generatedAt
                    ? `Last generated ${new Intl.DateTimeFormat("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(summary.generatedAt))}`
                    : "Summary not generated yet."}
            </div>
            <button
              className="button-secondary"
              onClick={handleRefreshSummary}
              type="button"
            >
              Refresh summary
            </button>
          </div>
        </section>
      ) : summaryError ? (
        <section className="notice notice-error">
          Summary unavailable: {summaryError}
        </section>
      ) : null}

      <section className="panel space-y-6 p-6 md:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Review queue</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-[var(--ink)]">
              All feedback
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-7 text-[var(--muted-strong)]">
            Use filters to narrow the queue, then update statuses or rerun analysis where more accurate AI context is needed.
          </p>
        </div>

        <div className="panel-soft grid gap-3 md:grid-cols-5">
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
          <table className="dashboard-table w-full min-w-[940px] text-left">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Sentiment</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {feedbackData?.items.map((item) => (
                <tr className="dashboard-row" key={item._id}>
                  <td className="pr-5">
                    <div className="space-y-2">
                      <p className="text-base font-semibold text-[var(--ink)]">
                        {item.title}
                      </p>
                      <p className="max-w-xl text-sm leading-7 text-[var(--muted-strong)]">
                        {item.ai_summary ?? item.description}
                      </p>
                    </div>
                  </td>
                  <td className="pr-5">
                    <span className="tag">{item.category}</span>
                  </td>
                  <td className="pr-5">
                    <span
                      className={`badge badge-${(item.ai_sentiment ?? "neutral").toLowerCase()}`}
                    >
                      {item.ai_sentiment ?? "Pending"}
                    </span>
                  </td>
                  <td className="pr-5 text-base font-semibold text-[var(--ink)]">
                    {item.ai_priority ?? "-"}
                  </td>
                  <td className="pr-5">
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
                  <td className="pr-5 text-sm text-[var(--muted-strong)]">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(new Date(item.createdAt))}
                  </td>
                  <td>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
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

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "dark";
}) {
  return (
    <article className={tone === "dark" ? "metric-card-dark" : "metric-card"}>
      <p className={`eyebrow ${tone === "dark" ? "!text-white/60" : ""}`}>{label}</p>
      <p
        className={`mt-3 text-4xl font-semibold tracking-tight ${
          tone === "dark" ? "text-white" : "text-[var(--ink)]"
        }`}
      >
        {value}
      </p>
    </article>
  );
}
