export type Exercise = {
  id: string;
  name: string;
  pattern: string;
  load: "7 kg" | "peso corporal";
  unilateral: boolean;
  unit: "reps" | "seconds";
  images?: string[];
  imageNote?: string;
  cues: string[];
  demo: string;
  alternatives: string[];
};

export type TemplateExercise = {
  exerciseId: string;
  sets: number;
  target: string;
  rest: number;
  tempo?: string;
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
  { id: "goblet-squat", name: "Sentadilla goblet", pattern: "sentadilla", load: "7 kg", unilateral: false, unit: "reps", images: ["/exercises/Dumbbell_Squat/0.jpg", "/exercises/Dumbbell_Squat/1.jpg"], imageNote: "Referencia Free Exercise DB: sentadilla con mancuerna; usá una sola mancuerna al pecho.", cues: ["Mancuerna al pecho", "Rodillas acompañan los pies", "Sube empujando el piso"], demo: "Sentadilla con una mancuerna sostenida vertical frente al pecho.", alternatives: ["box-squat"] },
  { id: "box-squat", name: "Sentadilla a silla", pattern: "sentadilla", load: "peso corporal", unilateral: false, unit: "reps", images: ["/exercises/Bodyweight_Squat/0.jpg", "/exercises/Bodyweight_Squat/1.jpg"], imageNote: "Referencia Free Exercise DB: misma mecánica; tocá la silla suave y subí.", cues: ["Toca y sube", "Controla la bajada", "Pecho largo"], demo: "Sentarse apenas en una silla y volver a ponerse de pie.", alternatives: ["goblet-squat"] },
  { id: "db-rdl", name: "Peso muerto rumano", pattern: "bisagra", load: "7 kg", unilateral: false, unit: "reps", images: ["/exercises/Stiff-Legged_Dumbbell_Deadlift/0.jpg", "/exercises/Stiff-Legged_Dumbbell_Deadlift/1.jpg"], imageNote: "Referencia Free Exercise DB: bisagra con mancuerna; mantené una sola carga cerca del cuerpo.", cues: ["Cadera atrás", "Espalda larga", "Mancuerna cerca del cuerpo"], demo: "Bisagra de cadera con la mancuerna tomada con ambas manos.", alternatives: ["glute-bridge"] },
  { id: "glute-bridge", name: "Puente de glúteos", pattern: "bisagra", load: "peso corporal", unilateral: false, unit: "reps", images: ["/exercises/Butt_Lift_Bridge/0.jpg", "/exercises/Butt_Lift_Bridge/1.jpg"], cues: ["Costillas bajas", "Pausa arriba", "No arquees lumbar"], demo: "Acostado, pies apoyados, elevar la cadera con control.", alternatives: ["db-rdl"] },
  { id: "one-arm-row", name: "Remo a un brazo", pattern: "tirón", load: "7 kg", unilateral: true, unit: "reps", images: ["/exercises/One-Arm_Dumbbell_Row/0.jpg", "/exercises/One-Arm_Dumbbell_Row/1.jpg"], imageNote: "Referencia Free Exercise DB: si la foto usa banco, replicá el torso inclinado con apoyo en muslo o pared.", cues: ["Apoyo estable", "Codo hacia la cadera", "No gires el torso"], demo: "Remo inclinado con una mano libre apoyada en muslo o pared.", alternatives: ["prone-swimmer"] },
  { id: "prone-swimmer", name: "Nadador boca abajo", pattern: "tirón", load: "peso corporal", unilateral: false, unit: "reps", cues: ["Cuello neutral", "Movimiento lento", "Escápulas activas"], demo: "Boca abajo, mover brazos de frente hacia atrás sin carga.", alternatives: ["one-arm-row"] },
  { id: "floor-press", name: "Press de piso a un brazo", pattern: "empuje", load: "7 kg", unilateral: true, unit: "reps", images: ["/exercises/Dumbbell_Floor_Press/0.jpg", "/exercises/Dumbbell_Floor_Press/1.jpg"], imageNote: "Referencia Free Exercise DB: hacelo de a un brazo aunque la imagen muestre dos.", cues: ["Codo a 45 grados", "Muñeca firme", "Hombro lejos de la oreja"], demo: "Acostado, empujar la mancuerna desde el piso con un brazo.", alternatives: ["incline-pushup"] },
  { id: "incline-pushup", name: "Flexión inclinada", pattern: "empuje", load: "peso corporal", unilateral: false, unit: "reps", images: ["/exercises/Incline_Push-Up/0.jpg", "/exercises/Incline_Push-Up/1.jpg"], cues: ["Cuerpo en bloque", "Manos firmes", "Baja con control"], demo: "Flexión con manos sobre mesa firme o pared.", alternatives: ["floor-press"] },
  { id: "split-squat", name: "Zancada estática", pattern: "pierna", load: "peso corporal", unilateral: true, unit: "reps", images: ["/exercises/Bodyweight_Walking_Lunge/0.jpg", "/exercises/Bodyweight_Walking_Lunge/1.jpg"], imageNote: "Referencia Free Exercise DB: quedate en el lugar para la zancada estática.", cues: ["Paso estable", "Baja vertical", "Empuja con la pierna delantera"], demo: "Zancada en el lugar, una pierna por vez.", alternatives: ["reverse-lunge"] },
  { id: "reverse-lunge", name: "Zancada atrás", pattern: "pierna", load: "peso corporal", unilateral: true, unit: "reps", images: ["/exercises/Crossover_Reverse_Lunge/0.jpg", "/exercises/Crossover_Reverse_Lunge/1.jpg"], imageNote: "Referencia Free Exercise DB: usá paso atrás recto, sin cruzar, si molesta la rodilla.", cues: ["Paso atrás corto", "Tronco alto", "Vuelve sin impulso"], demo: "Alternar pasos hacia atrás con control.", alternatives: ["split-squat"] },
  { id: "suitcase-carry", name: "Carry valija", pattern: "core", load: "7 kg", unilateral: true, unit: "seconds", cues: ["Postura alta", "No inclines el torso", "Pasos cortos"], demo: "Caminar o sostener de pie la mancuerna a un lado.", alternatives: ["side-plank"] },
  { id: "side-plank", name: "Plancha lateral", pattern: "core", load: "peso corporal", unilateral: true, unit: "seconds", images: ["/exercises/Side_Bridge/0.jpg", "/exercises/Side_Bridge/1.jpg"], cues: ["Cadera alta", "Cuello largo", "Respira"], demo: "Plancha lateral desde rodilla o pies según tolerancia.", alternatives: ["dead-bug"] },
  { id: "dead-bug", name: "Dead bug", pattern: "core", load: "peso corporal", unilateral: false, unit: "reps", images: ["/exercises/Dead_Bug/0.jpg", "/exercises/Dead_Bug/1.jpg"], cues: ["Lumbar quieta", "Lento", "Exhala al extender"], demo: "Acostado boca arriba, alternar brazo y pierna opuestos.", alternatives: ["side-plank"] },
  { id: "calf-raise", name: "Elevación de talones", pattern: "pierna", load: "peso corporal", unilateral: false, unit: "reps", images: ["/exercises/Calf_Raise_On_A_Dumbbell/0.jpg", "/exercises/Calf_Raise_On_A_Dumbbell/1.jpg"], imageNote: "Referencia Free Exercise DB: no hace falta pararse sobre la mancuerna; usá piso estable.", cues: ["Sube completo", "Pausa arriba", "Baja lento"], demo: "De pie, elevar talones con apoyo cercano para equilibrio.", alternatives: ["march-place"] },
  { id: "breathing", name: "Respiración y descarga", pattern: "cierre", load: "peso corporal", unilateral: false, unit: "seconds", cues: ["Exhalación larga", "Hombros sueltos", "Ritmo cómodo"], demo: "Respirar sentado o acostado para bajar pulsaciones.", alternatives: ["warm-mobility"] }
];

export const templates: WorkoutTemplate[] = [
  { id: "A", name: "A - Martes fuerte", focus: "sentadilla, empuje y tirón", minutes: "31-36", exercises: [
    { exerciseId: "warm-mobility", sets: 1, target: "180 seg", rest: 30, tempo: "fluido" },
    { exerciseId: "goblet-squat", sets: 3, target: "8-10 reps", rest: 75, tempo: "3s bajar · subir controlado" },
    { exerciseId: "floor-press", sets: 3, target: "8-10 por lado", rest: 75, tempo: "pausa breve abajo" },
    { exerciseId: "one-arm-row", sets: 3, target: "10-12 por lado", rest: 75, tempo: "1s apretar arriba" },
    { exerciseId: "dead-bug", sets: 2, target: "8-10 por lado", rest: 45, tempo: "lento, sin apuro" },
    { exerciseId: "breathing", sets: 1, target: "120 seg", rest: 0, tempo: "exhalación larga" }
  ] },
  { id: "B", name: "B - Miércoles control", focus: "bisagra, espalda y core", minutes: "28-34", exercises: [
    { exerciseId: "march-place", sets: 1, target: "180 seg", rest: 30, tempo: "ritmo cómodo" },
    { exerciseId: "db-rdl", sets: 3, target: "10-12 reps", rest: 75, tempo: "3s bajar · 1s pausa" },
    { exerciseId: "one-arm-row", sets: 3, target: "10-12 por lado", rest: 75, tempo: "tirón limpio, sin giro" },
    { exerciseId: "glute-bridge", sets: 2, target: "12-15 reps", rest: 60, tempo: "2s apretar arriba" },
    { exerciseId: "side-plank", sets: 2, target: "20-30 seg por lado", rest: 45, tempo: "respirar parejo" },
    { exerciseId: "breathing", sets: 1, target: "120 seg", rest: 0, tempo: "bajar pulsaciones" }
  ] },
  { id: "C", name: "C - Jueves liviano", focus: "pierna unilateral, empuje y postura", minutes: "27-33", exercises: [
    { exerciseId: "warm-mobility", sets: 1, target: "180 seg", rest: 30, tempo: "fluido" },
    { exerciseId: "split-squat", sets: 2, target: "8-10 por lado", rest: 75, tempo: "bajada lenta" },
    { exerciseId: "incline-pushup", sets: 3, target: "6-10 reps", rest: 75, tempo: "cuerpo firme" },
    { exerciseId: "suitcase-carry", sets: 2, target: "30-40 seg por lado", rest: 45, tempo: "postura alta" },
    { exerciseId: "calf-raise", sets: 2, target: "12-18 reps", rest: 45, tempo: "pausa arriba" },
    { exerciseId: "breathing", sets: 1, target: "120 seg", rest: 0, tempo: "exhalación larga" }
  ] }
];

export const byId = Object.fromEntries(exercises.map((exercise) => [exercise.id, exercise])) as Record<string, Exercise>;
