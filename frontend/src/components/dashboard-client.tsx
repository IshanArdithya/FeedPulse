"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Filter } from "lucide-react";
import {
  getFeedbackList,
  getFeedbackSummary,
  refreshFeedbackSummary,
  reanalyzeFeedback,
  updateFeedbackStatus,
  deleteFeedback,
} from "@/lib/api";
import { clearAdminToken, getAdminToken } from "@/lib/auth";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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

const defaultFilters = {
  page: 1,
  category: "All" as const,
  status: "All" as const,
  search: "",
  sortBy: "date",
  sortOrder: "desc",
};

export function DashboardClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [token, setToken] = useState<string | null>(null);
  const [feedbackData, setFeedbackData] = useState<FeedbackListResponse | null>(null);
  const [summary, setSummary] = useState<FeedbackSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackItem | null>(null);

  const [filters, setFilters] = useState({
    page: Number(searchParams.get("page")) || defaultFilters.page,
    category: searchParams.get("category") || defaultFilters.category,
    status: searchParams.get("status") || defaultFilters.status,
    search: searchParams.get("search") || defaultFilters.search,
    sortBy: searchParams.get("sortBy") || defaultFilters.sortBy,
    sortOrder: searchParams.get("sortOrder") || defaultFilters.sortOrder,
  });

  const activeFilterCount = [
    filters.category !== "All",
    filters.status !== "All",
    filters.sortBy !== "date" || filters.sortOrder !== "desc",
  ].filter(Boolean).length;

  const handleClearFilters = () => {
    setFilters(defaultFilters);
    setIsMobileFiltersOpen(false);
  };

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.page > 1) params.set("page", String(filters.page));
    if (filters.category !== "All") params.set("category", filters.category);
    if (filters.status !== "All") params.set("status", filters.status);
    if (filters.search) params.set("search", filters.search);
    if (filters.sortBy !== "date") params.set("sortBy", filters.sortBy);
    if (filters.sortOrder !== "desc") params.set("sortOrder", filters.sortOrder);

    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [filters, pathname, router]);

  async function loadSummary(tokenValue: string) {
    const response = await getFeedbackSummary(tokenValue);
    setSummary(response.data);
    return response.data;
  }

  useEffect(() => {
    const storedToken = getAdminToken();

    if (storedToken) {
      setToken(storedToken);
    }
  }, [router]);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadFeedback() {
      const currentToken = token as string;
      if (!feedbackData) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
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
        setIsRefreshing(false);
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
        if (!summaryData.isRefreshing) {
          toast.success("Intelligence Summary updated");
        }
      } catch (loadError) {
        toast.error("Summary refresh failed");
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
      toast.success(`Feedback status updated to ${status}`);
    } catch (updateError) {
      toast.error("Failed to update status");
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Status update failed",
      );
    }
  }

  async function handleDelete(id: string) {
    if (!token) return;

    try {
      await deleteFeedback(token, id);
      setFeedbackData((current) =>
        current
          ? {
            ...current,
            items: current.items.filter((entry) => entry._id !== id),
          }
          : current,
      );
      toast.success("Feedback deleted successfully");
    } catch (error) {
      toast.error("Failed to delete feedback");
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
      toast.success("AI Analysis completed");
    } catch (reanalyzeError) {
      toast.error("AI Analysis failed");
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
        toast.info(response.data.alreadyRefreshing ? "Analysis already in progress..." : "Intelligence Summary scan started...");
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


  if (error) {
    return <div className="notice notice-error">{error}</div>;
  }

  return (
    <div className="space-y-10 pb-20">
      <section className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <span className="mono-kicker border-(--line-strong)">Admin dashboard</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:block text-right pr-4 border-r border-(--line)">
              <p className="eyebrow">Signed in as</p>
              <p className="text-sm font-semibold text-(--ink)">Admin</p>
            </div>
            <Button
              variant="secondary"
              className="bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200!"
              onClick={() => {
                clearAdminToken();
                router.push("/admin");
              }}
              type="button"
            >
              Log out
            </Button>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-(--ink) md:text-5xl">
            Feedback Overview
          </h1>
          <p className="subheading max-w-2xl text-lg opacity-60">
            Monitor customer trends and prioritize what matters most.
          </p>
        </div>
      </section>

      {feedbackData ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            tone="brand"
            label="Total entries"
            value={String(feedbackData.stats.totalFeedback)}
          />
          <StatCard
            label="In the queue"
            value={String(feedbackData.stats.openItems)}
          />
          <StatCard
            label="Priority Average"
            value={String(feedbackData.stats.averagePriority)}
          />
          <StatCard
            label="Strongest theme"
            value={feedbackData.stats.mostCommonTag}
          />
        </section>
      ) : (
        <StatsSkeleton />
      )}

      {isSummaryLoading && !summary ? (
        <SummarySkeleton />
      ) : summary ? (
        <section className="glass-panel rounded-[32px] overflow-hidden">
          <div className="p-8 md:p-10 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="eyebrow text-emerald-600!">AI Overview</p>
                <h2 className="text-3xl font-bold tracking-tight text-(--ink)">
                  Intelligence Summary
                </h2>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="badge badge-info">
                  {summary.feedbackCount} items analyzed
                </span>
                {summary.isRefreshing && (
                  <span className="badge badge-warning animate-pulse">
                    Refreshing...
                  </span>
                )}
                {summary.isStale && !summary.isRefreshing && (
                  <span className="badge badge-neutral">Stale</span>
                )}
              </div>
            </div>

            <div className="max-w-4xl">
              <p className="text-lg leading-relaxed text-(--muted-strong) font-medium italic">
                "{summary.summary || "A stored summary is not available yet."}"
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {summary.themes.map((theme) => (
                <span
                  className="rounded-xl bg-(--ink) text-white px-4 py-2 text-sm font-medium transition-transform hover:scale-105"
                  key={theme.theme}
                >
                  {theme.theme} <span className="opacity-50 ml-1">{theme.count}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="px-8 py-5 bg-(--line)/20 border-t border-(--line) flex flex-wrap items-center justify-between gap-4">
            <p className="text-xs font-medium text-(--muted-strong)">
              {summary.lastRefreshStatus === "failed"
                ? "Couldn’t refresh, showing last available summary."
                : summary.isRefreshing
                  ? "Updating summary in background..."
                  : summary?.generatedAt
                    ? `Summary generated ${new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(summary.generatedAt))}`
                    : "No data available."}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/50! uppercase tracking-wider"
              onClick={handleRefreshSummary}
              disabled={summary.isRefreshing}
            >
              Regenerate Summary
            </Button>
          </div>
        </section>
      ) : summaryError ? (
        <section className="notice notice-error rounded-3xl">
          Intelligence engine offline: {summaryError}
        </section>
      ) : null}

      <section className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <p className="eyebrow">Review Queue</p>
            <h2 className="text-3xl font-bold tracking-tight text-(--ink)">
              Feedback
            </h2>
          </div>
          <p className="max-w-md text-sm text-(--muted-strong) font-medium opacity-60">
            Review and manage user feedback with AI-powered insights.
          </p>
        </div>

        <div className="space-y-4">
          {/* Top Bar: Search and Mobile Filter Toggle */}
          <div className="flex flex-col md:flex-row gap-3">
            <Field className="flex-1" label="Search Feedback">
              <Input
                className="bg-white/50!"
                value={filters.search}
                onChange={(event) =>
                  setFilters((current) => ({
                    ...current,
                    page: 1,
                    search: event.target.value,
                  }))
                }
                placeholder="Search title or AI context..."
              />
            </Field>

            <div className="flex items-end md:hidden">
              <Button
                variant={isMobileFiltersOpen ? "primary" : "secondary"}
                className="w-full h-[52px] rounded-2xl flex items-center justify-center gap-2"
                onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
              >
                <Filter className="h-4 w-4" />
                {isMobileFiltersOpen ? "Hide Filters" : "Show Filters"}
                {activeFilterCount > 0 && !isMobileFiltersOpen && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Secondary Filters: Collapsible on mobile, Grid on desktop */}
          <div
            className={cn(
              "grid transition-all duration-300 ease-in-out md:grid md:grid-cols-1",
              isMobileFiltersOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0 md:opacity-100 md:grid-rows-[1fr]"
            )}
          >
            <div className="min-h-0 overflow-hidden">
              <div className="glass-panel relative z-20 p-4 rounded-2xl grid gap-3 grid-cols-1 md:grid-cols-4">
                <Field label="Category">
                  <Select
                    className="bg-white/50!"
                    options={categories.map((c) => ({ label: c, value: c }))}
                    value={filters.category}
                    onChange={(val) =>
                      setFilters((current) => ({
                        ...current,
                        page: 1,
                        category: val,
                      }))
                    }
                  />
                </Field>

                <Field label="Status">
                  <Select
                    className="bg-white/50!"
                    options={statuses.map((s) => ({ label: s, value: s }))}
                    value={filters.status}
                    onChange={(val) =>
                      setFilters((current) => ({
                        ...current,
                        page: 1,
                        status: val,
                      }))
                    }
                  />
                </Field>

                <Field label="Sort By">
                  <Select
                    className="bg-white/50!"
                    options={[
                      { label: "Newest First", value: "date:desc" },
                      { label: "Oldest First", value: "date:asc" },
                      { label: "High Priority", value: "priority:desc" },
                      { label: "Low Priority", value: "priority:asc" },
                    ]}
                    value={`${filters.sortBy}:${filters.sortOrder}`}
                    onChange={(val) => {
                      const [sortBy, sortOrder] = val.split(":");
                      setFilters((current) => ({ ...current, sortBy, sortOrder }));
                    }}
                  />
                </Field>

                <div className="flex h-full items-end pb-3 pl-2">
                  <Button
                    variant="tertiary"
                    size="sm"
                    className="text-[10px] font-bold uppercase tracking-widest text-(--muted) hover:text-(--ink)! transition-colors"
                    onClick={handleClearFilters}
                    disabled={
                      filters.category === "All" &&
                      filters.status === "All" &&
                      filters.search === "" &&
                      filters.page === 1 &&
                      filters.sortBy === "date" &&
                      filters.sortOrder === "desc"
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {feedbackData ? (
          <>
            <div
              className={cn(
                "relative z-10 overflow-x-auto rounded-2xl border border-(--line) bg-white transition-opacity duration-300",
                isRefreshing ? "opacity-50 pointer-events-none" : "opacity-100"
              )}
            >
              <table className="dashboard-table w-full md:min-w-[940px] text-left">
                <thead>
                  <tr className="bg-(--line)/10 text-xs text-(--muted-strong) uppercase tracking-wider font-bold">
                    <th className="pl-6 py-4">Feedback Content</th>
                    <th className="py-4 hidden md:table-cell">AI Insights</th>
                    <th className="py-4">Workflow Status</th>
                    <th className="py-4 pr-6 hidden md:table-cell text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-(--line)">
                  {feedbackData.items.map((item) => (
                    <tr
                      key={item._id}
                      className="dashboard-row cursor-pointer transition-colors hover:bg-gray-50!"
                      onClick={() => setSelectedFeedback(item)}
                    >
                      <td className="py-6 pl-6 pr-4 align-top">
                        <div className="space-y-1.5 focus:outline-none">
                          <p className="text-base font-bold text-(--ink) leading-tight line-clamp-3 max-w-[160px] md:max-w-xl">
                            {item.title}
                          </p>
                          <p className="hidden md:block max-w-xl text-sm leading-6 text-(--muted-strong) line-clamp-3">
                            {item.ai_summary ?? item.description}
                          </p>
                          <p className="text-[10px] font-bold tracking-widest uppercase text-(--muted) pt-1">
                            {new Intl.DateTimeFormat("en-US", {
                              dateStyle: "medium",
                            }).format(new Date(item.createdAt))}
                          </p>
                        </div>
                      </td>
                      <td className="py-6 pr-5 align-top hidden md:table-cell">
                        <div className="flex flex-col items-start gap-2">
                          <span className="badge badge-neutral bg-gray-50!">{item.category}</span>
                          <span
                            className={`badge ${item.ai_sentiment === "Positive" ? "badge-positive" :
                              item.ai_sentiment === "Negative" ? "badge-negative" :
                                "badge-neutral"
                              }`}
                          >
                            {item.ai_sentiment ?? "Analyzing..."}
                          </span>
                          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-gray-50 border border-(--line) whitespace-nowrap mt-1">
                            <span className={`h-2 w-2 rounded-full ${(item.ai_priority ?? 0) > 7 ? "bg-red-500" :
                              (item.ai_priority ?? 0) > 4 ? "bg-amber-500" :
                                "bg-emerald-500"
                              }`} />
                            <span className="text-[10px] uppercase tracking-wider font-bold text-(--ink)">
                              Priority {item.ai_priority ?? "-"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 pr-5 align-top">
                        <div onClick={(e) => e.stopPropagation()}>
                          <Select
                            className="bg-white/50! font-semibold text-xs py-2 px-3 h-auto min-w-[130px] rounded-xl!"
                            options={statuses.filter((s) => s !== "All").map((s) => ({ label: s, value: s }))}
                            value={item.status}
                            onChange={(val) =>
                              handleStatusChange(item, val as FeedbackStatus)
                            }
                          />
                        </div>
                      </td>
                      <td className="py-6 pr-6 align-top hidden md:table-cell text-right">
                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleReanalyze(item)}
                          >
                            Rescan
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="danger" size="sm">
                                Delete
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-4xl!">
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                <AlertDialogDescription className="text-(--muted-strong) font-medium opacity-80!">
                                  This action cannot be undone. This will permanently delete the feedback entry
                                  "{item.title}" from the database.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl! border-white/20! bg-white/20! backdrop-blur-sm! text-(--ink)!">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(item._id)}
                                  className="rounded-xl! bg-red-600! hover:bg-red-700! border-none!"
                                >
                                  Delete Feedback
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Dialog
              open={!!selectedFeedback}
              onOpenChange={(open: boolean) => !open && setSelectedFeedback(null)}
            >
              <DialogContent className="max-w-2xl p-0 overflow-hidden">
                <div className="max-h-[calc(90vh-80px)] overflow-y-auto custom-scrollbar">
                  {selectedFeedback && (
                    <>
                      <DialogHeader className="pb-0 md:pb-6!">
                        <div className="space-y-3 mb-6">
                          <div>
                            <span className="badge badge-neutral bg-black! text-white! border-none!">{selectedFeedback.category}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span
                              className={`badge ${selectedFeedback.ai_sentiment === "Positive" ? "badge-positive" :
                                selectedFeedback.ai_sentiment === "Negative" ? "badge-negative" :
                                  "badge-neutral"
                                }`}
                            >
                              {selectedFeedback.ai_sentiment ?? "Analyzing..."}
                            </span>
                            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gray-50 border border-(--line) whitespace-nowrap">
                              <span className={`h-2 w-2 rounded-full ${(selectedFeedback.ai_priority ?? 0) > 7 ? "bg-red-500" :
                                (selectedFeedback.ai_priority ?? 0) > 4 ? "bg-amber-500" :
                                  "bg-emerald-500"
                                }`} />
                              <span className="text-[10px] uppercase tracking-wider font-bold text-(--ink)">
                                Priority {selectedFeedback.ai_priority ?? "-"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <DialogTitle className="text-3xl pr-8 leading-tight">{selectedFeedback.title}</DialogTitle>
                        <DialogDescription className="mt-2 text-sm">
                          Received on {new Intl.DateTimeFormat("en-US", {
                            dateStyle: "full",
                          }).format(new Date(selectedFeedback.createdAt))}
                        </DialogDescription>
                      </DialogHeader>

                      <div className="px-8 md:px-10 pb-8 pt-8 md:pt-0 space-y-8">
                        {selectedFeedback.ai_summary && (
                          <section className="space-y-3">
                            <p className="eyebrow text-black!">AI Intelligence Summary</p>
                            <div className="p-5 rounded-2xl bg-gray-50 border border-(--line) text-sm leading-relaxed text-(--ink) font-medium">
                              {selectedFeedback.ai_summary}
                            </div>
                          </section>
                        )}

                        <section className="space-y-3">
                          <p className="eyebrow text-black!">Original Message</p>
                          <div className="whitespace-pre-wrap text-sm leading-relaxed text-(--muted-strong) bg-white p-1">
                            {selectedFeedback.description}
                          </div>
                        </section>

                        <div className="pt-6 border-t border-(--line) flex flex-wrap items-center justify-between gap-6">
                          <div className="space-y-1.5">
                            <p className="eyebrow">Workflow Status</p>
                            <Select
                              className="bg-gray-50! font-semibold text-xs py-2.5 px-4 h-auto min-w-[160px] rounded-xl!"
                              options={statuses.filter((s) => s !== "All").map((s) => ({ label: s, value: s }))}
                              value={selectedFeedback.status}
                              onChange={(val) => {
                                handleStatusChange(selectedFeedback, val as FeedbackStatus);
                                setSelectedFeedback({ ...selectedFeedback, status: val as FeedbackStatus });
                              }}
                            />
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleReanalyze(selectedFeedback)}
                            >
                              Rescan with AI
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="danger" size="sm">
                                  Delete
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-4xl!">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                  <AlertDialogDescription className="text-(--muted-strong) font-medium opacity-80!">
                                    This action cannot be undone. This will permanently delete the feedback entry
                                    "{selectedFeedback.title}" from the database.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl! border-white/20! bg-white/20! backdrop-blur-sm! text-(--ink)!">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      handleDelete(selectedFeedback._id);
                                      setSelectedFeedback(null);
                                    }}
                                    className="rounded-xl! bg-red-600! hover:bg-red-700! border-none!"
                                  >
                                    Delete Feedback
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>

                      <DialogFooter className="bg-gray-50/50 py-4 px-8 md:px-10 border-t border-(--line) shrink-0">
                        <Button variant="secondary" onClick={() => setSelectedFeedback(null)}>
                          Close Details
                        </Button>
                      </DialogFooter>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-(--line)">
              <p className="text-xs font-bold uppercase tracking-widest text-(--muted-strong)">
                Page {feedbackData.pagination.page} <span className="opacity-40 mx-1">/</span> {feedbackData.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="uppercase tracking-wider"
                  disabled={feedbackData.pagination.page === 1}
                  onClick={() =>
                    setFilters((current) => ({
                      ...current,
                      page: current.page - 1,
                    }))
                  }
                >
                  Prev
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  className="uppercase tracking-wider"
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
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        ) : (
          <TableSkeleton />
        )}
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
  tone?: "brand";
}) {
  return (
    <article className={`p-6 rounded-3xl border border-(--line) ${tone === "brand" ? "bg-(--ink) text-white shadow-xl shadow-black/10" : "bg-white"}`}>
      <p className={`eyebrow mb-3 ${tone === "brand" ? "text-white/60!" : ""}`}>{label}</p>
      <p className={`stat-value ${tone === "brand" ? "text-white" : "text-(--ink)"}`}>
        {value}
      </p>
    </article>
  );
}

function StatsSkeleton() {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-6 rounded-3xl border border-(--line) bg-white space-y-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-10 w-12" />
        </div>
      ))}
    </section>
  );
}

function SummarySkeleton() {
  return (
    <section className="glass-panel rounded-[32px] overflow-hidden">
      <div className="p-8 md:p-10 space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-10 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-[90%]" />
          <Skeleton className="h-4 w-[85%]" />
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-24 rounded-xl" />
          ))}
        </div>
      </div>
      <div className="px-8 py-5 bg-(--line)/20 border-t border-(--line) flex items-center justify-between">
        <Skeleton className="h-3 w-48" />
        <Skeleton className="h-9 w-32 rounded-full" />
      </div>
    </section>
  );
}

function TableSkeleton() {
  return (
    <div className="border border-(--line) rounded-2xl bg-white overflow-hidden">
      <div className="bg-(--line)/10 px-6 py-4 border-b border-(--line)">
        <div className="flex gap-10">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="divide-y divide-(--line)">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-6 flex flex-wrap gap-10 items-start justify-between">
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex flex-col gap-2 min-w-[120px]">
              <Skeleton className="h-6 w-full rounded-full" />
              <Skeleton className="h-6 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
