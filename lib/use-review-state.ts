"use client";

import { useEffect, useMemo, useState } from "react";

import type { TranslationJob } from "@/lib/types";
import {
  buildReviewStateKey,
  createEmptyReviewState,
  loadReviewState,
  resetReviewState,
  saveReviewState,
  type ReviewState,
} from "@/lib/review-state";

export function useReviewState(job: TranslationJob) {
  const key = useMemo(() => buildReviewStateKey(job), [job]);
  const [hydrated, setHydrated] = useState(false);
  const [reviewState, setReviewState] = useState<ReviewState>(() => createEmptyReviewState(key));

  useEffect(() => {
    setReviewState(createEmptyReviewState(key));
    setHydrated(false);

    if (typeof window === "undefined") return;

    const loaded = loadReviewState(window.localStorage, key);
    setReviewState(loaded);
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    saveReviewState(window.localStorage, reviewState);
  }, [hydrated, reviewState]);

  const reset = () => {
    if (typeof window === "undefined") {
      setReviewState(createEmptyReviewState(key));
      return;
    }
    const state = resetReviewState(window.localStorage, key);
    setReviewState(state);
  };

  return {
    hydrated,
    reviewState,
    setReviewState,
    reset,
  };
}
