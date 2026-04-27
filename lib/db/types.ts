export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Profile = {
  id: string;
  created_at: string;
  updated_at: string;
  display_name: string | null;
  avatar_url: string | null;
  locale: string;
  plan: "free" | "pro" | "admin";
};

export type BbqEvent = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  saved_menu_id: string | null;
  title: string;
  event_date: string | null;
  guests: number | null;
  notes: string | null;
};

export type CookingSession = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string | null;
  saved_menu_id: string | null;
  bbq_event_id: string | null;
  animal: string | null;
  cut: string | null;
  doneness: string | null;
  thickness_cm: number | null;
  equipment: string | null;
  lang: string;
  plan: Json;
  steps: Json;
  status: "generated" | "saved" | "completed" | "failed";
};

export type AnalyticsEvent = {
  id: string;
  created_at: string;
  user_id: string | null;
  session_id: string | null;
  event_name: string;
  source: string;
  payload: Json;
};

export type QaRun = {
  id: string;
  created_at: string;
  user_id: string | null;
  source: string;
  total: number;
  passed: number;
  failed: number;
  avg_score: number | null;
  duration_ms: number | null;
  metadata: Json;
};

export type QaFailure = {
  id: string;
  created_at: string;
  qa_run_id: string;
  user_id: string | null;
  animal: string | null;
  cut: string | null;
  doneness: string | null;
  thickness: number | null;
  equipment: string | null;
  error: string;
  score: number | null;
  metadata: Json;
};
