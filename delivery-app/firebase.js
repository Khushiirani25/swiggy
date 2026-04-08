import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAL4ZAkCHwPURR8UK8r6O847wKeYyp2lhE",
  authDomain: "quickbite-10ba8.firebaseapp.com",
  projectId: "quickbite-10ba8",
  storageBucket: "quickbite-10ba8.firebasestorage.app",
  messagingSenderId: "457873968212",
  appId: "1:457873968212:web:a6a013f71bdb4f41d431c1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
