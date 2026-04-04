import jwt from "jsonwebtoken";
import request from "supertest";
import { createApp } from "../app";
import { env } from "../config/env";
import { FeedbackModel } from "../models/feedback.model";
import { connectToDatabase } from "../services/database.service";

jest.mock("../services/gemini.service", () => ({
  analyzeFeedback: jest.fn(async () => ({
    category: "Feature Request",
    sentiment: "Positive",
    priority_score: 8,
    summary: "User wants dark mode in the dashboard settings.",
    tags: ["UI", "Settings"],
  })),
  generateWeeklySummary: jest.fn(async () => ({
    summary: "The top themes are UI polish, analytics, and faster workflows.",
    themes: [
      { theme: "UI polish", count: 3 },
      { theme: "Analytics", count: 2 },
      { theme: "Workflow speed", count: 2 },
    ],
  })),
}));

const app = createApp();
const adminToken = jwt.sign({ email: env.ADMIN_EMAIL, role: "admin" }, env.JWT_SECRET);

beforeAll(async () => {
  await connectToDatabase();
});

beforeEach(async () => {
  await FeedbackModel.deleteMany({});
});

describe("feedback api", () => {
  it("POST /api/feedback saves valid feedback and triggers AI processing", async () => {
    const response = await request(app).post("/api/feedback").send({
      title: "Please add dark mode",
      description: "Our team spends hours in the dashboard every day and a dark mode would reduce eye strain.",
      category: "Feature Request",
      submitterName: "Ishan",
      submitterEmail: "ishan@example.com",
    });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.ai_processed).toBe(true);
    expect(response.body.data.ai_priority).toBe(8);
  });

  it("POST /api/feedback rejects empty title", async () => {
    const response = await request(app).post("/api/feedback").send({
      title: "",
      description: "This description is long enough to pass the minimum length check.",
      category: "Bug",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  it("PATCH /api/feedback/:id updates status correctly", async () => {
    const feedback = await FeedbackModel.create({
      title: "Bug in analytics export",
      description: "CSV exports are failing for our support team with a timeout error.",
      category: "Bug",
    });

    const response = await request(app)
      .patch(`/api/feedback/${feedback.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Resolved" });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe("Resolved");
  });

  it("Auth middleware rejects unauthenticated requests", async () => {
    const response = await request(app).get("/api/feedback");
    expect(response.status).toBe(401);
  });

  it("GET /api/feedback/summary returns trend data", async () => {
    await FeedbackModel.create({
      title: "Need faster search",
      description: "The search results should load faster when we look through support conversations.",
      category: "Improvement",
      ai_summary: "Search results are too slow for support teams.",
      ai_tags: ["Search", "Performance"],
      ai_priority: 7,
      ai_sentiment: "Negative",
      ai_processed: true,
    });

    const response = await request(app)
      .get("/api/feedback/summary")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data.summary).toContain("top themes");
  });
});

