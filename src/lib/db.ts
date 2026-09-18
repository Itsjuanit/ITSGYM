import Dexie, { type EntityTable } from "dexie";
import { templates } from "../data/catalog";
import { todayKey, uid } from "./dates";
import type { Backup, PadelSession, Profile, WeightEntry, WorkoutSession } from "./types";

const defaultProfile: Profile = {
  id: "me",
  strengthDays: [1, 2, 3, 4, 5],
  padelDays: [],
  preferredMinutes: 35,
  goal: "Constancia y fuerza general con una mancuerna de 7 kg",
  customTemplates: templates,
  assessment: {
    level: "principiante",
    objective: "fuerza",
    lifestyle: "Entreno en casa de lunes a viernes, con lunes y viernes suaves.",
    recovery: "Priorizar sueño, técnica cómoda y no entrenar dolor fuerte."
  }
};

class GymDb extends Dexie {
  profile!: EntityTable<Profile, "id">;
  sessions!: EntityTable<WorkoutSession, "id">;
  padel!: EntityTable<PadelSession, "id">;
  weights!: EntityTable<WeightEntry, "id">;

  constructor() {
    super("fuerza-en-casa");
    this.version(1).stores({
      profile: "id",
      sessions: "id, status, localDate, startedAt, templateId",
      padel: "id, date",
      weights: "id, date"
    });
  }
}

export const db = new GymDb();

const sameDays = (a?: number[], b?: number[]) => JSON.stringify(a ?? []) === JSON.stringify(b ?? []);

function normalizeProfile(profile?: Profile): Profile {
  if (!profile) return defaultProfile;
  const wasOldDefault = sameDays(profile.strengthDays, [1, 3, 5]) && sameDays(profile.padelDays, [2, 4]);
  const wasThreeDayPlan = sameDays(profile.strengthDays, [2, 3, 4]) || (profile.customTemplates?.length ?? 0) < templates.length;
  const wasOldTemplates = ["A - Base", "A - Martes fuerte", "A - Piernas + hombros"].includes(profile.customTemplates?.[0]?.name ?? "");
  return {
    ...defaultProfile,
    ...profile,
    strengthDays: wasOldDefault || wasThreeDayPlan ? defaultProfile.strengthDays : profile.strengthDays,
    padelDays: wasOldDefault ? defaultProfile.padelDays : profile.padelDays,
    customTemplates: wasOldTemplates || wasThreeDayPlan ? templates : profile.customTemplates ?? templates
  };
}

export const getProfile = async () => normalizeProfile(await db.profile.get("me"));

export const saveProfile = (profile: Profile) => db.profile.put(profile);

export function templateForDate(profile: Profile, workoutTemplates = templates, date = new Date()) {
  const dayIndex = profile.strengthDays.indexOf(date.getDay());
  return workoutTemplates[dayIndex] ?? workoutTemplates[0];
}

export async function startOrResumeSession(workoutTemplates = templates) {
  const next = templateForDate(await getProfile(), workoutTemplates);
  const active = await db.sessions.where("status").anyOf("active", "paused").first();
  if (active) {
    const template = active.sets.length === 0 && active.templateId !== next.id ? structuredClone(next) : active.template;
    const resumed = { ...active, templateId: template.id, template, status: "active" as const, lastResumedAt: new Date().toISOString() };
    await db.sessions.put(resumed);
    return resumed;
  }

  const session: WorkoutSession = {
    id: uid(),
    templateId: next.id,
    template: structuredClone(next),
    status: "active",
    startedAt: new Date().toISOString(),
    localDate: todayKey(),
    activeMs: 0,
    lastResumedAt: new Date().toISOString(),
    sets: []
  };
  await db.sessions.add(session);
  return session;
}

export async function updateSession(session: WorkoutSession) {
  const current = await db.sessions.get(session.id);
  const next = current ? { ...current, ...session } : session;
  const activeMs = next.status === "active" && next.lastResumedAt
    ? next.activeMs + Date.now() - new Date(next.lastResumedAt).getTime()
    : next.activeMs;
  await db.sessions.put({ ...next, activeMs, lastResumedAt: next.status === "active" ? new Date().toISOString() : undefined });
}

export async function finishSession(session: WorkoutSession, status: "completed" | "partial") {
  await db.sessions.put({ ...session, status, endedAt: new Date().toISOString(), activeMs: session.activeMs });
}

export async function exportBackup(): Promise<Backup> {
  const profile = await getProfile();
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: { ...profile, lastBackupAt: new Date().toISOString() },
    sessions: await db.sessions.toArray(),
    padel: await db.padel.toArray(),
    weights: await db.weights.toArray()
  };
}

export async function importBackup(backup: unknown) {
  if (!backup || typeof backup !== "object" || (backup as Backup).version !== 1) throw new Error("Respaldo inválido");
  const data = backup as Backup;
  if (!Array.isArray(data.sessions) || !Array.isArray(data.padel) || !Array.isArray(data.weights) || !data.profile) throw new Error("Faltan datos");
  await db.transaction("rw", db.profile, db.sessions, db.padel, db.weights, async () => {
    await db.profile.clear();
    await db.sessions.clear();
    await db.padel.clear();
    await db.weights.clear();
    await db.profile.put(data.profile);
    await db.sessions.bulkPut(data.sessions);
    await db.padel.bulkPut(data.padel);
    await db.weights.bulkPut(data.weights);
  });
}
