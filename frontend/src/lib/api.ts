import type {
  ApiEnvelope,
  FeedbackItem,
  FeedbackListResponse,
  FeedbackSummaryResponse,
} from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

async function request<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export async function submitFeedback(payload: {
  title: string;
  description: string;
  category: string;
  submitterName?: string;
  submitterEmail?: string;
}) {
  return request<FeedbackItem>("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function loginAdmin(payload: { email: string; password: string }) {
  return request<{ token: string; admin: { email: string; role: string } }>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFeedbackList(
  token: string,
  query: URLSearchParams,
) {
  return request<FeedbackListResponse>(`/feedback?${query.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function updateFeedbackStatus(
  token: string,
  id: string,
  status: string,
) {
  return request<FeedbackItem>(`/feedback/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ status }),
  });
}

export async function getFeedbackSummary(token: string) {
  return request<FeedbackSummaryResponse>("/feedback/summary", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function reanalyzeFeedback(token: string, id: string) {
  return request<FeedbackItem>(`/feedback/${id}/reanalyze`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

