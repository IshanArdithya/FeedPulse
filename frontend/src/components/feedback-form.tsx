"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { submitFeedback } from "@/lib/api";
import type { FeedbackCategory } from "@/types";

const categories: FeedbackCategory[] = [
  "Bug",
  "Feature Request",
  "Improvement",
  "Other",
];

const initialForm = {
  title: "",
  description: "",
  category: "Feature Request" as FeedbackCategory,
  submitterName: "",
  submitterEmail: "",
};

export function FeedbackForm() {
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const descriptionLength = form.description.length;

  const titleError = form.title.trim().length === 0 ? "Title is required." : null;
  const descriptionError =
    form.description.trim().length < 20
      ? "Description must be at least 20 characters."
      : null;
  const emailError =
    form.submitterEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitterEmail.trim())
      ? "Enter a valid email address."
      : null;

  const isValid = !titleError && !descriptionError && !emailError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      setError(titleError || descriptionError || emailError || "Please fix the form.");
      setMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const response = await submitFeedback(form);
      setMessage(response.message);
      setForm(initialForm);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while submitting feedback.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel space-y-5" onSubmit={handleSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <label className="field md:col-span-2">
          <span>Feedback title</span>
          <input
            value={form.title}
            maxLength={120}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="What should the team know right away?"
          />
          <small>{titleError ?? "Keep it short and specific."}</small>
        </label>

        <label className="field md:col-span-2">
          <span>Description</span>
          <textarea
            value={form.description}
            rows={6}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Describe the bug, request, or improvement in enough detail for a product team to act on it."
          />
          <div className="flex items-center justify-between text-sm text-[var(--muted-strong)]">
            <small>{descriptionError ?? "Minimum 20 characters."}</small>
            <span>{descriptionLength} characters</span>
          </div>
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={form.category}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                category: event.target.value as FeedbackCategory,
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
          <span>Your name</span>
          <input
            value={form.submitterName}
            onChange={(event) =>
              setForm((current) => ({ ...current, submitterName: event.target.value }))
            }
            placeholder="Optional"
          />
        </label>

        <label className="field md:col-span-2">
          <span>Email</span>
          <input
            type="email"
            value={form.submitterEmail}
            onChange={(event) =>
              setForm((current) => ({ ...current, submitterEmail: event.target.value }))
            }
            placeholder="Optional"
          />
          <small>{emailError ?? "Optional, in case the team needs follow-up context."}</small>
        </label>
      </div>

      {(message || error) && (
        <div className={message ? "notice notice-success" : "notice notice-error"}>
          {message ?? error}
        </div>
      )}

      <button className="button-primary" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Submitting..." : "Submit feedback"}
      </button>
    </form>
  );
}
