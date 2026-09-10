import type { WorkoutTemplate } from "../data/catalog";

export type Profile = {
  id: "me";
  strengthDays: number[];
  padelDays: number[];
  preferredMinutes: number;
  goal: string;
  customTemplates?: WorkoutTemplate[];
  weightKg?: number;
  lastBackupAt?: string;
};

export type LoggedSet = {
  exerciseId: string;
  set: number;
  left?: number;
  right?: number;
  value?: number;
  done: boolean;
};

export type WorkoutSession = {
  id: string;
  templateId: WorkoutTemplate["id"];
  template: WorkoutTemplate;
  status: "active" | "paused" | "completed" | "partial";
  startedAt: string;
  localDate: string;
  endedAt?: string;
  activeMs: number;
  lastResumedAt?: string;
  sets: LoggedSet[];
  effort?: number;
  notes?: string;
};

export type PadelSession = {
  id: string;
  date: string;
  minutes: number;
  effort: number;
};

export type WeightEntry = {
  id: string;
  date: string;
  kg: number;
  note?: string;
};

export type Backup = {
  version: 1;
  exportedAt: string;
  profile: Profile;
  sessions: WorkoutSession[];
  padel: PadelSession[];
  weights: WeightEntry[];
};
