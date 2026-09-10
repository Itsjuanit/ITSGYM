import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { BrowserRouter } from "react-router-dom";
import { byId, exercises, templates, type TemplateExercise, type WorkoutTemplate } from "./data/catalog";
import { db, exportBackup, finishSession, getProfile, importBackup, saveProfile, startOrResumeSession, templateForDate, updateSession } from "./lib/db";
import { formatMinutes, todayKey, uid, weekdayName } from "./lib/dates";
import type { FitnessAssessment, LoggedSet, PadelSession, Profile, WeightEntry, WorkoutSession } from "./lib/types";
import "./styles.css";

type Snapshot = {
  profile: Profile;
  sessions: WorkoutSession[];
  padel: PadelSession[];
  weights: WeightEntry[];
};

const empty: Snapshot = { profile: { id: "me", strengthDays: [2, 3, 4], padelDays: [], preferredMinutes: 35, goal: "", customTemplates: templates }, sessions: [], padel: [], weights: [] };

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
  const workoutTemplates = data.profile.customTemplates ?? templates;
  return (
    <div className="shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Fuerza en casa</p>
          <h1>ITSGYM</h1>
        </div>
        <NavLink className="icon-link" to="/ajustes">Ajustes</NavLink>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Today data={data} refresh={refresh} workoutTemplates={workoutTemplates} />} />
          <Route path="/plan" element={<Plan data={data} refresh={refresh} workoutTemplates={workoutTemplates} />} />
          <Route path="/entrenar" element={<Training data={data} refresh={refresh} />} />
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

function Today({ data, refresh, workoutTemplates }: { data: Snapshot; refresh: () => Promise<void>; workoutTemplates: WorkoutTemplate[] }) {
  const navigate = useNavigate();
  const active = data.sessions.find((session) => session.status === "active" || session.status === "paused");
  const completed = data.sessions.filter((session) => session.status === "completed");
  const weekCompleted = completed.filter((session) => session.localDate >= todayKey(new Date(Date.now() - 6 * 86400000))).length;
  const todayTemplate = templateForDate(data.profile, workoutTemplates);
  const activeMatchesToday = active && (active.sets.length > 0 || active.templateId === todayTemplate.id);
  const next = activeMatchesToday ? active.template : todayTemplate;
  const start = async () => {
    await startOrResumeSession(workoutTemplates);
    await refresh();
    navigate("/entrenar");
  };
  return (
    <section className="stack">
      <article className="panel hero-panel today-hero">
        <div>
          <p className="eyebrow">{activeMatchesToday ? "Sesión abierta" : "Hoy toca"}</p>
          <h2>{activeMatchesToday ? `Continuar ${active.template.name}` : next.name}</h2>
          <p>{next.focus}. {estimateTemplateMinutes(next)} min estimados.</p>
        </div>
        <button className="primary" onClick={start}>{activeMatchesToday ? "Continuar" : "Empezar"}</button>
      </article>
      <article className="quick-stats">
        <div><strong>{weekCompleted}/3</strong><span>esta semana</span></div>
        <div><strong>{completed.length}</strong><span>sesiones</span></div>
        <div><strong>{data.weights[0]?.kg ?? data.profile.weightKg ?? "--"}</strong><span>kg actual</span></div>
      </article>
      <article className="panel">
        <div className="section-title">
          <h2>Semana</h2>
          <NavLink to="/plan">Editar</NavLink>
        </div>
        <Week profile={data.profile} workoutTemplates={workoutTemplates} />
      </article>
      <article className="panel">
        <h2>Próxima rutina</h2>
        <SessionPreview template={next} />
      </article>
      <article className="panel compact-panel">
        <h2>Último movimiento</h2>
        <p>{data.sessions[0] ? `${data.sessions[0].template.name} · ${sessionStatus(data.sessions[0].status)} · ${data.sessions[0].localDate}` : "Todavía no hay sesiones guardadas."}</p>
      </article>
    </section>
  );
}

function Week({ profile, workoutTemplates = templates }: { profile: Profile; workoutTemplates?: WorkoutTemplate[] }) {
  return (
    <div className="week">
      {[1, 2, 3, 4, 5, 6, 0].map((day) => (
        <div className="day" key={day}>
          <span>{weekdayName(day).slice(0, 3)}</span>
          <strong>{dayLabel(profile, workoutTemplates, day)}</strong>
        </div>
      ))}
    </div>
  );
}

function dayLabel(profile: Profile, workoutTemplates: WorkoutTemplate[], day: number) {
  const trainingIndex = profile.strengthDays.indexOf(day);
  if (trainingIndex >= 0) return workoutTemplates[trainingIndex]?.id ? `Rutina ${workoutTemplates[trainingIndex].id}` : "Fuerza";
  if (profile.padelDays.includes(day)) return "Pádel";
  return "Descanso";
}

function Plan({ data, refresh, workoutTemplates }: { data: Snapshot; refresh: () => Promise<void>; workoutTemplates: WorkoutTemplate[] }) {
  const [padel, setPadel] = useState({ date: todayKey(), minutes: 60, effort: 6 });
  const [draft, setDraft] = useState(workoutTemplates);
  const [message, setMessage] = useState("");
  useEffect(() => setDraft(workoutTemplates), [workoutTemplates]);
  const addPadel = async () => {
    await db.padel.add({ id: uid(), ...padel });
    await refresh();
  };
  const updateExercise = (templateId: WorkoutTemplate["id"], index: number, patch: Partial<TemplateExercise>) => {
    setDraft(draft.map((template) => template.id === templateId
      ? { ...template, exercises: template.exercises.map((item, i) => i === index ? { ...item, ...patch } : item) }
      : template));
  };
  const addExercise = (templateId: WorkoutTemplate["id"]) => {
    setDraft(draft.map((template) => template.id === templateId
      ? { ...template, exercises: [...template.exercises, { exerciseId: "goblet-squat", sets: 2, target: "8-12 reps", rest: 60, tempo: "controlado" }] }
      : template));
  };
  const removeExercise = (templateId: WorkoutTemplate["id"], index: number) => {
    setDraft(draft.map((template) => template.id === templateId && template.exercises.length > 1
      ? { ...template, exercises: template.exercises.filter((_, i) => i !== index) }
      : template));
  };
  const saveRoutines = async () => {
    await saveProfile({ ...data.profile, strengthDays: [2, 3, 4], padelDays: [], customTemplates: draft });
    setMessage("Rutinas guardadas.");
    await refresh();
  };
  return (
    <section className="stack">
      <article className="panel">
        <div className="section-title">
          <h2>Calendario</h2>
          <span>Martes, miércoles y jueves</span>
        </div>
        <Week profile={{ ...data.profile, strengthDays: [2, 3, 4], padelDays: [] }} workoutTemplates={draft} />
      </article>
      {draft.map((template) => (
        <article className="panel routine-card" key={template.id}>
          <div className="section-title">
            <div>
              <p className="eyebrow">Rutina {template.id}</p>
              <h2>{template.name}</h2>
            </div>
            <strong>{estimateTemplateMinutes(template)} min</strong>
          </div>
          <p>{template.focus} · {template.exercises.length} ejercicios</p>
          <div className="routine-editor">
            {template.exercises.map((item, index) => (
              <div className="routine-row" key={`${template.id}-${index}`}>
                <label>Ejercicio
                  <select value={item.exerciseId} onChange={(e) => updateExercise(template.id, index, { exerciseId: e.target.value })}>
                    {exercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                  </select>
                </label>
                <label>Series <input type="number" min="1" max="6" value={item.sets} onChange={(e) => updateExercise(template.id, index, { sets: Number(e.target.value) })} /></label>
                <label>Objetivo <input value={item.target} onChange={(e) => updateExercise(template.id, index, { target: e.target.value })} /></label>
                <label>Descanso <input type="number" min="0" step="15" value={item.rest} onChange={(e) => updateExercise(template.id, index, { rest: Number(e.target.value) })} /></label>
                <label>Tempo <input value={item.tempo ?? ""} onChange={(e) => updateExercise(template.id, index, { tempo: e.target.value })} /></label>
                <button className="danger" onClick={() => removeExercise(template.id, index)} disabled={template.exercises.length === 1}>Quitar</button>
              </div>
            ))}
          </div>
          <button onClick={() => addExercise(template.id)}>Agregar ejercicio</button>
        </article>
      ))}
      <div className="actions sticky-actions">
        <button onClick={() => setDraft(templates)}>Restaurar base</button>
        <button className="primary" onClick={saveRoutines}>Guardar rutinas</button>
      </div>
      {message && <p className="status">{message}</p>}
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
function Training({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const navigate = useNavigate();
  const [session, setSession] = useState<WorkoutSession>();
  const [index, setIndex] = useState(0);
  const [restUntil, setRestUntil] = useState<number>();
  const [now, setNow] = useState(Date.now());
  useEffect(() => { startOrResumeSession(data.profile.customTemplates ?? templates).then(setSession); }, [data.profile.customTemplates]);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  if (!session) return <p>Cargando sesión...</p>;
  const item = session.template.exercises[index];
  const exercise = byId[item.exerciseId];
  const done = session.sets.filter((set) => set.exerciseId === exercise.id && set.done).length;
  const isExerciseDone = done >= item.sets;
  const isLastExercise = index === session.template.exercises.length - 1;
  const restLeft = restUntil ? Math.max(0, Math.ceil((restUntil - now) / 1000)) : 0;
  const stateLabel = restLeft ? "Descanso" : isExerciseDone ? "Listo" : "Registrar";
  const progress = ((index + Math.min(done / item.sets, 1)) / session.template.exercises.length) * 100;
  const save = async (next: WorkoutSession) => {
    setSession(next);
    await updateSession(next);
    await refresh();
  };
  const logSet = async (value: LoggedSet) => {
    await save({ ...session, sets: [...session.sets, value] });
    setRestUntil(done + 1 < item.sets && item.rest ? Date.now() + item.rest * 1000 : undefined);
  };
  const undo = async () => {
    setRestUntil(undefined);
    await save({ ...session, sets: session.sets.slice(0, -1) });
  };
  const nextExercise = () => {
    setRestUntil(undefined);
    setIndex(Math.min(session.template.exercises.length - 1, index + 1));
  };
  const end = async (status: "completed" | "partial") => {
    await finishSession({ ...session, activeMs: liveMs(session) }, status);
    await refresh();
    navigate("/historial");
  };
  return (
    <section className="stack training">
      <article className="panel hero-panel training-hero">
        <div className="training-top">
          <div>
            <p className="eyebrow">{session.template.name}</p>
            <h2>{exercise.name}</h2>
          </div>
          <strong>{index + 1}/{session.template.exercises.length}</strong>
        </div>
        <div className="workout-progress" aria-label={`Progreso ${Math.round(progress)}%`}><span style={{ width: `${progress}%` }} /></div>
        <div className="training-meta">
          <span>{stateLabel}</span>
          <span>{exercise.load}</span>
          <span>{item.target}</span>
          {item.tempo && <span>{item.tempo}</span>}
        </div>
        <Demo exercise={exercise} />
      </article>
      <article className="panel action-panel">
        <div className="section-title">
          <h2>Serie {Math.min(done + 1, item.sets)}/{item.sets}</h2>
          <span>{done} confirmadas</span>
        </div>
        {restLeft > 0 ? (
          <div className="rest-card">
            <span>Descanso</span>
            <strong>{restLeft}s</strong>
            <button className="primary" onClick={() => setRestUntil(undefined)}>Saltar descanso</button>
          </div>
        ) : isExerciseDone ? (
          <div className="rest-card done">
            <span>Ejercicio completo</span>
            <strong>{done}/{item.sets}</strong>
            <button className="primary" onClick={isLastExercise ? () => end("completed") : nextExercise}>{isLastExercise ? "Finalizar" : "Siguiente ejercicio"}</button>
          </div>
        ) : exercise.unilateral
          ? <TwoSideSet key={`${exercise.id}-${done}`} exerciseId={exercise.id} setNumber={done + 1} unit={exercise.unit} initialValue={targetDefault(item.target, exercise.unit)} onSave={logSet} />
          : <OneValueSet key={`${exercise.id}-${done}`} exerciseId={exercise.id} setNumber={done + 1} unit={exercise.unit} initialValue={targetDefault(item.target, exercise.unit)} onSave={logSet} />}
        <div className="actions subtle-actions">
          <button onClick={undo} disabled={!session.sets.length}>Deshacer</button>
          <button onClick={nextExercise} disabled={isLastExercise}>Siguiente</button>
        </div>
      </article>
      <div className="actions sticky-actions">
        <button onClick={() => save({ ...session, status: "paused", activeMs: liveMs(session), lastResumedAt: undefined })}>Pausar</button>
        <button onClick={() => end("partial")}>Guardar parcial</button>
        <button className="primary" onClick={() => end("completed")}>Finalizar</button>
      </div>
    </section>
  );
}

function OneValueSet({ exerciseId, setNumber, unit, initialValue, onSave }: { exerciseId: string; setNumber: number; unit: "reps" | "seconds"; initialValue: number; onSave: (set: LoggedSet) => void }) {
  const [value, setValue] = useState(initialValue);
  return (
    <div className="set-row">
      <label>{unit === "seconds" ? "Segundos" : "Reps"} <input type="number" min="0" value={value} onChange={(e) => setValue(Number(e.target.value))} /></label>
      <button className="primary" onClick={() => onSave({ exerciseId, set: setNumber, value, done: true })}>Registrar serie</button>
    </div>
  );
}

function TwoSideSet({ exerciseId, setNumber, unit, initialValue, onSave }: { exerciseId: string; setNumber: number; unit: "reps" | "seconds"; initialValue: number; onSave: (set: LoggedSet) => void }) {
  const [left, setLeft] = useState(initialValue);
  const [right, setRight] = useState(initialValue);
  return (
    <div className="set-row two">
      <label>Izquierda <input type="number" min="0" value={left} onChange={(e) => setLeft(Number(e.target.value))} /></label>
      <label>Derecha <input type="number" min="0" value={right} onChange={(e) => setRight(Number(e.target.value))} /></label>
      <button className="primary" onClick={() => onSave({ exerciseId, set: setNumber, left, right, done: true })}>Registrar serie</button>
    </div>
  );
}

function ExerciseLine({ item }: { item: TemplateExercise }) {
  const exercise = byId[item.exerciseId];
  return <p><strong>{exercise.name}</strong><span>{item.sets} series · {item.target} · {item.rest}s{item.tempo ? ` · ${item.tempo}` : ""}</span></p>;
}

function SessionPreview({ template }: { template: WorkoutTemplate }) {
  return (
    <div className="session-preview">
      {template.exercises.map((item, index) => {
        const exercise = byId[item.exerciseId];
        return (
          <div key={`${template.id}-${item.exerciseId}-${index}`}>
            <span>{index + 1}</span>
            <p><strong>{exercise.name}</strong><small>{item.sets} series · {item.target} · {item.rest}s</small></p>
          </div>
        );
      })}
    </div>
  );
}

function Demo({ exercise }: { exercise: typeof exercises[number] }) {
  const guide = exerciseGuide(exercise);

  if (!exercise.images?.length) {
    return (
      <>
        <div className="demo fallback" role="img" aria-label={`Demostración: ${exercise.demo}`}>
          <strong>{exercise.pattern}</strong>
          <span>{exercise.demo}</span>
        </div>
        <ExerciseGuide guide={guide} />
      </>
    );
  }

  return (
    <>
      <figure className="exercise-demo">
        <div>
          <img src={exercise.images[0]} alt={`${exercise.name}: posición inicial`} />
          <figcaption>Inicio</figcaption>
        </div>
        <div>
          <img src={exercise.images[1] ?? exercise.images[0]} alt={`${exercise.name}: posición final`} />
          <figcaption>Final</figcaption>
        </div>
        <p>{exercise.imageNote ?? exercise.demo}</p>
      </figure>
      <ExerciseGuide guide={guide} />
    </>
  );
}

type ExerciseGuideData = { muscles: string[]; steps: string[]; mistake: string; easy?: string; hard?: string };

const guides: Record<string, ExerciseGuideData> = {
  "goblet-squat": { muscles: ["cuádriceps", "glúteos", "core"], steps: ["Mancuerna pegada al pecho.", "Cadera atrás y rodillas siguiendo los pies.", "Subí empujando el piso sin rebotar."], mistake: "Rodillas colapsando hacia adentro.", easy: "box-squat", hard: "split-squat" },
  "db-rdl": { muscles: ["isquios", "glúteos", "espalda alta"], steps: ["Mancuerna cerca del cuerpo.", "Cadera atrás con espalda larga.", "Volvé apretando glúteos, sin hiperextender."], mistake: "Bajar con la espalda redondeada.", easy: "glute-bridge", hard: "goblet-squat" },
  "one-arm-row": { muscles: ["dorsal", "romboides", "bíceps"], steps: ["Apoyá mano libre en muslo o pared.", "Tirá el codo hacia la cadera.", "Frená arriba un segundo."], mistake: "Girar el torso para levantar más.", easy: "prone-swimmer", hard: "db-rdl" },
  "floor-press": { muscles: ["pecho", "tríceps", "hombro"], steps: ["Acostate con codo a 45 grados.", "Empujá la mancuerna arriba.", "Bajá hasta tocar suave el piso."], mistake: "Subir el hombro hacia la oreja.", easy: "incline-pushup", hard: "goblet-squat" },
  "split-squat": { muscles: ["cuádriceps", "glúteos", "aductores"], steps: ["Armá un paso estable.", "Bajá vertical, sin irte hacia adelante.", "Subí usando la pierna delantera."], mistake: "Paso demasiado corto y rodilla incómoda.", easy: "reverse-lunge", hard: "goblet-squat" },
  "incline-pushup": { muscles: ["pecho", "tríceps", "core"], steps: ["Manos en mesa o pared firme.", "Cuerpo en una línea.", "Bajá con control y empujá fuerte."], mistake: "Cadera caída o cuello adelantado.", easy: "floor-press", hard: "split-squat" },
  "side-plank": { muscles: ["oblicuos", "glúteo medio", "hombro"], steps: ["Codo debajo del hombro.", "Cadera alta y cuerpo largo.", "Respirá sin perder postura."], mistake: "Dejar caer la cadera.", easy: "dead-bug", hard: "suitcase-carry" },
  "dead-bug": { muscles: ["core profundo", "flexores de cadera"], steps: ["Lumbar quieta contra el piso.", "Extendé brazo y pierna opuestos.", "Exhalá lento al extender."], mistake: "Arquear la zona lumbar.", easy: "breathing", hard: "side-plank" },
  "suitcase-carry": { muscles: ["oblicuos", "agarre", "trapecio"], steps: ["Mancuerna a un lado.", "Postura alta y costillas bajas.", "Caminá o sostené sin inclinarte."], mistake: "Compensar inclinando el torso.", easy: "side-plank", hard: "one-arm-row" },
  "calf-raise": { muscles: ["gemelos", "sóleo"], steps: ["Apoyate si necesitás equilibrio.", "Subí talones completo.", "Pausá arriba y bajá lento."], mistake: "Rebotar rápido sin rango.", easy: "march-place", hard: "split-squat" }
};

function exerciseGuide(exercise: typeof exercises[number]): ExerciseGuideData {
  return guides[exercise.id] ?? {
    muscles: [exercise.pattern],
    steps: exercise.cues,
    mistake: "Si aparece dolor, bajá dificultad o saltealo.",
    easy: exercise.alternatives[0]
  };
}

function ExerciseGuide({ guide }: { guide: ExerciseGuideData }) {
  return (
    <div className="exercise-guide">
      <div className="muscles">{guide.muscles.map((muscle) => <span key={muscle}>{muscle}</span>)}</div>
      <ol>{guide.steps.map((step) => <li key={step}>{step}</li>)}</ol>
      <p><strong>Error común:</strong> {guide.mistake}</p>
      <p>{guide.easy && <span>Más fácil: {byId[guide.easy]?.name}. </span>}{guide.hard && <span>Más difícil: {byId[guide.hard]?.name}.</span>}</p>
    </div>
  );
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
          <div className="section-title">
            <h2>{session.template.name}</h2>
            <span>{sessionStatus(session.status)}</span>
          </div>
          <p>{session.localDate} · {formatMinutes(session.activeMs)} · {session.sets.length} series</p>
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
  const adherence = Math.round((weekly / 3) * 100);
  return (
    <section className="stack">
      <article className="metrics">
        <div><span>{weekly}</span><p>fuerza esta semana</p></div>
        <div><span>{completed.length}</span><p>completadas</p></div>
        <div><span>{partial}</span><p>parciales</p></div>
      </article>
      <article className="panel">
        <div className="section-title">
          <h2>Adherencia</h2>
          <span>{adherence}%</span>
        </div>
        <div className="meter"><span style={{ width: `${Math.min(adherence, 100)}%` }} /></div>
        <p>Objetivo: 3 sesiones entre martes y jueves.</p>
      </article>
      <FitnessSystem data={data} />
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

function FitnessSystem({ data }: { data: Snapshot }) {
  const assessment = data.profile.assessment;
  const lastWeight = data.weights[0]?.kg ?? data.profile.weightKg ?? assessment?.weightKg;
  const bmi = lastWeight && assessment?.heightCm ? lastWeight / (assessment.heightCm / 100) ** 2 : undefined;
  const protein = lastWeight ? `${Math.round(lastWeight * 1.6)}-${Math.round(lastWeight * 2)} g/día` : "cargá peso para estimarlo";
  const completed30 = data.sessions.filter((session) => session.status === "completed" && session.localDate >= todayKey(new Date(Date.now() - 29 * 86400000))).length;
  const objective = assessment?.objective ?? "fuerza";
  return (
    <article className="panel">
      <h2>Sistema fitness</h2>
      <div className="system-grid">
        <section>
          <h3>Evaluación inicial</h3>
          <p>Nivel: {assessment?.level ?? "sin cargar"}. Objetivo: {objective}. IMC: {bmi ? bmi.toFixed(1) : "sin datos"}.</p>
          <p>Lesiones/molestias: {assessment?.injuries || "ninguna cargada"}.</p>
        </section>
        <section>
          <h3>Objetivos claros</h3>
          <p>Completar martes, miércoles y jueves. Meta base: 10 de 12 sesiones cada 4 semanas.</p>
          <p>Últimos 30 días: {completed30}/12 completadas.</p>
        </section>
        <section>
          <h3>Entrenamiento</h3>
          <p>A/B/C divide sentadilla, bisagra, empuje, tirón y core. En Plan podés cambiar ejercicios, series, objetivo y descanso.</p>
          <p>Progresión: subí reps solo cuando dos sesiones salgan cómodas y sin dolor.</p>
        </section>
        <section>
          <h3>Pérdida de grasa</h3>
          <p>Si ese es el objetivo, mantené las 3 sesiones y caminá más en días libres. El peso se mira por tendencia, no por un día suelto.</p>
        </section>
        <section>
          <h3>Músculo y recuperación</h3>
          <p>Proteína orientativa: {protein}. Dormí, repetí variantes comparables y frená si aparece dolor articular.</p>
        </section>
        <section>
          <h3>Hábitos y auditoría</h3>
          <p>Plan visible, entrenamiento registrado, peso opcional semanal y respaldo JSON. Revisá el plan si fallás dos semanas seguidas.</p>
        </section>
      </div>
    </article>
  );
}

function Settings({ data, refresh }: { data: Snapshot; refresh: () => Promise<void> }) {
  const [profile, setProfile] = useState(data.profile);
  const [message, setMessage] = useState("");
  useEffect(() => setProfile(data.profile), [data.profile]);
  const patchAssessment = (patch: Partial<FitnessAssessment>) => {
    setProfile({
      ...profile,
      assessment: { level: "principiante", objective: "fuerza", ...profile.assessment, ...patch }
    });
  };
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
        <div className="assessment-form">
          <label>Edad <input type="number" min="10" max="100" value={profile.assessment?.age ?? ""} onChange={(e) => patchAssessment({ age: optionalNumber(e.target.value) })} /></label>
          <label>Altura cm <input type="number" min="100" max="230" value={profile.assessment?.heightCm ?? ""} onChange={(e) => patchAssessment({ heightCm: optionalNumber(e.target.value) })} /></label>
          <label>Peso kg <input type="number" min="1" step="0.1" value={profile.assessment?.weightKg ?? ""} onChange={(e) => patchAssessment({ weightKg: optionalNumber(e.target.value) })} /></label>
          <label>Nivel
            <select value={profile.assessment?.level ?? "principiante"} onChange={(e) => patchAssessment({ level: e.target.value as FitnessAssessment["level"] })}>
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
          </label>
          <label>Objetivo fitness
            <select value={profile.assessment?.objective ?? "fuerza"} onChange={(e) => patchAssessment({ objective: e.target.value as FitnessAssessment["objective"] })}>
              <option value="fuerza">Fuerza</option>
              <option value="perder grasa">Perder grasa</option>
              <option value="ganar músculo">Ganar músculo</option>
              <option value="resistencia">Resistencia</option>
            </select>
          </label>
          <label>Lesiones o molestias <textarea value={profile.assessment?.injuries ?? ""} onChange={(e) => patchAssessment({ injuries: e.target.value })} /></label>
          <label>Estilo de vida <textarea value={profile.assessment?.lifestyle ?? ""} onChange={(e) => patchAssessment({ lifestyle: e.target.value })} /></label>
          <label>Nutrición actual <textarea value={profile.assessment?.nutrition ?? ""} onChange={(e) => patchAssessment({ nutrition: e.target.value })} /></label>
          <label>Recuperación <textarea value={profile.assessment?.recovery ?? ""} onChange={(e) => patchAssessment({ recovery: e.target.value })} /></label>
        </div>
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

function sessionStatus(status: WorkoutSession["status"]) {
  return ({ active: "activa", paused: "pausada", completed: "completa", partial: "parcial" } as const)[status];
}

function targetDefault(target: string, unit: "reps" | "seconds") {
  const numbers = target.match(/\d+/g)?.map(Number) ?? [];
  if (!numbers.length) return unit === "seconds" ? 30 : 10;
  return numbers.length > 1 ? Math.round((numbers[0] + numbers[1]) / 2) : numbers[0];
}

function estimateTemplateMinutes(template: WorkoutTemplate) {
  const seconds = template.exercises.reduce((total, item) => {
    const exercise = byId[item.exerciseId];
    const work = targetDefault(item.target, exercise.unit) * (exercise.unit === "seconds" ? 1 : 4) * (exercise.unilateral ? 2 : 1);
    return total + item.sets * (work + item.rest);
  }, 0);
  return Math.max(1, Math.round(seconds / 60));
}

function optionalNumber(value: string) {
  return value === "" ? undefined : Number(value);
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  </React.StrictMode>
);
