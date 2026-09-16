import { initializeApp, type FirebaseOptions } from "firebase/app";
import { GoogleAuthProvider, getAuth, onAuthStateChanged, signInAnonymously, signInWithPopup, signInWithRedirect, signOut, type User } from "firebase/auth";
import { doc, getDoc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import type { Backup } from "./types";

const config: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const cloudEnabled = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

const app = cloudEnabled ? initializeApp(config) : undefined;
export const auth = app ? getAuth(app) : undefined;
const firestore = app ? getFirestore(app) : undefined;
const provider = new GoogleAuthProvider();

export function watchCloudUser(setUser: (user: User | null) => void) {
  if (!auth) {
    setUser(null);
    return () => {};
  }
  return onAuthStateChanged(auth, setUser);
}

export const loginCloud = () => {
  if (!auth) throw new Error("Firebase no está configurado.");
  return signInWithPopup(auth, provider).catch(() => signInWithRedirect(auth, provider));
};

export const loginGuestCloud = () => {
  if (!auth) throw new Error("Firebase no está configurado.");
  return signInAnonymously(auth);
};

export const logoutCloud = () => auth ? signOut(auth) : Promise.resolve();

export async function saveCloudBackup(userId: string, backup: Backup) {
  if (!firestore) throw new Error("Firebase no está configurado.");
  await setDoc(doc(firestore, "users", userId), { backup, updatedAt: serverTimestamp() });
}

export async function loadCloudBackup(userId: string) {
  if (!firestore) throw new Error("Firebase no está configurado.");
  const snap = await getDoc(doc(firestore, "users", userId));
  return snap.exists() ? (snap.data().backup as Backup | undefined) : undefined;
}
