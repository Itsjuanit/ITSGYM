export const todayKey = (date = new Date()) => date.toLocaleDateString("en-CA");

export const weekdayName = (day: number) => ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"][day];

export const uid = () => crypto.randomUUID();

export const formatMinutes = (ms: number) => `${Math.max(1, Math.round(ms / 60000))} min`;
