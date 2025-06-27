import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCNpmg4v-MgR4_nJGmhmM1Xe_akjVEX0mo",
  authDomain: "taskmanaging-145ab.firebaseapp.com",
  projectId: "taskmanaging-145ab",
  storageBucket: "taskmanaging-145ab.firebasestorage.app",
  messagingSenderId: "1011350435953",
  appId: "1:1011350435953:web:371cdc9eddb2a22e4543d0",
  measurementId: "G-HP42841L3D"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const provider = new GoogleAuthProvider();

export async function getIdToken() {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");
  return user.getIdToken();
}