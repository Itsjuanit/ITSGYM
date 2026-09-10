import Dexie, { type EntityTable } from "dexie";
import { templates } from "../data/catalog";
import { todayKey, uid } from "./dates";
import type { Backup, PadelSession, Profile, WeightEntry, WorkoutSession } from "./types";

const defaultProfile: Profile = {
  id: "me",
  strengthDays: [2, 3, 4],
  padelDays: [],
  preferredMinutes: 35,
  goal: "Constancia y fuerza general con una mancuerna de 7 kg",
  customTemplates: templates,
  assessment: {
    level: "principiante",
    objective: "fuerza",
    lifestyle: "Entreno en casa martes, miércoles y jueves.",
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
  return {
    ...defaultProfile,
    ...profile,
    strengthDays: wasOldDefault ? defaultProfile.strengthDays : profile.strengthDays,
    padelDays: wasOldDefault ? defaultProfile.padelDays : profile.padelDays,
    customTemplates: profile.customTemplates ?? templates
  };
}

export const getProfile = async () => normalizeProfile(await db.profile.get("me"));

export const saveProfile = (profile: Profile) => db.profile.put(profile);

export async function startOrResumeSession(workoutTemplates = templates) {
  const active = await db.sessions.where("status").anyOf("active", "paused").first();
  if (active) {
    const resumed = { ...active, status: "active" as const, lastResumedAt: new Date().toISOString() };
    await db.sessions.put(resumed);
    return resumed;
  }

  const completed = await db.sessions.where("status").equals("completed").reverse().sortBy("startedAt");
  const next = workoutTemplates[(workoutTemplates.findIndex((item) => item.id === completed[0]?.templateId) + 1) % workoutTemplates.length];
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
  const activeMs = session.status === "active" && session.lastResumedAt
    ? session.activeMs + Date.now() - new Date(session.lastResumedAt).getTime()
    : session.activeMs;
  await db.sessions.put({ ...session, activeMs, lastResumedAt: session.status === "active" ? new Date().toISOString() : undefined });
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
