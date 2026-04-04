import { env } from "../config/env";
import type { FeedbackSummaryTheme } from "../types/feedback";
import { cleanText, normalizeCategory, normalizeSentiment, normalizeTags } from "../utils/normalizers";

const feedbackPrompt =
  'Analyse this product feedback. Return ONLY valid JSON with these fields: category, sentiment, priority_score, summary, tags. category must be one of Bug, Feature Request, Improvement, Other. sentiment must be one of Positive, Neutral, Negative. priority_score must be an integer from 1 to 10. tags must be an array of short strings.';

type GeminiFeedbackResult = {
  category: ReturnType<typeof normalizeCategory>;
  sentiment: ReturnType<typeof normalizeSentiment>;
  priority_score: number;
  summary: string;
  tags: string[];
};

function parseJsonFromText(text: string) {
  const match = text.match(/\{[\s\S]*\}/);

  if (!match) {
    throw new Error("Gemini did not return JSON");
  }

  return JSON.parse(match[0]) as Record<string, unknown>;
}

export function normalizeGeminiAnalysis(payload: Record<string, unknown>): GeminiFeedbackResult {
  const priority = Number(payload.priority_score);

  return {
    category: normalizeCategory(typeof payload.category === "string" ? payload.category : undefined),
    sentiment: normalizeSentiment(typeof payload.sentiment === "string" ? payload.sentiment : undefined),
    priority_score: Math.min(10, Math.max(1, Number.isFinite(priority) ? Math.round(priority) : 5)),
    summary: cleanText(typeof payload.summary === "string" ? payload.summary : "No summary available."),
    tags: normalizeTags(payload.tags),
  };
}

export async function analyzeFeedback(title: string, description: string): Promise<GeminiFeedbackResult> {
  if (!env.GEMINI_API_KEY) {
    throw new Error("Missing Gemini API key");
  }

  const { GoogleGenAI } = await import("@google/genai");
  const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  const response = await client.models.generateContent({
    model: env.GEMINI_MODEL,
    contents: `${feedbackPrompt}\n\nTitle: ${title}\nDescription: ${description}`,
  });
  const text = response.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return normalizeGeminiAnalysis(parseJsonFromText(text));
}

function countTopThemes(tags: string[]): FeedbackSummaryTheme[] {
  const counts = tags.reduce<Map<string, number>>((acc, tag) => {
    acc.set(tag, (acc.get(tag) ?? 0) + 1);
    return acc;
  }, new Map());

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([theme, count]) => ({ theme, count }));
}

function buildFallbackSummary(
  items: Array<{ title: string; description: string; ai_summary?: string; ai_tags: string[] }>,
) {
  const themes = countTopThemes(items.flatMap((item) => item.ai_tags));

  if (!themes.length) {
    return {
      summary:
        "Gemini summary is unavailable right now. Recent feedback has been collected successfully, but no strong recurring tags were detected yet.",
      themes: [],
    };
  }

  const themeText = themes.map((theme) => `${theme.theme} (${theme.count})`).join(", ");

  return {
    summary: `Gemini summary is unavailable right now. Most common recent themes: ${themeText}.`,
    themes,
  };
}

export async function generateWeeklySummary(
  items: Array<{ title: string; description: string; ai_summary?: string; ai_tags: string[] }>,
): Promise<{ summary: string; themes: FeedbackSummaryTheme[] }> {
  if (!items.length) {
    return {
      summary: "No feedback was submitted in the last 7 days.",
      themes: [],
    };
  }

  if (!env.GEMINI_API_KEY) {
    return buildFallbackSummary(items);
  }

  try {
    const { GoogleGenAI } = await import("@google/genai");
    const client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    const response = await client.models.generateContent({
      model: env.GEMINI_MODEL,
      contents:
        `You are helping a product team. Summarise the top 3 themes from the last 7 days of feedback. ` +
        `Return ONLY valid JSON with this shape: {"summary":"...", "themes":[{"theme":"...", "count": number}]}\n\n` +
        items
          .slice(0, 25)
          .map((item, index) => {
            return `${index + 1}. Title: ${item.title}\nSummary: ${item.ai_summary ?? item.description}\nTags: ${item.ai_tags.join(", ")}`;
          })
          .join("\n\n"),
    });

    const text = response.text;

    if (!text) {
      throw new Error("Gemini summary response was empty");
    }

    const parsed = parseJsonFromText(text);

    return {
      summary:
        typeof parsed.summary === "string"
          ? cleanText(parsed.summary)
          : "Top themes summary unavailable.",
      themes: Array.isArray(parsed.themes)
        ? parsed.themes
            .map((theme) => {
              if (!theme || typeof theme !== "object") {
                return null;
              }

              const item = theme as Record<string, unknown>;

              return {
                theme: cleanText(typeof item.theme === "string" ? item.theme : "Other"),
                count: Number.isFinite(Number(item.count)) ? Number(item.count) : 1,
              };
            })
            .filter((theme): theme is FeedbackSummaryTheme => Boolean(theme))
            .slice(0, 3)
        : [],
    };
  } catch {
    return buildFallbackSummary(items);
  }
}
