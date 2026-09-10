export type Exercise = {
  id: string;
  name: string;
  pattern: string;
  load: "7 kg" | "peso corporal";
  unilateral: boolean;
  unit: "reps" | "seconds";
  cues: string[];
  demo: string;
  alternatives: string[];
};

export type TemplateExercise = {
  exerciseId: string;
  sets: number;
  target: string;
  rest: number;
};

export type WorkoutTemplate = {
  id: "A" | "B" | "C";
  name: string;
  focus: string;
  minutes: string;
  exercises: TemplateExercise[];
};

export const exercises: Exercise[] = [
  { id: "warm-mobility", name: "Movilidad de cadera y hombros", pattern: "calentamiento", load: "peso corporal", unilateral: false, unit: "seconds", cues: ["Respira lento", "Rango cómodo", "Sin dolor"], demo: "Círculos controlados, bisagra suave y apertura de pecho.", alternatives: ["march-place"] },
  { id: "march-place", name: "Marcha activa", pattern: "calentamiento", load: "peso corporal", unilateral: false, unit: "seconds", cues: ["Rodillas suaves", "Brazos activos", "Sube temperatura"], demo: "Marcha en el lugar con ritmo constante.", alternatives: ["warm-mobility"] },
  { id: "goblet-squat", name: "Sentadilla goblet", pattern: "sentadilla", load: "7 kg", unilateral: false, unit: "reps", cues: ["Mancuerna al pecho", "Rodillas acompañan los pies", "Sube empujando el piso"], demo: "Sentadilla con una mancuerna sostenida vertical frente al pecho.", alternatives: ["box-squat"] },
  { id: "box-squat", name: "Sentadilla a silla", pattern: "sentadilla", load: "peso corporal", unilateral: false, unit: "reps", cues: ["Toca y sube", "Controla la bajada", "Pecho largo"], demo: "Sentarse apenas en una silla y volver a ponerse de pie.", alternatives: ["goblet-squat"] },
  { id: "db-rdl", name: "Peso muerto rumano", pattern: "bisagra", load: "7 kg", unilateral: false, unit: "reps", cues: ["Cadera atrás", "Espalda larga", "Mancuerna cerca del cuerpo"], demo: "Bisagra de cadera con la mancuerna tomada con ambas manos.", alternatives: ["glute-bridge"] },
  { id: "glute-bridge", name: "Puente de glúteos", pattern: "bisagra", load: "peso corporal", unilateral: false, unit: "reps", cues: ["Costillas bajas", "Pausa arriba", "No arquees lumbar"], demo: "Acostado, pies apoyados, elevar la cadera con control.", alternatives: ["db-rdl"] },
  { id: "one-arm-row", name: "Remo a un brazo", pattern: "tirón", load: "7 kg", unilateral: true, unit: "reps", cues: ["Apoyo estable", "Codo hacia la cadera", "No gires el torso"], demo: "Remo inclinado con una mano libre apoyada en muslo o pared.", alternatives: ["prone-swimmer"] },
  { id: "prone-swimmer", name: "Nadador boca abajo", pattern: "tirón", load: "peso corporal", unilateral: false, unit: "reps", cues: ["Cuello neutral", "Movimiento lento", "Escápulas activas"], demo: "Boca abajo, mover brazos de frente hacia atrás sin carga.", alternatives: ["one-arm-row"] },
  { id: "floor-press", name: "Press de piso a un brazo", pattern: "empuje", load: "7 kg", unilateral: true, unit: "reps", cues: ["Codo a 45 grados", "Muñeca firme", "Hombro lejos de la oreja"], demo: "Acostado, empujar la mancuerna desde el piso con un brazo.", alternatives: ["incline-pushup"] },
  { id: "incline-pushup", name: "Flexión inclinada", pattern: "empuje", load: "peso corporal", unilateral: false, unit: "reps", cues: ["Cuerpo en bloque", "Manos firmes", "Baja con control"], demo: "Flexión con manos sobre mesa firme o pared.", alternatives: ["floor-press"] },
  { id: "split-squat", name: "Zancada estática", pattern: "pierna", load: "peso corporal", unilateral: true, unit: "reps", cues: ["Paso estable", "Baja vertical", "Empuja con la pierna delantera"], demo: "Zancada en el lugar, una pierna por vez.", alternatives: ["reverse-lunge"] },
  { id: "reverse-lunge", name: "Zancada atrás", pattern: "pierna", load: "peso corporal", unilateral: true, unit: "reps", cues: ["Paso atrás corto", "Tronco alto", "Vuelve sin impulso"], demo: "Alternar pasos hacia atrás con control.", alternatives: ["split-squat"] },
  { id: "suitcase-carry", name: "Carry valija", pattern: "core", load: "7 kg", unilateral: true, unit: "seconds", cues: ["Postura alta", "No inclines el torso", "Pasos cortos"], demo: "Caminar o sostener de pie la mancuerna a un lado.", alternatives: ["side-plank"] },
  { id: "side-plank", name: "Plancha lateral", pattern: "core", load: "peso corporal", unilateral: true, unit: "seconds", cues: ["Cadera alta", "Cuello largo", "Respira"], demo: "Plancha lateral desde rodilla o pies según tolerancia.", alternatives: ["dead-bug"] },
  { id: "dead-bug", name: "Dead bug", pattern: "core", load: "peso corporal", unilateral: false, unit: "reps", cues: ["Lumbar quieta", "Lento", "Exhala al extender"], demo: "Acostado boca arriba, alternar brazo y pierna opuestos.", alternatives: ["side-plank"] },
  { id: "calf-raise", name: "Elevación de talones", pattern: "pierna", load: "peso corporal", unilateral: false, unit: "reps", cues: ["Sube completo", "Pausa arriba", "Baja lento"], demo: "De pie, elevar talones con apoyo cercano para equilibrio.", alternatives: ["march-place"] },
  { id: "breathing", name: "Respiración y descarga", pattern: "cierre", load: "peso corporal", unilateral: false, unit: "seconds", cues: ["Exhalación larga", "Hombros sueltos", "Ritmo cómodo"], demo: "Respirar sentado o acostado para bajar pulsaciones.", alternatives: ["warm-mobility"] }
];

export const templates: WorkoutTemplate[] = [
  { id: "A", name: "A - Base", focus: "sentadilla, empuje y core", minutes: "32-38", exercises: [
    { exerciseId: "warm-mobility", sets: 1, target: "180 seg", rest: 30 },
    { exerciseId: "goblet-squat", sets: 3, target: "8-12 reps", rest: 75 },
    { exerciseId: "floor-press", sets: 3, target: "8-12 por lado", rest: 75 },
    { exerciseId: "one-arm-row", sets: 3, target: "10-12 por lado", rest: 75 },
    { exerciseId: "dead-bug", sets: 2, target: "8-10 por lado", rest: 45 },
    { exerciseId: "breathing", sets: 1, target: "120 seg", rest: 0 }
  ] },
  { id: "B", name: "B - Bisagra", focus: "cadera, tirón y estabilidad", minutes: "30-36", exercises: [
    { exerciseId: "march-place", sets: 1, target: "180 seg", rest: 30 },
    { exerciseId: "db-rdl", sets: 3, target: "10-12 reps", rest: 75 },
    { exerciseId: "split-squat", sets: 3, target: "8-10 por lado", rest: 75 },
    { exerciseId: "one-arm-row", sets: 3, target: "10-12 por lado", rest: 75 },
    { exerciseId: "side-plank", sets: 2, target: "20-35 seg por lado", rest: 45 },
    { exerciseId: "breathing", sets: 1, target: "120 seg", rest: 0 }
  ] },
  { id: "C", name: "C - Control", focus: "piernas, empuje y abdomen", minutes: "30-40", exercises: [
    { exerciseId: "warm-mobility", sets: 1, target: "180 seg", rest: 30 },
    { exerciseId: "reverse-lunge", sets: 3, target: "8-10 por lado", rest: 75 },
    { exerciseId: "incline-pushup", sets: 3, target: "6-12 reps", rest: 75 },
    { exerciseId: "glute-bridge", sets: 3, target: "12-15 reps", rest: 60 },
    { exerciseId: "suitcase-carry", sets: 2, target: "30-45 seg por lado", rest: 45 },
    { exerciseId: "calf-raise", sets: 2, target: "12-20 reps", rest: 45 }
  ] }
];

export const byId = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise])) as Record<string, Exercise>;
