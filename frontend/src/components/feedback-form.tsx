"use client";

import type { FormEvent } from "react";
import { useState, useRef } from "react";
import { submitFeedback } from "@/lib/api";
import type { FeedbackCategory } from "@/types";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Select } from "./ui/select";
import { Button } from "./ui/button";
import { toast } from "sonner";

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

const MAX_TITLE = 50;
const MIN_TITLE = 5;
const MAX_DESCRIPTION = 500;
const MIN_DESCRIPTION = 20;
const MIN_NAME = 5;
const MAX_NAME = 75;

export function FeedbackForm() {
  const [form, setForm] = useState(initialForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  const getTitleError = () => {
    if (!form.title.trim()) return "Title is required.";
    if (form.title.trim().length < MIN_TITLE) return `Min ${MIN_TITLE} characters required.`;
    if (form.title.length > MAX_TITLE) return "Maximum exceeded";
    return null;
  };

  const getDescriptionError = () => {
    if (!form.description.trim()) return "Description is required.";
    if (form.description.trim().length < MIN_DESCRIPTION) return `Min ${MIN_DESCRIPTION} characters required.`;
    if (form.description.length > MAX_DESCRIPTION) return "Maximum exceeded";
    return null;
  };

  const getNameError = () => {
    if (!form.submitterName.trim()) return null; // optional
    if (form.submitterName.trim().length < MIN_NAME) return `Min ${MIN_NAME} characters required.`;
    if (form.submitterName.length > MAX_NAME) return "Maximum exceeded";
    return null;
  };

  const getEmailError = () => {
    if (!form.submitterEmail.trim()) return null; // optional
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.submitterEmail.trim())) return "Enter a valid email address.";
    return null;
  };

  const titleError = getTitleError();
  const descriptionError = getDescriptionError();
  const nameError = getNameError();
  const emailError = getEmailError();

  const isValid = !titleError && !descriptionError && !nameError && !emailError;

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isValid) {
      setTouched({
        title: true,
        description: true,
        submitterName: true,
        submitterEmail: true,
        category: true,
      });

      // scroll to the first error
      if (titleError) titleRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      else if (descriptionError) descriptionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      else if (nameError) nameRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      else if (emailError) emailRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });

      return;
    }

    setIsSubmitting(true);

    try {
      await submitFeedback(form);
      toast.success("Thank you! Your feedback has been received and will be reviewed by our team.");
      setForm(initialForm);
      setTouched({});
    } catch (submissionError) {
      toast.error(
        submissionError instanceof Error
          ? submissionError.message
          : "Something went wrong while submitting feedback.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="panel space-y-6 p-6 md:p-7" onSubmit={handleSubmit}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Feedback form</p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-(--ink)">
            Share the issue clearly
          </h3>
        </div>
        <span className="mono-kicker hidden md:inline-block">Step 1 of 1</span>
      </div>

      <div className="surface-rule pt-6">
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            className="md:col-span-2"
            label="Feedback title"
            error={titleError}
            touched={touched.title}
            helpText="Keep it short and specific."
          >
            <Input
              ref={titleRef}
              value={form.title}
              maxLength={MAX_TITLE + 10}
              limit={MAX_TITLE}
              showCounter={true}
              onBlur={() => handleBlur("title")}
              onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
              placeholder="What should the team know right away?"
              error={titleError}
              touched={touched.title}
            />
          </Field>

          <Field
            className="md:col-span-2"
            label="Description"
            error={descriptionError}
            touched={touched.description}
            helpText="Minimum 20 characters."
          >
            <Textarea
              ref={descriptionRef}
              value={form.description}
              maxLength={MAX_DESCRIPTION + 50}
              limit={MAX_DESCRIPTION}
              showCounter={true}
              onBlur={() => handleBlur("description")}
              rows={3}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="Describe the bug, request, or improvement in enough detail for a product team to act on it."
              error={descriptionError}
              touched={touched.description}
            />
          </Field>

          <Field label="Category">
            <Select
              options={categories.map((c) => ({ label: c, value: c }))}
              value={form.category}
              onBlur={() => handleBlur("category")}
              onChange={(val) =>
                setForm((current) => ({
                  ...current,
                  category: val as FeedbackCategory,
                }))
              }
            />
          </Field>

          <Field
            label="Your name"
            error={nameError}
            touched={touched.submitterName}
            helpText="Optional, for follow-up context."
          >
            <Input
              ref={nameRef}
              value={form.submitterName}
              maxLength={MAX_NAME + 10}
              limit={MAX_NAME}
              showCounter={true}
              onBlur={() => handleBlur("submitterName")}
              onChange={(event) =>
                setForm((current) => ({ ...current, submitterName: event.target.value }))
              }
              placeholder="Optional"
              error={nameError}
              touched={touched.submitterName}
            />
          </Field>

          <Field
            className="md:col-span-2"
            label="Email"
            error={emailError}
            touched={touched.submitterEmail}
            helpText="Optional, for follow-up context."
          >
            <Input
              ref={emailRef}
              type="email"
              value={form.submitterEmail}
              onBlur={() => handleBlur("submitterEmail")}
              onChange={(event) =>
                setForm((current) => ({ ...current, submitterEmail: event.target.value }))
              }
              placeholder="Optional"
              error={emailError}
              touched={touched.submitterEmail}
            />
          </Field>
        </div>
      </div>

      <div className="surface-rule pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button className="min-w-[180px]" disabled={isSubmitting} type="submit">
            {isSubmitting ? "Submitting..." : "Submit feedback"}
          </Button>
        </div>
      </div>
    </form>
  );
}
