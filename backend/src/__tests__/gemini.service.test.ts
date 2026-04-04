import { normalizeGeminiAnalysis } from "../services/gemini.service";

describe("gemini service normalization", () => {
  it("parses and clamps Gemini payload safely", () => {
    const result = normalizeGeminiAnalysis({
      category: "Feature Request",
      sentiment: "Positive",
      priority_score: 99,
      summary: "   Users want roadmap notifications.   ",
      tags: ["Roadmap", "Notifications", 123],
    });

    expect(result.category).toBe("Feature Request");
    expect(result.sentiment).toBe("Positive");
    expect(result.priority_score).toBe(10);
    expect(result.summary).toBe("Users want roadmap notifications.");
    expect(result.tags).toEqual(["Roadmap", "Notifications"]);
  });
});

