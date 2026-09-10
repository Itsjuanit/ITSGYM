import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { byId, exercises, templates } from "./data/catalog";
import { db, exportBackup, finishSession, getProfile, importBackup, saveProfile, startOrResumeSession, updateSession } from "./lib/db";
import { formatMinutes, todayKey, uid, weekdayName } from "./lib/dates";
import type { LoggedSet, PadelSession, Profile, WeightEntry, WorkoutSession } from "./lib/types";
import "./styles.css";

type Snapshot = {
  profile: Profile;
  sessions: WorkoutSession[];
  padel: PadelSession[];
  weights: WeightEntry[];
};

const empty: Snapshot = { profile: { id: "me", strengthDays: [1, 3, 5], padelDays: [2, 4], preferredMinutes: 35, goal: "" }, sessions: [], padel: [], weights: [] };

function useSnapshot() {
  const [data, setData] = useState<Snapshot>(empty);
  const refresh = async () => setData({
    profile: await getProfile(),
    sessions: await db.sessions.orderBy("startedAt").reverse().toArray(),
    padel: await db.padel.orderBy("date").reverse().toArray(),
    weights: await db.weights.orderBy("date").reverse().toArray()
  });
  useEffect(() => { refresh(); }, []);
  return { data, refresh };
}

function AppShell() {
  const { data, refresh } = useSnapshot();
  return (
    <div className="shell">
      <header>
        <div>
          <p className="eyebrow">Fuerza en casa</p>
          <h1>Una mancuerna. Tres sesiones. Registro real.</h1>
        </div>
        <NavLink className="icon-link" to="/ajustes">Ajustes</NavLink>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Today data={data} refresh={refresh} />} />
          <Route path="/plan" element={<Plan data={data} refresh={refresh} />} />
          <Route path="/entrenar" element={<Training refresh={refresh} />} />
          <Route path="/historial" element={<History data={data} refresh={refresh} />} />
          <Route path="/progreso" element={<Progress data={data} refresh={refresh} />} />
          <Route path="/ajustes" element={<Settings data={data} refresh={refresh} />} />
        </Routes>
      </main>
      <nav className="bottom">
        <NavLink to="/">Hoy</NavLink>
        <NavLink to="/plan">Plan</NavLink>
        <NavLink to="/historial">Historial</NavLink>
        <NavLink to="/progreso">Progreso</NavLink>
      </nav>
    </div>
  );
}

function Today({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const navigate = useNavigate();
  const active = data.sessions.find((session) => session.status === "active" || session.status === "paused");
  const completed = data.sessions.filter((session) => session.status === "completed");
  const next = active?.template ?? templates[(templates.findIndex((item) => item.id === completed[0]?.templateId) + 1) % templates.length];
  const start = async () => {
    await startOrResumeSession();
    await refresh();
    navigate("/entrenar");
  };
  return (
    <section className="stack">
      <article className="panel hero-panel">
        <p className="eyebrow">Hoy toca</p>
        <h2>{active ? `Continuar ${active.template.name}` : next.name}</h2>
        <p>{next.focus}. Duración orientativa: {next.minutes} minutos.</p>
        <button className="primary" onClick={start}>{active ? "Continuar" : "Empezar"}</button>
      </article>
      <article className="panel">
        <h2>Último movimiento</h2>
        <p>{data.sessions[0] ? `${data.sessions[0].template.name} · ${data.sessions[0].status} · ${data.sessions[0].localDate}` : "Todavía no hay sesiones guardadas."}</p>
      </article>
      <article className="panel">
        <h2>Semana</h2>
        <Week profile={data.profile} />
      </article>
    </section>
  );
}

function Week({ profile }: { profile: Profile }) {
  return (
    <div className="week">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
        <div className="day" key={day}>
          <span>{weekdayName(day).slice(0, 3)}</span>
          <strong>{profile.strengthDays.includes(day) ? "Fuerza" : profile.padelDays.includes(day) ? "Pádel" : "Descanso"}</strong>
        </div>
      ))}
    </div>
  );
}

function Plan({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const [padel, setPadel] = useState({ date: todayKey(), minutes: 60, effort: 6 });
  const addPadel = async () => {
    await db.padel.add({ id: uid(), ...padel });
    await refresh();
  };
  return (
    <section className="stack">
      <article className="panel">
        <h2>Calendario</h2>
        <Week profile={data.profile} />
      </article>
      {templates.map((template) => (
        <article className="panel" key={template.id}>
          <h2>{template.name}</h2>
          <p>{template.focus} · {template.minutes} min</p>
          <div className="list">
            {template.exercises.map((item) => <ExerciseLine key={item.exerciseId} item={item} />)}
          </div>
        </article>
      ))}
      <article className="panel">
        <h2>Registrar pádel</h2>
        <div className="form-grid">
          <label>Fecha <input type="date" value={padel.date} onChange={(e) => setPadel({ ...padel, date: e.target.value })} /></label>
          <label>Minutos <input type="number" min="1" value={padel.minutes} onChange={(e) => setPadel({ ...padel, minutes: Number(e.target.value) })} /></label>
          <label>Esfuerzo <input type="range" min="1" max="10" value={padel.effort} onChange={(e) => setPadel({ ...padel, effort: Number(e.target.value) })} /> {padel.effort}/10</label>
        </div>
        <button onClick={addPadel}>Guardar pádel</button>
      </article>
    </section>
  );
}

function Training({ refresh }: { refresh: () => Promise<void> }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession>();
  const [index, setIndex] = useState(0);
  const [restUntil, setRestUntil] = useState<number>();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { startOrResumeSession().then(setSession); }, []);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!session) return <p>Cargando sesión...</p>;
  const item = session.template.exercises[index];
  const exercise = byId[item.exerciseId];
  const done = session.sets.filter((set) => set.exerciseId === exercise.id && set.done).length;
  const restLeft = restUntil ? Math.max(0, Math.ceil((restUntil - now) / 1000)) : 0;
  const save = async (next: WorkoutSession) => {
    setSession(next);
    await updateSession(next);
    await refresh();
  };
  const logSet = async (value: LoggedSet) => {
    await save({ ...session, sets: [...session.sets, value] });
    setRestUntil(Date.now() + item.rest * 1000);
  };
  const undo = async () => {
    await save({ ...session, sets: session.sets.slice(0, -1) });
  };
  const end = async (status: "completed" | "partial") => {
    await finishSession({ ...session, activeMs: liveMs(session) }, status);
    await refresh();
    navigate("/historial");
  };
  return (
    <section className="stack">
      <article className="panel hero-panel">
        <p className="eyebrow">{session.template.name} · ejercicio {index + 1}/{session.template.exercises.length}</p>
        <h2>{exercise.name}</h2>
        <p>{exercise.load} · {item.target}</p>
        <div className="demo" role="img" aria-label={`Demostración: ${exercise.demo}`}>
          <strong>{exercise.pattern}</strong>
          <span>{exercise.demo}</span>
        </div>
        <ul className="cues">{exercise.cues.map((cue) => <li key={cue}>{cue}</li>)}</ul>
      </article>
      <article className="panel">
        <h2>Series</h2>
        <p>{done}/{item.sets} confirmadas. Referencia anterior: completar con técnica cómoda.</p>
        {exercise.unilateral ? <TwoSideSet exerciseId={exercise.id} setNumber={done + 1} unit={exercise.unit} onSave={logSet} /> : <OneValueSet exerciseId={exercise.id} setNumber={done + 1} unit={exercise.unit} onSave={logSet} />}
        <div className="actions">
          <button onClick={undo} disabled={!session.sets.length}>Deshacer</button>
          <button onClick={() => setIndex(Math.min(session.template.exercises.length - 1, index + 1))} disabled={index === session.template.exercises.length - 1}>Siguiente</button>
        </div>
        {restLeft > 0 && <p className="timer">Descanso: {restLeft}s</p>}
      </article>
      <div className="actions sticky-actions">
        <button onClick={() => save({ ...session, status: "paused", activeMs: liveMs(session), lastResumedAt: undefined })}>Pausar</button>
        <button onClick={() => end("partial")}>Guardar parcial</button>
        <button className="primary" onClick={() => end("completed")}>Finalizar</button>
      </div>
    </section>
  );
}

function OneValueSet({ exerciseId, setNumber, unit, onSave }: { exerciseId: string; setNumber: number; unit: "reps" | "seconds"; onSave: (set: LoggedSet) => void }) {
  const [value, setValue] = useState(unit === "seconds" ? 30 : 10);
  return (
    <div className="set-row">
      <label>{unit === "seconds" ? "Segundos" : "Reps"} <input type="number" min="0" value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>
      <button onClick={() => onSave({ exerciseId, set: setNumber, value, done: true })}>Confirmar</button>
    </div>
  );
}

function TwoSideSet({ exerciseId, setNumber, unit, onSave }: { exerciseId: string; setNumber: number; unit: "reps" | "seconds"; onSave: (set: LoggedSet) => void }) {
  const [left, setLeft] = useState(unit === "seconds" ? 30 : 10);
  const [right, setRight] = useState(unit === "seconds" ? 30 : 10);
  return (
    <div className="set-row two">
      <label>Izquierda <input type="number" min="0" value={left} onChange={(e) => setLeft(Number(e.target.value))} /></label>
      <label>Derecha <input type="number" min="0" value={right} onChange={(e) => setRight(Number(e.target.value))} /></label>
      <button onClick={() => onSave({ exerciseId, set: setNumber, left, right, done: true })}>Confirmar</button>
    </div>
  );
}

function ExerciseLine({ item }: { item: { exerciseId: string; sets: number; target: string; rest: number } }) {
  const exercise = byId[item.exerciseId];
  return <p><strong>{exercise.name}</strong><span>{item.sets} series · {item.target} · {item.rest}s</span></p>;
}

function History({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const remove = async (id: string) => {
    if (confirm("¿Eliminar esta sesión?")) {
      await db.sessions.delete(id);
      await refresh();
    }
  };
  return (
    <section className="stack">
      {data.sessions.length === 0 && <article className="panel"><h2>Historial</h2><p>No hay entrenamientos todavía.</p></article>}
      {data.sessions.map((session) => (
        <article className="panel" key={session.id}>
          <h2>{session.template.name}</h2>
          <p>{session.localDate} · {session.status} · {formatMinutes(session.activeMs)} · {session.sets.length} series</p>
          <details>
            <summary>Detalle</summary>
            {session.sets.map((set, i) => <p key={`${set.exerciseId}-${i}`}>{byId[set.exerciseId].name}: {set.left != null ? `izquierda ${set.left} / derecha ${set.right}` : set.value}</p>)}
          </details>
          <button className="danger" onClick={() => remove(session.id)}>Eliminar</button>
        </article>
      ))}
    </section>
  );
}

function Progress({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const [weight, setWeight] = useState({ date: todayKey(), kg: data.profile.weightKg ?? 80, note: "" });
  const completed = data.sessions.filter((session) => session.status === "completed");
  const partial = data.sessions.filter((session) => session.status === "partial").length;
  const addWeight = async () => {
    await db.weights.add({ id: uid(), ...weight });
    await refresh();
  };
  const weekly = completed.filter((session) => session.localDate >= todayKey(new Date(Date.now() - 6 * 86400000))).length;
  return (
    <section className="stack">
      <article className="metrics">
        <div><span>{weekly}</span><p>fuerza esta semana</p></div>
        <div><span>{completed.length}</span><p>completadas</p></div>
        <div><span>{partial}</span><p>parciales</p></div>
      </article>
      <article className="panel">
        <h2>Rendimiento</h2>
        {exercises.filter((exercise) => data.sessions.some((session) => session.sets.some((set) => set.exerciseId === exercise.id))).slice(0, 6).map((exercise) => (
          <p key={exercise.id}><strong>{exercise.name}</strong><span>{bestSet(data.sessions, exercise.id)}</span></p>
        ))}
      </article>
      <article className="panel">
        <h2>Peso corporal</h2>
        <div className="form-grid">
          <label>Fecha <input type="date" value={weight.date} onChange={(e) => setWeight({ ...weight, date: e.target.value })} /></label>
          <label>Kg <input type="number" step="0.1" min="1" value={weight.kg} onChange={(e) => setWeight({ ...weight, kg: Number(e.target.value) })} /></label>
          <label>Nota <input value={weight.note} onChange={(e) => setWeight({ ...weight, note: e.target.value })} /></label>
        </div>
        <button onClick={addWeight}>Guardar peso</button>
        {data.weights.map((entry) => <p key={entry.id}>{entry.date}: {entry.kg} kg {entry.note}</p>)}
      </article>
    </section>
  );
}

function Settings({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const [profile, setProfile] = useState(data.profile);
  const [message, setMessage] = useState("");
  useEffect(() => setProfile(data.profile), [data.profile]);
  const download = async () => {
    const backup = await exportBackup();
    await saveProfile(backup.profile);
    const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `fuerza-en-casa-${todayKey()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await refresh();
  };
  const upload = async (file?: File) => {
    if (!file) return;
    try {
      await importBackup(JSON.parse(await file.text()));
      setMessage("Respaldo restaurado.");
      await refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo restaurar.");
    }
  };
  return (
    <section className="stack">
      <article className="panel">
        <h2>Ajustes</h2>
        <label>Duración preferida <input type="number" min="20" max="60" value={profile.preferredMinutes} onChange={(e) => setProfile({ ...profile, preferredMinutes: Number(e.target.value) })} /></label>
        <label>Objetivo <textarea value={profile.goal} onChange={(e) => setProfile({ ...profile, goal: e.target.value })} /></label>
        <button onClick={async () => { await saveProfile(profile); await refresh(); setMessage("Ajustes guardados."); }}>Guardar ajustes</button>
      </article>
      <article className="panel">
        <h2>Respaldo</h2>
        <p>Último respaldo: {data.profile.lastBackupAt ? new Date(data.profile.lastBackupAt).toLocaleString("es-AR") : "pendiente"}</p>
        <div className="actions">
          <button onClick={download}>Exportar JSON</button>
          <label className="file">Importar <input type="file" accept="application/json" onChange={(e) => upload(e.target.files?.[0])} /></label>
        </div>
        {message && <p className="status">{message}</p>}
      </article>
    </section>
  );
}

function liveMs(session: WorkoutSession) {
  return session.status === "active" && session.lastResumedAt ? session.activeMs + Date.now() - new Date(session.lastResumedAt).getTime() : session.activeMs;
}

function bestSet(sessions: WorkoutSession[], exerciseId: string) {
  const values = sessions.flatMap((session) => session.sets.filter((set) => set.exerciseId === exerciseId).map((set) => set.value ?? Math.min(set.left ?? 0, set.right ?? 0)));
  return values.length ? `mejor registro: ${Math.max(...values)}` : "sin registros";
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);
